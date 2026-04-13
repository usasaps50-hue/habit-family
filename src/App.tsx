import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from './contexts/AppContext';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import PaymentPendingScreen from './components/PaymentPendingScreen';
import MemberDashboard from './components/MemberDashboard';
import AdminDashboard from './components/AdminDashboard';

function AppContent() {
  const { currentMember, isAdmin } = useApp();
  const [showRegister, setShowRegister] = useState(false);

  const screen = isAdmin
    ? 'admin'
    : currentMember?.status === 'pending_payment'
    ? 'pending'
    : currentMember?.status === 'active'
    ? 'member'
    : showRegister
    ? 'register'
    : 'login';

  return (
    <AnimatePresence mode="wait">
      {screen === 'login' && (
        <motion.div key="login"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <LoginScreen onRegister={() => setShowRegister(true)} />
        </motion.div>
      )}
      {screen === 'register' && (
        <motion.div key="register"
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          <RegisterScreen onBack={() => setShowRegister(false)} />
        </motion.div>
      )}
      {screen === 'pending' && (
        <motion.div key="pending"
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          <PaymentPendingScreen />
        </motion.div>
      )}
      {screen === 'member' && (
        <motion.div key="member"
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          <MemberDashboard />
        </motion.div>
      )}
      {screen === 'admin' && (
        <motion.div key="admin"
          initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          <AdminDashboard />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
