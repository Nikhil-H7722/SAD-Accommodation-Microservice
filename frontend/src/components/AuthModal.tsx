import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MOCK_USERS } from '../data/mockData';
import { UserAccount } from '../types';
import {
  X,
  Lock,
  Mail,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  GraduationCap,
  Building,
  UserCheck
} from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { setCurrentUser, showToast } = useApp();
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('123456');
  const [selectedUserForOtp, setSelectedUserForOtp] = useState<UserAccount | null>(null);

  const handleSelectPreset = (user: UserAccount) => {
    setSelectedUserForOtp(user);
    setEmail(user.email);
    setPassword('Password123!');
    setStep('otp');
    showToast(`6-digit verification code sent to ${user.email} (Demo code: 123456)`, 'info');
  };

  const handleVerifyOtp = () => {
    if (selectedUserForOtp) {
      setCurrentUser(selectedUserForOtp);
      showToast(`Logged in successfully as ${selectedUserForOtp.full_name} (${selectedUserForOtp.role})`, 'success');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Three-Role Authentication & 2FA</h3>
              <p className="text-[11px] text-slate-400">Student • Warden • Housing Admin</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {step === 'credentials' ? (
            <>
              {/* Presets */}
              <div>
                <label className="font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  1-Click Demo Accounts (Fast Testing)
                </label>
                <div className="space-y-2">
                  {MOCK_USERS.map((user) => (
                    <button
                      key={user.account_id}
                      onClick={() => handleSelectPreset(user)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center justify-between text-left transition group"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700">
                          {user.role === 'STUDENT' ? (
                            <GraduationCap className="w-4 h-4" />
                          ) : user.role === 'WARDEN' ? (
                            <Building className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{user.full_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{user.email}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {user.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="student@example.test"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                  />
                </div>
                <button
                  onClick={() => {
                    if (email) {
                      setStep('otp');
                      showToast('6-digit code sent! Enter 123456 to verify.', 'info');
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
                >
                  Send 6-Digit OTP Code
                </button>
              </div>
            </>
          ) : (
            /* OTP Screen */
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Enter 6-Digit OTP Code</h4>
                <p className="text-slate-500 mt-1">A verification code was dispatched to {email}.</p>
                <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-[11px] font-mono text-slate-600 mt-1">
                  Demo Code: 123456
                </span>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full text-center text-2xl font-mono tracking-widest p-3 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                onClick={handleVerifyOtp}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify OTP & Launch Dashboard</span>
              </button>

              <button
                onClick={() => setStep('credentials')}
                className="w-full py-1 text-slate-400 hover:text-slate-600 text-[11px]"
              >
                Back to credentials
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
