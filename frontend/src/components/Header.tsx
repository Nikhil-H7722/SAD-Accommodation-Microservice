import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  ShieldCheck,
  UserCheck,
  Clock,
  Radio,
  User,
  GraduationCap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface HeaderProps {
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth }) => {
  const { currentUser, switchRole, activeHoldTimer, isBackendLive } = useApp();

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      {/* Platform Top Notification Bar */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 px-4 py-1.5 text-xs font-medium text-emerald-100 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Student Mobility & Lifestyle Platform</span>
          <span className="text-emerald-300">|</span>
          <span className="font-semibold text-white">Microservice 2: Hostels and Housing</span>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          {/* Live Backend Connection Indicator */}
          <div className="flex items-center space-x-1.5 bg-slate-950/40 px-2 py-0.5 rounded-md border border-emerald-500/30">
            {isBackendLive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-emerald-300 font-semibold text-[11px]">FastAPI Live</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span className="text-amber-300 text-[11px]">Ready (Vite Proxy: /api)</span>
              </>
            )}
          </div>
          <span className="text-emerald-300">|</span>
          <span className="bg-emerald-950/60 px-2 py-0.5 rounded text-[11px] font-mono text-emerald-300">
            PostgreSQL • AWS RDS Ready
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Service Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">Accommodation Hub</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  INR (₹)
                </span>
              </div>
              <p className="text-xs text-slate-400">Hostel Allocation & Residence Management</p>
            </div>
          </div>

          {/* Active 30-min Hold Countdown (if active) */}
          {activeHoldTimer !== null && activeHoldTimer > 0 && (
            <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-lg text-xs animate-pulse font-mono">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>HOLD TIMER:</span>
              <span className="font-bold text-amber-200 text-sm">{formatTimer(activeHoldTimer)}</span>
            </div>
          )}

          {/* Role Switcher Pills & Current User */}
          <div className="flex items-center space-x-4">
            {/* Multi-Role Quick Switcher */}
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700/60 text-xs">
              <button
                onClick={() => switchRole('STUDENT')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  currentUser.role === 'STUDENT'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student</span>
              </button>

              <button
                onClick={() => switchRole('WARDEN')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  currentUser.role === 'WARDEN'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Warden</span>
              </button>

              <button
                onClick={() => switchRole('HOUSING_ADMIN')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  currentUser.role === 'HOUSING_ADMIN'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Housing Admin</span>
              </button>
            </div>

            {/* User Profile / Switch Account */}
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-200">{currentUser.full_name}</div>
                <div className="text-[11px] text-slate-400 font-mono">{currentUser.email}</div>
              </div>
              <button
                onClick={onOpenAuth}
                title="Switch User / 2FA Login"
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition"
              >
                <User className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
