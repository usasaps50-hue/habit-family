import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { DBMember, Plan, MealType } from '../types';
import { todayStr, yesterdayStr, currentMonthStr, nextMonthStr } from '../utils/date';

const ADMIN_PASSWORD = 'ADMIN';

export type LoginResult = 'ok' | 'pending_payment' | 'wrong_password' | 'not_found';

interface AppContextValue {
  currentMember: DBMember | null;
  isAdmin: boolean;
  isLoading: boolean;
  loginMember: (name: string, password: string) => Promise<LoginResult>;
  loginAdmin: (password: string) => boolean;
  logout: () => void;
  registerMember: (data: { name: string; emoji: string; plan: Plan; password: string }) => Promise<void>;
  recheckMemberStatus: () => Promise<void>;
  submitRecord: (weight: number, distance: number) => Promise<void>;
  addMeal: (time: string, mealType: MealType, description: string) => Promise<void>;
  deleteMeal: (mealId: string) => Promise<void>;
  requestPlanChange: (toPlan: Plan) => Promise<void>;
  clearPenaltyMessage: () => Promise<void>;
  refreshCurrentMember: () => Promise<void>;
  applyPenalty: (memberId: string) => Promise<void>;
  confirmPayment: (paymentId: string) => Promise<void>;
  approvePlanChange: (requestId: string) => Promise<void>;
  rejectPlanChange: (requestId: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentMember, setCurrentMember] = useState<DBMember | null>(null);
  const [isAdmin, setIsAdmin]             = useState(false);
  const [isLoading, setIsLoading]         = useState(false);
  const memberRef = useRef<DBMember | null>(null);
  memberRef.current = currentMember;

  const refreshCurrentMember = useCallback(async () => {
    const id = memberRef.current?.id;
    if (!id) return;
    const { data } = await supabase.from('hf_members').select('*').eq('id', id).single();
    if (data) setCurrentMember(data);
  }, []);

  const syncStreak = async (member: DBMember): Promise<DBMember> => {
    const today = todayStr();
    const yesterday = yesterdayStr();
    const month = currentMonthStr();
    let updates: Partial<DBMember> = {};
    if (member.streak_month && member.streak_month !== month) {
      updates = { streak: 0, streak_month: month };
    } else if (member.streak > 0) {
      const { data: last } = await supabase
        .from('hf_daily_records').select('date').eq('member_id', member.id)
        .order('date', { ascending: false }).limit(1).maybeSingle();
      if (last && last.date !== today && last.date !== yesterday) updates = { streak: 0 };
    }
    if (Object.keys(updates).length === 0) return member;
    const { data } = await supabase.from('hf_members').update(updates).eq('id', member.id).select().single();
    return data ?? member;
  };

  const applyApprovedPlanChanges = async (member: DBMember): Promise<DBMember> => {
    const month = currentMonthStr();
    const { data: reqs } = await supabase
      .from('hf_plan_change_requests').select('*')
      .eq('member_id', member.id).eq('status', 'approved').lte('effective_month', month);
    if (!reqs || reqs.length === 0) return member;
    const latest = [...reqs].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    const { data: updated } = await supabase
      .from('hf_members').update({ plan: latest.to_plan }).eq('id', member.id).select().single();
    await supabase.from('hf_plan_change_requests').delete()
      .eq('member_id', member.id).eq('status', 'approved').lte('effective_month', month);
    return updated ?? member;
  };

