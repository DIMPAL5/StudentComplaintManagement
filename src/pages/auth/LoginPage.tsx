import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  UserCheck,
  AlertCircle,
  GraduationCap,
  Briefcase,
  Wrench,
  Building2,
  ArrowRight,
  Sparkles,
  Info,
  Clock,
  Ban,
  CheckCircle2,
} from 'lucide-react';

interface LoginPageProps {
  onNavigateToRegister: () => void;
  onLoginSuccess: (role: UserRole) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister, onLoginSuccess }) => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form validations
    if (!selectedRole) {
      setErrorMessage('Please select your registered role from the dropdown.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter your institutional email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password, selectedRole as UserRole);
      if (!result.success) {
        setErrorMessage(result.error || 'Authentication failed. Please verify your credentials.');
      } else if (result.user) {
        onLoginSuccess(result.user.role);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Account Auto-Fill Helper
  const fillDemoAccount = (role: UserRole, demoEmail: string, demoPass: string) => {
    setSelectedRole(role);
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 p-0.5 shadow-xl shadow-blue-500/20 mb-4 animate-in zoom-in-95">
          <div className="w-full h-full bg-slate-950/80 backdrop-blur-sm rounded-[14px] flex items-center justify-center">
            <Shield className="w-8 h-8 text-teal-400" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-teal-200 bg-clip-text text-transparent">
          Smart Campus 360
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-300">
          Smart Campus Complaint Management System
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-[11px] font-semibold text-blue-300">
          <Lock className="w-3 h-3 text-blue-400" />
          <span>Role-Based Secure Institutional Access</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl border border-slate-800 shadow-2xl shadow-black/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Notification Alert */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <p className="font-semibold text-rose-300">Authentication Alert</p>
                  <p className="mt-0.5 text-xs text-rose-200/90">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* MANDATORY ROLE SELECTION DROPDOWN */}
            <div>
              <label htmlFor="role-select" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Select Your Role <span className="text-teal-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserCheck className="w-4 h-4 text-teal-400" />
                </div>
                <select
                  id="role-select"
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value as UserRole);
                    setErrorMessage(null);
                  }}
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled className="bg-slate-900 text-slate-400">
                    -- Select Your Registered Role --
                  </option>
                  <option value="student" className="bg-slate-900 text-white">
                    🎓 Student
                  </option>
                  <option value="professor" className="bg-slate-900 text-white">
                    👨‍🏫 Professor
                  </option>
                  <option value="staff" className="bg-slate-900 text-white">
                    🛠️ Staff
                  </option>
                  <option value="hod" className="bg-slate-900 text-white">
                    🏛️ HOD (Head of Department)
                  </option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <span className="text-xs">▼</span>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                You will only be routed if your selected role matches your approved database profile.
              </p>
            </div>

            {/* Institutional Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Institutional Email Address <span className="text-teal-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="your.name@campus.edu"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password with Show/Hide Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Password <span className="text-teal-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs font-medium text-teal-400 hover:text-teal-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 hover:from-blue-500 hover:via-indigo-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials & Role...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Switch to Registration */}
            <div className="pt-2 text-center border-t border-slate-800/80">
              <p className="text-xs text-slate-400">
                Don't have an institutional account yet?{' '}
                <button
                  type="button"
                  onClick={onNavigateToRegister}
                  className="font-bold text-teal-400 hover:text-teal-300 transition-colors underline underline-offset-4 cursor-pointer"
                >
                  Create Account
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* QUICK 1-CLICK DEMO ACCOUNTS HELPER */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 mb-2.5 text-slate-300 font-semibold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Quick 1-Click Demo Accounts (Examiner & Testing):</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('student', 'student@campus.edu', 'student123')}
              className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 font-bold text-teal-300">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">student@campus.edu</p>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount('professor', 'professor@campus.edu', 'professor123')}
              className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Professor</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">professor@campus.edu</p>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount('staff', 'staff@campus.edu', 'staff123')}
              className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Wrench className="w-3.5 h-3.5" />
                <span>Staff</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">staff@campus.edu</p>
            </button>

            <button
              type="button"
              onClick={() => fillDemoAccount('hod', 'hod@campus.edu', 'hod123')}
              className="p-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 font-bold text-purple-300">
                <Building2 className="w-3.5 h-3.5" />
                <span>HOD</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">hod@campus.edu</p>
            </button>
          </div>

          {/* Test Error Conditions */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400 font-semibold">Test Error Guards:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('staff', 'pending.staff@campus.edu', 'pending123')}
                className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-medium flex items-center gap-1 transition-colors"
                title="Test Pending Approval Guard"
              >
                <Clock className="w-3 h-3" />
                <span>Pending Staff</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('student', 'suspended.user@campus.edu', 'suspended123')}
                className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-medium flex items-center gap-1 transition-colors"
                title="Test Suspended User Guard"
              >
                <Ban className="w-3 h-3" />
                <span>Suspended</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset Password</h3>
                <p className="text-xs text-slate-400">Institutional Recovery System</p>
              </div>
            </div>

            {forgotSent ? (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Password Reset Link Dispatched</span>
                </div>
                <p>
                  A temporary password reset token has been dispatched to <strong>{forgotEmail}</strong>. Please check your institutional inbox.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotSent(false);
                  }}
                  className="w-full mt-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Enter your registered campus email address and our automated identity verification system will send recovery instructions.
                </p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@campus.edu"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (forgotEmail.trim()) {
                        setForgotSent(true);
                      }
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors"
                  >
                    Send Instructions
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
