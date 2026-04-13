import { motion } from 'motion/react';
import { Flame, Shield, LogOut } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export default function Header() {
  const { currentMember, isAdmin, logout } = useApp();

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-5 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {isAdmin ? (
          <>
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Admin</p>
              <p className="font-bold text-slate-900 text-base leading-tight">システム</p>
            </div>
          </>
        ) : currentMember ? (
          <>
            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-xl">
              {currentMember.emoji}
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none">Welcome</p>
              <p className="font-bold text-slate-900 text-base leading-tight">{currentMember.name} さん</p>
            </div>
          </>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {currentMember && currentMember.streak > 0 && (
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100"
          >
            <Flame className="w-4 h-4 text-orange-500 fill-orange-400" />
            <span className="text-sm font-bold text-orange-700">{currentMember.streak}日</span>
          </motion.div>
        )}
        <button onClick={logout} title="ログアウト"
          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all active:scale-95">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