  const loginMember = async (name: string, password: string): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const { data: rows } = await supabase.from('hf_members').select('*').eq('name', name.trim());
      if (!rows || rows.length === 0) return 'not_found';
      const member = rows[0] as DBMember;
      if (member.password !== password) return 'wrong_password';
      if (member.status === 'pending_payment') { setCurrentMember(member); return 'pending_payment'; }
      let m = await syncStreak(member);
      m = await applyApprovedPlanChanges(m);
      setCurrentMember(m);
      return 'ok';
    } finally { setIsLoading(false); }
  };

  const loginAdmin = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) { setIsAdmin(true); return true; }
    return false;
  };

  const logout = () => { setCurrentMember(null); setIsAdmin(false); };

  const registerMember = async ({ name, emoji, plan, password }: { name: string; emoji: string; plan: Plan; password: string }): Promise<void> => {
    setIsLoading(true);
    try {
      const { data: member, error } = await supabase
        .from('hf_members').insert({ name, emoji, plan, password, status: 'pending_payment' }).select().single();
      if (error || !member) throw new Error(error?.message ?? '登録に失敗しました');
      await supabase.from('hf_payments').insert({ member_id: member.id, amount: 500, type: 'initial', status: 'pending' });
      setCurrentMember(member);
    } finally { setIsLoading(false); }
  };

  const recheckMemberStatus = async (): Promise<void> => {
    const id = memberRef.current?.id;
    if (!id) return;
    setIsLoading(true);
    try {
      const { data } = await supabase.from('hf_members').select('*').eq('id', id).single();
      if (data) setCurrentMember(data as DBMember);
    } finally { setIsLoading(false); }
  };

  const submitRecord = async (weight: number, distance: number): Promise<void> => {
    const m = memberRef.current;
    if (!m) return;
    const today = todayStr();
    const yesterday = yesterdayStr();
    const month = currentMonthStr();
    await supabase.from('hf_daily_records').insert({ member_id: m.id, date: today, weight, distance });
    const isNewMonth = m.streak_month !== month;
    let newStreak: number;
    if (isNewMonth) {
      newStreak = 1;
    } else {
      const { data: yRec } = await supabase.from('hf_daily_records').select('id')
        .eq('member_id', m.id).eq('date', yesterday).maybeSingle();
      newStreak = yRec ? m.streak + 1 : 1;
    }
    await supabase.from('hf_members').update({
      streak: newStreak, max_streak: Math.max(m.max_streak, newStreak), streak_month: month,
    }).eq('id', m.id);
    await refreshCurrentMember();
  };

  const addMeal = async (time: string, mealType: MealType, description: string): Promise<void> => {
    const m = memberRef.current;
    if (!m) return;
    await supabase.from('hf_meal_records').insert({ member_id: m.id, date: todayStr(), time, meal_type: mealType, description });
  };

  const deleteMeal = async (mealId: string): Promise<void> => {
    await supabase.from('hf_meal_records').delete().eq('id', mealId);
  };

  const requestPlanChange = async (toPlan: Plan): Promise<void> => {
    const m = memberRef.current;
    if (!m) return;
    await supabase.from('hf_plan_change_requests').insert({
      member_id: m.id, from_plan: m.plan, to_plan: toPlan, status: 'pending', effective_month: nextMonthStr(),
    });
  };

  const clearPenaltyMessage = async (): Promise<void> => {
    const m = memberRef.current;
    if (!m) return;
    await supabase.from('hf_members').update({ has_penalty_message: false }).eq('id', m.id);
    setCurrentMember(prev => prev ? { ...prev, has_penalty_message: false } : null);
  };

  const applyPenalty = async (memberId: string): Promise<void> => {
    await supabase.from('hf_members').update({ streak: 0, has_penalty_message: true }).eq('id', memberId);
  };

  const confirmPayment = async (paymentId: string): Promise<void> => {
    await supabase.from('hf_payments').update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('id', paymentId);
    const { data: payment } = await supabase.from('hf_payments').select('*').eq('id', paymentId).single();
    if (payment?.type === 'initial') {
      await supabase.from('hf_members').update({ status: 'active' }).eq('id', payment.member_id);
    }
  };

  const approvePlanChange = async (requestId: string): Promise<void> => {
    await supabase.from('hf_plan_change_requests').update({ status: 'approved', effective_month: nextMonthStr() }).eq('id', requestId);
  };

  const rejectPlanChange = async (requestId: string): Promise<void> => {
    await supabase.from('hf_plan_change_requests').update({ status: 'rejected' }).eq('id', requestId);
  };

  return (
    <AppContext.Provider value={{
      currentMember, isAdmin, isLoading,
      loginMember, loginAdmin, logout, registerMember, recheckMemberStatus,
      submitRecord, addMeal, deleteMeal, requestPlanChange,
      clearPenaltyMessage, refreshCurrentMember,
      applyPenalty, confirmPayment, approvePlanChange, rejectPlanChange,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
