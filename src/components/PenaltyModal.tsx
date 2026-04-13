import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  memberName?: string;
  onDismiss: () => void;
}

export default function PenaltyModal({ memberName, onDismiss }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center px-6"
      >
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onDismiss} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="bg-red-600 px-6 pt-8 pb-6 text-center">
            <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
              className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <AlertTriangle className="w-10 h-10 text-white" strokeWidth={2.5} />
            </motion.div>
            <h2 className="text-white font-black text-2xl leading-tight">ストリークリセット</h2>
            {memberName && <p className="text-red-200 text-sm mt-1">{memberName} のストリークを0にリセットしました</p>}
          </div>
          <div className="px-6 py-7 text-center space-y-5">
            <p className="text-slate-800 text-xl font-black leading-snug">適当なことは<br />書かないでね。</p>
            <p className="text-slate-400 text-sm leading-relaxed">正直な記録がストリークを守ります。<br />これからは正確に記録しましょう！</p>
            <button onClick={onDismiss}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg shadow-lg hover:bg-slate-800 active:scale-[0.98] transition-all">
              わかりました
            </button>
          </div>
          <button onClick={onDismiss}
            className="absolute top-4 right-4 w-8 h-8 bg-red-700 hover:bg-red-800 rounded-full flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
