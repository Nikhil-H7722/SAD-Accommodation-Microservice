import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { StudentPortal } from './components/student/StudentPortal';
import { WardenConsole } from './components/warden/WardenConsole';
import { AdminConsole } from './components/admin/AdminConsole';
import { AuthModal } from './components/AuthModal';
import {
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Database,
  ExternalLink,
  ShieldCheck,
  Building,
  GraduationCap
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentUser, toasts, removeToast } = useApp();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* Top Header */}
      <Header onOpenAuth={() => setShowAuthModal(true)} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentUser.role === 'STUDENT' && <StudentPortal />}
        {currentUser.role === 'WARDEN' && <WardenConsole />}
        {currentUser.role === 'HOUSING_ADMIN' && <AdminConsole />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
              AM
            </div>
            <div>
              <div className="font-semibold text-slate-200">Accommodation Microservice</div>
              <div className="text-[11px] text-slate-500">Student Mobility & Lifestyle Platform • React 18 + TS + Tailwind</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="flex items-center space-x-1 text-slate-400">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>PostgreSQL 15+ (23 Tables, GiST Exclusion Constraint)</span>
            </span>
            <span>•</span>
            <span className="text-slate-400">FastAPI REST & WebSockets (/api/v1/accommodation)</span>
            <span>•</span>
            <span className="text-slate-400">INR Currency Ledger (₹)</span>
          </div>
        </div>
      </footer>

      {/* Toast Notifications */}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`p-3.5 rounded-xl shadow-lg border text-xs font-medium flex items-start justify-between space-x-2 transition-all animate-in slide-in-from-bottom-2 ${
              toast.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : toast.type === 'error'
                ? 'bg-rose-900 text-rose-100 border-rose-700'
                : 'bg-slate-900 text-slate-100 border-slate-700'
            }`}
          >
            <div className="flex items-start space-x-2">
              {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />}
              <span>{toast.message}</span>
            </div>
            <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Auth Modal */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
