import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Weight, Footprints, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useTimeWindow } from '../hooks/useTimeWindow';
import { supabase } from '../lib/supabase';
import { todayStr } from '../utils/date';

export default function RecordForm({ memberId }: { memberId: string }) {
  const { submitRecord } = useApp();
  const isWindowOpen = useTimeWindow();
  const [weight, setWeight]               = useState('');
  const [distance, setDistance]           = useState('');
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const today = todayStr();

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.from('hf_daily_records').select('id')
        .eq('member_id', memberId).eq('date', today).maybeSingle();
      setHasSubmittedToday(!!data);
    };
    check();
  }, [memberId, today]);

  const isDisabled = !isWindowOpen || hasSubmittedToday;
  const canSubmit  = !isDisabled && weight !== '' && distance !== '' && !isSubmitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await submitRecord(parseFloat(weight), parseFloat(distance));
      setWeight(''); setDistance('');
      setHasSubmittedToday(true);
      setJustSubmitted(true);
      setTimeout(() => setJustSubmitted(false), 3500);
    } finally { setIsSubmitting(false); }
  };

  return (
    <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
          <Clock className="w-4 h-4 text-indigo-500" />
        </div>
        <div>
          <h2 className="font-bold text-slate-800 leading-none">今日の記録</h2>
          <p className="text-xs text-slate-400 mt-0.5">提出受付：毎日 19:00 〜 23:59</p>
        </div>
      </div>
      <AnimatePresence mode="wait">
        {justSubmitted ? (
          <motion.div key="success" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-2xl px-4 py-3 mb-4">
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            <p className="text-sm font-bold text-green-700">記録しました！🎉</p>
          </motion.div>
        ) : isDisabled ? (
          <motion.div key="disabled" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 rounded-2xl px-4 py-3 mb-4 ${
              hasSubmittedToday ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'
            }`}>
            {hasSubmittedToday
              ? <><CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /><p className="text-sm font-semibold text-green-700">本日の記録は提出済みです ✓</p></>
              : <><AlertCircle  className="w-4 h-4 text-amber-500 flex-shrink-0" /><p className="text-sm font-semibold text-amber-700">提出できる時間は 19:00～23:59 のみです</p></>
            }
          </motion.div>
        ) : null}
      </AnimatePresence>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">体重 (kg)</label>
            <div className="relative">
              <Weight className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
              <input type="number" step="0.1" min="0" max="300" placeholder="00.0"
                value={weight} onChange={e => setWeight(e.target.value)} disabled={isDisabled}
                className="w-full bg-slate-50 rounded-2xl py-4 pl-12 pr-4 text-xl font-bold focus:ring-2 focus:ring-indigo-400 outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">走行距離 (km)</label>
            <div className="relative">
              <Footprints className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
              <input type="number" step="0.1" min="0" max="1000" placeholder="0.0"
                value={distance} onChange={e => setDistance(e.target.value)} disabled={isDisabled}
                className="w-full bg-slate-50 rounded-2xl py-4 pl-12 pr-4 text-xl font-bold focus:ring-2 focus:ring-indigo-400 outline-none transition-all disabled:opacity-40 disabled:cursor-not-allowed" />
            </div>
          </div>
        </div>
        <button type="submit" disabled={!canSubmit}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] ${
            canSubmit ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700' : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
          }`}>
          {isSubmitting
            ? <span className="flex items-center justify-center gap-2">
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  className="block w-5 h-5 border-2 border-indigo-300 border-t-white rounded-full" />
                送信中...
              </span>
            : '提出する'
          }
        </button>
      </form>
    </section>
  );
}
