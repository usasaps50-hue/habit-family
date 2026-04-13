import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, Plus, X, Flame, CheckCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { todayStr } from '../utils/date';
import type { DBMember } from '../types';

interface Props { onRegister: () => void; }

export default function LoginScreen({ onRegister }: Props) {
  const { loginMember, loginAdmin, isLoading } = useApp();
  const today = todayStr();
  const [members, setMembers]               = useState<DBMember[]>([]);
  const [submittedToday, setSubmittedToday] = useState<Set<string>>(new Set());
  const [selected, setSelected]             = useState<DBMember | null>(null);
  const [memberPwd, setMemberPwd]           = useState('');
  const [memberError, setMemberError]       = useState('');
  const [showAdmin, setShowAdmin]           = useState(false);
  const [adminPwd, setAdminPwd]             = useState('');
  const [adminError, setAdminError]         = useState('');

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    const { data: rows } = await supabase.from('hf_members').select('*').eq('status', 'active').order('created_at');
    if (!rows) return;
    setMembers(rows);
    if (rows.length === 0) return;
    const { data: records } = await supabase.from('hf_daily_records').select('member_id').eq('date', today)
      .in('member_id', rows.map(m => m.id));
    setSubmittedToday(new Set((records ?? []).map(r => r.member_id)));
  };

  const handleMemberLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const result = await loginMember(selected.name, memberPwd);
    if (result === 'wrong_password') { setMemberError('パスワードが違います'); setMemberPwd(''); }
    else if (result === 'not_found') { setMemberError('メンバーが見つかりません'); }
  };

  const handleAdminLogin = (e: FormEvent) => {
    e.preventDefault();
    if (!loginAdmin(adminPwd)) { setAdminError('パスワードが違います'); setAdminPwd(''); }
  };

  const closeAdmin  = () => { setShowAdmin(false);  setAdminPwd('');  setAdminError(''); };
  const closeMember = () => { setSelected(null);    setMemberPwd(''); setMemberError(''); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-start px-5 py-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mb-4 mx-auto shadow-xl shadow-indigo-200">
          <span className="text-4xl">🏠</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">HabitFamily</h1>
        <p className="text-slate-500 mt-2 text-sm">だれでログインしますか？</p>
      </motion.div>

      <div className="w-full max-w-sm space-y-3">
        {members.map((m, i) => (
          <motion.button key={m.id}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => { setSelected(m); setMemberPwd(''); setMemberError(''); }}
            className="w-full bg-white rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all text-left"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">{m.emoji}</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-lg leading-tight">{m.name}</p>
              <p className="text-slate-400 text-xs mt-0.5">{m.streak > 0 ? `🔥 ${m.streak}日連続中` : '記録を始めよう'}</p>
            </div>
            {submittedToday.has(m.id) ? (
              <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-lg flex-shrink-0">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs font-bold text-green-600">済</span>
              </div>
            ) : m.streak > 0 ? (
              <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-lg flex-shrink-0">
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-400" />
                <span className="text-xs font-bold text-orange-600">{m.streak}</span>
              </div>
            ) : null}
          </motion.button>
        ))}

        {members.length === 0 && (
          <div className="text-center py-8 text-slate-300">
            <p className="text-sm">まだメンバーがいません</p>
            <p className="text-xs mt-1">「新規登録」から始めましょう</p>
          </div>
        )}

        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: members.length * 0.07 + 0.1 }}
          onClick={onRegister}
          className="w-full border-2 border-dashed border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-4 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
        >
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center">
            <Plus className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-slate-400 font-medium">新規登録</span>
        </motion.button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8 w-full max-w-sm">
        <button onClick={() => setShowAdmin(true)}
          className="w-full bg-slate-800 text-white rounded-2xl px-5 py-4 flex items-center gap-3 hover:bg-slate-700 transition-all">
          <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-slate-300" />
          </div>
          <div className="text-left flex-1">
            <p className="font-bold text-sm">システム</p>
            <p className="text-slate-400 text-xs">管理者ログイン</p>
          </div>
          <Lock className="w-4 h-4 text-slate-500" />
        </button>
      </motion.div>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeMember} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-xs bg-white rounded-3xl p-6 z-50 shadow-2xl"
            >
              <button onClick={closeMember} className="absolute top-4 right-4 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                <X className="w-4 h-4 text-slate-500" />
              </button>
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">{selected.emoji}</div>
                <h2 className="font-bold text-xl">{selected.name} さん</h2>
                <p className="text-slate-400 text-sm mt-1">パスワードを入力してください</p>
              </div>
              <form onSubmit={handleMemberLogin} className="space-y-3">
                <input type="password" placeholder="パスワード" value={memberPwd} autoFocus
                  onChange={e => { setMemberPwd(e.target.value); setMemberError(''); }}
                  className="w-full bg-slate-50 rounded-xl py-3 px-4 text-center text-xl font-bold focus:ring-2 focus:ring-indigo-400 outline-none" />
                <AnimatePresence>
                  {memberError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-sm text-center">{memberError}</motion.p>}
                </AnimatePresence>
                <button type="submit" disabled={!memberPwd || isLoading}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-[0.98]">
                  {isLoading ? 'ログイン中...' : 'ログイン'}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdmin && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeAdmin} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-xs bg-slate-900 rounded-3xl p-6 z-50 shadow-2xl"
            >
              <button onClick={closeAdmin} className="absolute top-4 right-4 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                <X className="w-4 h-4 text-slate-400" />
              </button>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-3 mx-auto">
                  <Shield className="w-7 h-7 text-indigo-400" />
                </div>
                <h2 className="text-white font-bold text-xl">システムログイン</h2>
                <p className="text-slate-400 text-sm mt-1">管理者パスワードを入力</p>
              </div>
              <form onSubmit={handleAdminLogin} className="space-y-3">
                <input type="password" placeholder="パスワード" value={adminPwd} autoFocus
                  onChange={e => { setAdminPwd(e.target.value); setAdminError(''); }}
                  className="w-full bg-slate-800 border-2 border-slate-700 text-white rounded-xl py-3 px-4 text-center text-xl tracking-widest font-bold focus:border-indigo-500 outline-none" />
                <AnimatePresence>
                  {adminError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm text-center">{adminError}</motion.p>}
                </AnimatePresence>
                <button type="submit" disabled={!adminPwd}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold disabled:bg-slate-700 disabled:text-slate-500 transition-all active:scale-[0.98]">
                  ログイン
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
