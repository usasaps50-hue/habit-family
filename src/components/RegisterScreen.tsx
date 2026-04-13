import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Check } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import type { Plan } from '../types';

const EMOJI_OPTIONS = ['👦', '👧', '👨', '👩', '🧔', '👴', '👵', '🧒', '👶', '🧑'];

const PLANS: { id: Plan; name: string; price: string; monthly: string; desc: string }[] = [
  { id: 'active', name: 'がんばるプラン', price: '¥1,000', monthly: '/月', desc: '連続記録 1日ごとに −20円 割引。毎日続けるほどお得！' },
  { id: 'lazy', name: 'サボっても大丈夫プラン', price: '¥600', monthly: '/月（固定）', desc: '割引なし、ペナルティなし。マイペースに使いたい方向け。' },
];

export default function RegisterScreen({ onBack }: { onBack: () => void }) {
  const { registerMember, isLoading } = useApp();
  const [step, setStep]               = useState<'plan' | 'info'>('plan');
  const [plan, setPlan]               = useState<Plan | null>(null);
  const [name, setName]               = useState('');
  const [emoji, setEmoji]             = useState('🧑');
  const [password, setPassword]       = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError]             = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!plan) return;
    if (password.length < 4) { setError('パスワードは4文字以上にしてください'); return; }
    if (password !== passwordConfirm) { setError('パスワードが一致しません'); return; }
    try {
      await registerMember({ name: name.trim(), emoji, plan, password });
    } catch {
      setError('登録に失敗しました。もう一度お試しください。');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-5 py-8">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 mb-6 hover:text-slate-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /><span className="text-sm font-medium">戻る</span>
      </button>
      <div className="max-w-sm mx-auto">
        <h1 className="text-2xl font-black text-slate-900 mb-1">新規登録</h1>
        <p className="text-slate-500 text-sm mb-8">{step === 'plan' ? 'まずプランを選んでください' : 'プロフィールを設定してください'}</p>
        <div className="flex items-center gap-3 mb-8">
          {(['plan', 'info'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s ? 'bg-indigo-600 text-white' :
                step === 'info' && s === 'plan' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
              }`}>
                {step === 'info' && s === 'plan' ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-xs font-semibold ${step === s ? 'text-indigo-600' : 'text-slate-400'}`}>
                {s === 'plan' ? 'プラン選択' : '情報入力'}
              </span>
              {i < 1 && <div className={`w-8 h-0.5 ${step === 'info' ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        {step === 'plan' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            {PLANS.map(p => (
              <button key={p.id} onClick={() => setPlan(p.id)}
                className={`w-full text-left rounded-2xl p-5 border-2 transition-all ${
                  plan === p.id ? 'border-indigo-400 bg-indigo-50 ring-2 ring-offset-1 ring-indigo-300' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-black text-slate-800 text-lg leading-tight">{p.name}</p>
                    <p className="text-slate-500 text-sm mt-1 leading-relaxed">{p.desc}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-indigo-600 text-xl">{p.price}</p>
                    <p className="text-slate-400 text-xs">{p.monthly}</p>
                  </div>
                </div>
              </button>
            ))}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-center">
              <p className="text-amber-700 text-sm font-semibold">初期費用 ¥500（全プラン共通）</p>
              <p className="text-amber-600 text-xs mt-0.5">登録後、管理者が確認してから利用開始できます</p>
            </div>
            <button onClick={() => plan && setStep('info')} disabled={!plan}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-[0.98]">
              次へ
            </button>
          </motion.div>
        )}

        {step === 'info' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">なまえ</label>
                <input type="text" placeholder="例：ゆうき" value={name} autoFocus
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 rounded-xl py-3 px-4 text-lg font-semibold focus:ring-2 focus:ring-indigo-400 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">アイコン</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map(e => (
                    <button key={e} type="button" onClick={() => setEmoji(e)}
                      className={`w-11 h-11 rounded-xl text-2xl flex items-center justify-center transition-all ${
                        emoji === e ? 'bg-indigo-100 ring-2 ring-indigo-400' : 'bg-slate-50 hover:bg-slate-100'
                      }`}>{e}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">パスワード（4文字以上）</label>
                <input type="password" placeholder="••••" value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  className="w-full bg-slate-50 rounded-xl py-3 px-4 text-lg font-semibold focus:ring-2 focus:ring-indigo-400 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">パスワード（確認）</label>
                <input type="password" placeholder="もう一度入力" value={passwordConfirm}
                  onChange={e => { setPasswordConfirm(e.target.value); setError(''); }}
                  className="w-full bg-slate-50 rounded-xl py-3 px-4 text-lg font-semibold focus:ring-2 focus:ring-indigo-400 outline-none" />
              </div>
              {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
              <button type="submit" disabled={!name.trim() || !password || !passwordConfirm || isLoading}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-[0.98]">
                {isLoading ? '登録中...' : '登録して次へ →'}
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}
