import { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { PLAN_LABELS } from '../types';

export default function PaymentPendingScreen() {
  const { currentMember, logout, recheckMemberStatus, isLoading } = useApp();
  const [checked, setChecked] = useState(false);

  const handleCheck = async () => {
    await recheckMemberStatus();
    setChecked(true);
    setTimeout(() => setChecked(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex flex-col items-center justify-center px-6 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-sm w-full">
        <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">お支払い確認待ち</h1>
        <p className="text-slate-500 mb-8 leading-relaxed text-sm">
          {currentMember?.name} さん、登録ありがとうございます！<br />
          管理者が初期費用の支払いを確認すると、利用開始できます。
        </p>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-amber-100 mb-5 text-left space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-sm">初期費用</span>
            <span className="font-black text-slate-800 text-2xl">¥500</span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-50 pt-3">
            <span className="text-slate-500 text-sm">選択プラン</span>
            <span className="font-bold text-indigo-600 text-sm">{currentMember?.plan ? PLAN_LABELS[currentMember.plan] : ''}</span>
          </div>
          <div className="flex justify-between items-center border-t border-slate-50 pt-3">
            <span className="text-slate-500 text-sm">月額料金</span>
            <span className="font-bold text-slate-700 text-sm">{currentMember?.plan === 'lazy' ? '¥600（固定）' : '¥1,000〜（連続割引あり）'}</span>
          </div>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4 text-left mb-6">
          <p className="font-bold text-slate-700 text-sm mb-2">利用開始までの手順</p>
          <ol className="space-y-1 text-sm text-slate-500 list-none">
            <li>① 管理者（システム）に支払い完了を伝える</li>
            <li>② 管理者が承認する</li>
            <li>③ 下の「確認する」ボタンを押す</li>
          </ol>
        </div>
        <button onClick={handleCheck} disabled={isLoading}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mb-4">
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? '確認中...' : checked ? '最新状態に更新しました' : '承認済みか確認する'}
        </button>
        <button onClick={logout} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mx-auto text-sm transition-colors">
          <LogOut className="w-4 h-4" />ログアウト
        </button>
      </motion.div>
    </div>
  );
}
