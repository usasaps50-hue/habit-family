import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Trophy, CircleDollarSign, RefreshCw, ChevronRight, X } from 'lucide-react';
import Header from './Header';
import RecordForm from './RecordForm';
import ProgressChart from './ProgressChart';
import PenaltyModal from './PenaltyModal';
import MealSection from './MealSection';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { getMonthlyCost, PLAN_LABELS } from '../types';
import type { DBDailyRecord, DBPlanChangeRequest, Plan } from '../types';

function PlanChangeModal({ currentPlan, onClose, onRequest }: { currentPlan: Plan; onClose: () => void; onRequest: (plan: Plan) => Promise<void> }) {
  const [selected, setSelected] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const otherPlan: Plan = currentPlan === 'active' ? 'lazy' : 'active';
  const handleSubmit = async () => {
    if (!selected) return;
    setIsLoading(true);
    try { await onRequest(selected); onClose(); } finally { setIsLoading(false); }
  };
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
      <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 shadow-2xl">
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-1" />
        <div className="px-5 pb-8 pt-3">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-lg text-slate-800">プラン変更を申請</h3>
            <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
          </div>
          <p className="text-sm text-slate-500 mb-4">変更は翔月から適用されます。管理者の承認が必要です。</p>
          <div className="space-y-3 mb-5">
            <div className="rounded-2xl p-4 border-2 border-slate-200 bg-slate-50 opacity-60">
              <p className="text-xs text-slate-400 mb-0.5">現在のプラン</p>
              <p className="font-bold text-slate-700">{PLAN_LABELS[currentPlan]}</p>
            </div>
            <button onClick={() => setSelected(otherPlan)}
              className={`w-full text-left rounded-2xl p-4 border-2 transition-all ${
                selected === otherPlan ? 'border-indigo-400 bg-indigo-50 ring-2 ring-offset-1 ring-indigo-300' : 'border-slate-200 bg-white hover:border-indigo-200'
              }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">変更先</p>
                  <p className="font-bold text-slate-800">{PLAN_LABELS[otherPlan]}</p>
                  <p className="text-xs text-slate-500 mt-1">{otherPlan === 'lazy' ? '¥600/月（固定）' : '¥1,000〜（連続割引あり）'}</p>
                </div>
                <ChevronRight className={`w-5 h-5 transition-colors ${selected === otherPlan ? 'text-indigo-500' : 'text-slate-300'}`} />
              </div>
            </button>
          </div>
          <button onClick={handleSubmit} disabled={!selected || isLoading}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none transition-all active:scale-[0.98]">
            {isLoading ? '申請中...' : '申請する'}
          </button>
        </div>
      </motion.div>
    </>
  );
}

export default function MemberDashboard() {
  const { currentMember, clearPenaltyMessage, requestPlanChange } = useApp();
  const [records, setRecords]       = useState<DBDailyRecord[]>([]);
  const [planRequest, setPlanRequest] = useState<DBPlanChangeRequest | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentMember) return;
    const [{ data: recs }, { data: req }] = await Promise.all([
      supabase.from('hf_daily_records').select('*').eq('member_id', currentMember.id).order('date', { ascending: true }),
      supabase.from('hf_plan_change_requests').select('*').eq('member_id', currentMember.id).eq('status', 'pending').maybeSingle(),
    ]);
    setRecords(recs ?? []);
    setPlanRequest(req ?? null);
  }, [currentMember]);

  useEffect(() => { fetchData(); }, [fetchData]);
  if (!currentMember) return null;

  const monthlyCost = getMonthlyCost(currentMember);
  const savings = currentMember.plan === 'active' ? 1000 - monthlyCost : 0;
  const maxDiscount = 1000;
  const discountProgress = currentMember.plan === 'active' ? Math.min(1, savings / maxDiscount) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-slate-50">
      <Header />
      <AnimatePresence>
        {currentMember.has_penalty_message && <PenaltyModal onDismiss={clearPenaltyMessage} />}
      </AnimatePresence>
      <AnimatePresence>
        {showPlanModal && (
          <PlanChangeModal currentPlan={currentMember.plan} onClose={() => setShowPlanModal(false)}
            onRequest={async (plan) => { await requestPlanChange(plan); await fetchData(); }} />
        )}
      </AnimatePresence>
      <main className="max-w-md mx-auto px-5 pt-6 pb-16 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-orange-50 rounded-2xl p-3.5 flex flex-col gap-2">
            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm"><Flame className="w-4 h-4 text-orange-500 fill-orange-400" /></div>
            <div><p className="text-[10px] font-semibold text-slate-400 leading-tight">今月の連続</p><p className="font-black text-slate-800 text-base leading-tight mt-0.5">{currentMember.streak}日</p></div>
          </div>
          <div className="bg-yellow-50 rounded-2xl p-3.5 flex flex-col gap-2">
            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm"><Trophy className="w-4 h-4 text-yellow-500" /></div>
            <div><p className="text-[10px] font-semibold text-slate-400 leading-tight">最大記録</p><p className="font-black text-slate-800 text-base leading-tight mt-0.5">{currentMember.max_streak}日</p></div>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-3.5 flex flex-col gap-2">
            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm"><CircleDollarSign className="w-4 h-4 text-emerald-500" /></div>
            <div><p className="text-[10px] font-semibold text-slate-400 leading-tight">今月の節約</p><p className="font-black text-slate-800 text-base leading-tight mt-0.5">¥{savings.toLocaleString()}</p></div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-200 mb-1">今月の料金（見込み）</p>
          <div className="flex items-baseline gap-2 mb-3">
            <motion.span key={monthlyCost} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-black">¥{monthlyCost.toLocaleString()}</motion.span>
            <span className="text-indigo-200 text-sm">/ 月</span>
          </div>
          {currentMember.plan === 'active' ? (
            <>
              <div className="bg-white/20 rounded-full h-2 overflow-hidden mb-2">
                <motion.div initial={{ width: 0 }} animate={{ width: `${discountProgress * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }} className="h-full bg-white rounded-full" />
              </div>
              <p className="text-indigo-200 text-xs">{savings > 0 ? `🔥 ストリーク継続中！¥${savings.toLocaleString()} 節約中` : '記録を続けると月額が割引されます'}</p>
              {savings < maxDiscount && <p className="text-indigo-300 text-xs mt-0.5">最大割引まであと ¥{(maxDiscount - savings).toLocaleString()}</p>}
            </>
          ) : <p className="text-indigo-200 text-xs">サボっても大丈夫プラン（固定料金）</p>}
        </div>
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">現在のプラン</p>
            {!planRequest && <button onClick={() => setShowPlanModal(true)} className="text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors">変更申請</button>}
          </div>
          <p className="font-bold text-slate-800">{PLAN_LABELS[currentMember.plan]}</p>
          {planRequest && (
            <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-2xl px-3 py-2">
              <RefreshCw className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700 font-medium">{PLAN_LABELS[planRequest.to_plan]} への変更を申請中（{planRequest.effective_month} 〜）</p>
            </div>
          )}
        </div>
        <RecordForm memberId={currentMember.id} />
        <MealSection memberId={currentMember.id} />
        <ProgressChart records={records} />
      </main>
    </motion.div>
  );
}
