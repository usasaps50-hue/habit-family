import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, ChevronDown, UtensilsCrossed, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { todayStr, formatJP, nowTimeStr } from '../utils/date';
import type { MealType, DBMealRecord } from '../types';

const MEAL_CONFIG: Record<MealType, { label: string; emoji: string; bg: string; text: string; border: string }> = {
  breakfast: { label: '朝食',   emoji: '🌅', bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200'  },
  lunch:     { label: '昼食',   emoji: '☀️', bg: 'bg-sky-50',    text: 'text-sky-700',    border: 'border-sky-200'    },
  dinner:    { label: '夕食',   emoji: '🌙', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  snack:     { label: 'おやつ', emoji: '🍪', bg: 'bg-pink-50',   text: 'text-pink-700',   border: 'border-pink-200'   },
  other:     { label: 'その他', emoji: '🍽️', bg: 'bg-slate-50',  text: 'text-slate-600',  border: 'border-slate-200'  },
};
const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'other'];

const suggestMealType = (timeStr: string): MealType => {
  const h = parseInt(timeStr.split(':')[0]);
  if (h >= 5 && h < 10)  return 'breakfast';
  if (h >= 11 && h < 14) return 'lunch';
  if (h >= 17 && h < 22) return 'dinner';
  return 'snack';
};

function MealBadge({ type }: { type: MealType }) {
  const c = MEAL_CONFIG[type];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs font-bold ${c.bg} ${c.text} ${c.border}`}>{c.emoji} {c.label}</span>;
}

function MealItem({ meal, onDelete }: { meal: DBMealRecord; onDelete: () => unknown }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <motion.div layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
      className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="flex-shrink-0 w-11 mt-0.5 text-center">
        <p className="text-sm font-black text-slate-700 leading-none">{meal.time}</p>
      </div>
      <div className="flex-1 min-w-0">
        <div className="mb-1"><MealBadge type={meal.meal_type} /></div>
        <p className="text-sm text-slate-700 leading-snug">{meal.description}</p>
      </div>
      <div className="flex-shrink-0">
        {confirm ? (
          <div className="flex items-center gap-1">
            <button onClick={onDelete} className="px-2 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors">削除</button>
            <button onClick={() => setConfirm(false)} className="p-1 text-slate-400"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <button onClick={() => setConfirm(true)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

function AddMealModal({ onClose, onSave }: { onClose: () => void; onSave: (t: string, mt: MealType, d: string) => void }) {
  const [time, setTime]         = useState(nowTimeStr);
  const [mealType, setMealType] = useState<MealType>(() => suggestMealType(nowTimeStr()));
  const [description, setDesc]  = useState('');
  const handleTimeChange = (v: string) => { setTime(v); setMealType(suggestMealType(v)); };
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
            <h3 className="font-bold text-lg text-slate-800">食事を記録</h3>
            <button onClick={onClose} className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
          </div>
          <form onSubmit={e => { e.preventDefault(); if (description.trim()) onSave(time, mealType, description.trim()); }} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">時刻</label>
              <input type="time" value={time} onChange={e => handleTimeChange(e.target.value)}
                className="w-full bg-slate-50 rounded-xl py-3 px-4 text-xl font-black text-slate-800 focus:ring-2 focus:ring-indigo-400 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">種類</label>
              <div className="flex flex-wrap gap-2">
                {MEAL_ORDER.map(type => {
                  const c = MEAL_CONFIG[type];
                  return (
                    <button key={type} type="button" onClick={() => setMealType(type)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border font-bold text-sm transition-all ${
                        mealType === type ? `${c.bg} ${c.text} ${c.border} ring-2 ring-offset-1 ring-indigo-400` : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}><span className="text-base">{c.emoji}</span>{c.label}</button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">内容</label>
              <textarea placeholder="例：ご飯、みそ汁、たまごやき" value={description} onChange={e => setDesc(e.target.value)}
                rows={2} autoFocus
                className="w-full bg-slate-50 rounded-xl py-3 px-4 text-base text-slate-800 focus:ring-2 focus:ring-indigo-400 outline-none resize-none leading-relaxed" />
            </div>
            <button type="submit" disabled={!description.trim()}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none transition-all active:scale-[0.98]">
              記録する
            </button>
          </form>
        </div>
      </motion.div>
    </>
  );
}

export default function MealSection({ memberId }: { memberId: string }) {
  const { addMeal, deleteMeal } = useApp();
  const [meals, setMeals]       = useState<DBMealRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const today = todayStr();

  const fetchMeals = useCallback(async () => {
    const { data } = await supabase.from('hf_meal_records').select('*')
      .eq('member_id', memberId).order('date', { ascending: true }).order('time', { ascending: true });
    setMeals((data as DBMealRecord[]) ?? []);
  }, [memberId]);

  useEffect(() => { fetchMeals(); }, [fetchMeals]);

  const handleSave = async (time: string, mealType: MealType, description: string) => {
    await addMeal(time, mealType, description); setShowForm(false); fetchMeals();
  };
  const handleDelete = async (mealId: string) => {
    await deleteMeal(mealId); setMeals(prev => prev.filter(m => m.id !== mealId));
  };

  const todayMeals = meals.filter(m => m.date === today);
  const pastMeals  = meals.filter(m => m.date !== today);
  const pastByDate = pastMeals.reduce((acc, m) => { (acc[m.date] ??= []).push(m); return acc; }, {} as Record<string, DBMealRecord[]>);
  const pastDates  = Object.keys(pastByDate).sort((a, b) => b.localeCompare(a)).slice(0, 7);

  return (
    <>
      <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center"><UtensilsCrossed className="w-4 h-4 text-pink-500" /></div>
            <div>
              <h2 className="font-bold text-slate-800 leading-none">食事記録</h2>
              <p className="text-xs text-slate-400 mt-0.5">今日の食事</p>
            </div>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-200">
            <Plus className="w-4 h-4" /> 追加
          </button>
        </div>
        <div className="px-6">
          {todayMeals.length === 0 ? (
            <div className="py-8 text-center text-slate-300">
              <p className="text-sm">まだ記録がありません</p>
              <p className="text-xs mt-1">「追加」ボタンから記録しましょう</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {todayMeals.map(meal => <MealItem key={meal.id} meal={meal} onDelete={() => handleDelete(meal.id)} />)}
            </AnimatePresence>
          )}
        </div>
        {pastDates.length > 0 && (
          <div className="border-t border-slate-50">
            <button onClick={() => setShowPast(v => !v)}
              className="w-full flex items-center justify-between px-6 py-3 text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
              <span className="font-semibold">過去の記録</span>
              <motion.span animate={{ rotate: showPast ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-4 h-4" />
              </motion.span>
            </button>
            <AnimatePresence>
              {showPast && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                  {pastDates.map(date => (
                    <div key={date} className="px-6 pb-2">
                      <p className="text-xs font-bold text-slate-300 uppercase tracking-wider pt-3 pb-1">{formatJP(date)}</p>
                      {pastByDate[date].map(meal => <MealItem key={meal.id} meal={meal} onDelete={() => handleDelete(meal.id)} />)}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </section>
      <AnimatePresence>
        {showForm && <AddMealModal onClose={() => setShowForm(false)} onSave={handleSave} />}
      </AnimatePresence>
    </>
  );
}
