import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, Flame, Zap, CheckCircle, XCircle, Trophy, Users,
  CreditCard, ArrowLeftRight, RefreshCw,
} from 'lucide-react';
import Header from './Header';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { todayStr, currentMonthStr, nextMonthStr, formatMonthJP, isFirstDayOfMonth, isLastDayOfMonth } from '../utils/date';
import { PLAN_LABELS, getMonthlyCost } from '../types';
import type { DBMember, DBPayment, DBPlanChangeRequest } from '../types';

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { applyPenalty, confirmPayment, approvePlanChange, rejectPlanChange } = useApp();

  const [members, setMembers]           = useState<DBMember[]>([]);
  const [payments, setPayments]         = useState<DBPayment[]>([]);
  const [planRequests, setPlanRequests] = useState<(DBPlanChangeRequest & { member?: DBMember })[]>([]);
  const [submittedToday, setSubmittedToday] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const today = todayStr();
  const month = currentMonthStr();

  const fetchAll = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [
        { data: mems },
        { data: pays },
        { data: reqs },
        { data: recs },
      ] = await Promise.all([
        supabase.from('hf_members').select('*').order('created_at'),
        supabase.from('hf_payments').select('*').eq('status', 'pending').order('created_at'),
        supabase.from('hf_plan_change_requests').select('*').eq('status', 'pending').order('created_at'),
        supabase.from('hf_daily_records').select('member_id').eq('date', today),
      ]);

      const memberList = mems ?? [];
      setMembers(memberList);
      setPayments(pays ?? []);
      setSubmittedToday(new Set((recs ?? []).map(r => r.member_id)));

      // Attach member info to plan requests
      const memberMap = Object.fromEntries(memberList.map(m => [m.id, m]));
      setPlanRequests((reqs ?? []).map(r => ({ ...r, member: memberMap[r.member_id] })));
    } finally {
      setIsRefreshing(false);
    }
  }, [today]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Auto-create monthly billing records on the correct day per plan:
  //   lazy  (¥600)  → 1st of month (or join date for the first month)
  //   active (¥1000) → last day of month (so discount is finalised)
  useEffect(() => {
    const ensureMonthlyBilling = async () => {
      const firstDay = isFirstDayOfMonth();
      const lastDay  = isLastDayOfMonth();
      // If today is neither the 1st nor the last day, nothing to do
      if (!firstDay && !lastDay) return;

      const { data: activeMembers } = await supabase
        .from('hf_members').select('*').eq('status', 'active');
      if (!activeMembers) return;

      const todayDayNum = new Date().getDate();

      for (const m of activeMembers) {
        // Determine whether billing should be created today for this member
        let shouldCreate = false;
        if (m.plan === 'lazy') {
          const joinMonth  = m.created_at.slice(0, 7);      // YYYY-MM
          const joinDayNum = new Date(m.created_at).getDate();
          const isJoinDay  = month === joinMonth && todayDayNum === joinDayNum;
          shouldCreate = firstDay || isJoinDay;
        } else {
          // active plan → bill at end of month
          shouldCreate = lastDay;
        }
        if (!shouldCreate) continue;

        // Avoid duplicates
        const { data: existing } = await supabase
          .from('hf_payments').select('id')
          .eq('member_id', m.id).eq('type', 'monthly').eq('billing_month', month)
          .maybeSingle();
        if (!existing) {
          await supabase.from('hf_payments').insert({
            member_id: m.id,
            amount: getMonthlyCost(m),
            type: 'monthly',
            billing_month: month,
            status: 'pending',
          });
        }
      }
      // Refresh
      const { data: pays } = await supabase.from('hf_payments').select('*').eq('status', 'pending').order('created_at');
      setPayments(pays ?? []);
    };
    ensureMonthlyBilling();
  }, [month]);

  const handlePenalty = async (memberId: string) => {
    await applyPenalty(memberId);
    fetchAll();
  };

  const handleConfirmPayment = async (paymentId: string) => {
    await confirmPayment(paymentId);
    fetchAll();
  };

  const handleApprovePlan = async (requestId: string) => {
    await approvePlanChange(requestId);
    fetchAll();
  };

  const handleRejectPlan = async (requestId: string) => {
    await rejectPlanChange(requestId);
    fetchAll();
  };

  const activeMembers = members.filter(m => m.status === 'active');
  const pendingMembers = members.filter(m => m.status === 'pending_payment');
  const pendingPayments = payments.filter(p => p.type === 'initial');
  const monthlyPayments = payments.filter(p => p.type === 'monthly');

  const memberMap = Object.fromEntries(members.map(m => [m.id, m]));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-slate-950">
      <Header />

      <main className="max-w-md mx-auto px-5 pt-6 pb-16 space-y-5">
        {/* ── Overview ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">管理者ダッシュボード</p>
                <p className="text-white font-bold text-base leading-tight">ファミリー概要</p>
              </div>
            </div>
            <button onClick={fetchAll} disabled={isRefreshing}
              className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-white">
                {submittedToday.size}
                <span className="text-slate-500 text-lg">/{activeMembers.length}</span>
              </p>
              <p className="text-slate-400 text-xs mt-1">本日の提出</p>
            </div>
            <div className="bg-slate-800 rounded-2xl p-3 text-center">
              <p className="text-2xl font-black text-white">{activeMembers.length}</p>
              <p className="text-slate-400 text-xs mt-1">アクティブ</p>
            </div>
            <div className="bg-slate-800 rounded-2xl p-3 text-center">
              <p className={`text-2xl font-black ${payments.length > 0 ? 'text-amber-400' : 'text-white'}`}>
                {payments.length}
              </p>
              <p className="text-slate-400 text-xs mt-1">未確認支払</p>
            </div>
          </div>
        </div>

        {/* ── Pending initial payments (new member approvals) ── */}
        {pendingMembers.length > 0 && (
          <div>
            <SectionLabel icon={<CreditCard className="w-3.5 h-3.5" />} label="初期費用の確認（新規メンバー）" />
            <div className="space-y-3">
              {pendingMembers.map(m => {
                const payment = pendingPayments.find(p => p.member_id === m.id);
                return (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900 border border-amber-900/50 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-xl flex-shrink-0">{m.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white">{m.name}</p>
                      <p className="text-xs text-slate-400">{PLAN_LABELS[m.plan]} · 初期費用 ¥500</p>
                    </div>
                    {payment && (
                      <button
                        onClick={() => handleConfirmPayment(payment.id)}
                        className="flex-shrink-0 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-colors"
                      >
                        承認
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Monthly payments ── */}
        {monthlyPayments.length > 0 && (
          <div>
            <SectionLabel icon={<CreditCard className="w-3.5 h-3.5" />} label={`月額費用の確認（${formatMonthJP(month)}）`} />
            <div className="space-y-2">
              {monthlyPayments.map(p => {
                const m = memberMap[p.member_id];
                if (!m) return null;
                return (
                  <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center text-lg flex-shrink-0">{m.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm">{m.name}</p>
                      <p className="text-xs text-slate-400">¥{p.amount.toLocaleString()} / {p.billing_month}</p>
                    </div>
                    <button
                      onClick={() => handleConfirmPayment(p.id)}
                      className="flex-shrink-0 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-colors"
                    >
                      確認
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Plan change requests ── */}
        {planRequests.length > 0 && (
          <div>
            <SectionLabel icon={<ArrowLeftRight className="w-3.5 h-3.5" />} label="プラン変更申請" />
            <div className="space-y-3">
              {planRequests.map(req => (
                <motion.div key={req.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                      {req.member?.emoji}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{req.member?.name}</p>
                      <p className="text-xs text-slate-400">
                        {PLAN_LABELS[req.from_plan]} → {PLAN_LABELS[req.to_plan]}
                      </p>
                      <p className="text-xs text-slate-500">{req.effective_month} 〜 適用</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprovePlan(req.id)}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-colors flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> 承認
                    </button>
                    <button
                      onClick={() => handleRejectPlan(req.id)}
                      className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-red-900 hover:text-red-300 transition-colors flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> 却下
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ── Member management ── */}
        <div>
          <SectionLabel icon={<Users className="w-3.5 h-3.5" />} label="メンバー管理" />
          <div className="space-y-3">
            {activeMembers.map((member, i) => {
              const memberSubmittedToday = submittedToday.has(member.id);
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
                >
                  <div className="p-4 flex items-start gap-3">
                    <div className="w-11 h-11 bg-slate-800 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      {member.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-white truncate">{member.name}</p>
                        {memberSubmittedToday ? (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400 text-xs font-semibold">提出済</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <XCircle className="w-4 h-4 text-slate-600" />
                            <span className="text-slate-600 text-xs font-semibold">未提出</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-orange-500" />
                          <span className="text-orange-400 text-sm font-bold">{member.streak}日</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                          <span className="text-slate-400 text-xs">最大 {member.max_streak}日</span>
                        </div>
                      </div>
                      <p className="text-slate-500 text-xs mt-1">{PLAN_LABELS[member.plan]} · ¥{getMonthlyCost(member).toLocaleString()}/月</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-800 px-4 py-3">
                    <motion.button
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handlePenalty(member.id)}
                      className="w-full flex items-center justify-center gap-2 bg-red-950/60 border border-red-900/70 text-red-400 rounded-xl py-2.5 text-sm font-bold hover:bg-red-900/60 hover:text-red-300 transition-all"
                    >
                      <Zap className="w-4 h-4" />
                      ストリークをリセット（ペナルティ）
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs px-4 pb-4 leading-relaxed">
          ペナルティを適用すると、そのメンバーのストリークが 0 にリセットされ、
          次回ログイン時に警告メッセージが表示されます。
        </p>
      </main>
    </motion.div>
  );
}

function SectionLabel({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-1 mb-3">
      <span className="text-slate-500">{icon}</span>
      <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</h2>
    </div>
  );
}
