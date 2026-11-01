import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  Shield,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  UserCheck,
  Building,
  BadgeCheck,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Info,
} from 'lucide-react';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
  onRegisterSuccess: (message: string, role: UserRole) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin, onRegisterSuccess }) => {
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [rollOrEmpId, setRollOrEmpId] = useState('');
  const [departmentName, setDepartmentName] = useState('Computer Science & Engineering');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ message: string; isPending: boolean } | null>(null);

  const departmentsList = [
    'Computer Science & Engineering',
    'Electronics & Communication Engineering',
    'Electrical & Electronics Engineering',
    'Mechanical Engineering',
    'Civil Engineering',
    'Information Technology',
    'Campus Facilities & Infrastructure',
    'Hostels & Residential Services',
    'Central Library & Resources',
    'General Administration',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter your institutional email address.');
      return;
    }
    if (!rollOrEmpId.trim()) {
      setErrorMessage(
        selectedRole === 'student'
          ? 'Please enter your Student Roll Number / PRN.'
          : 'Please enter your Employee ID.'
      );
      return;
    }
    if (!password) {
      setErrorMessage('Please enter a password.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Password and Confirm Password do not match.');
      return;
    }
    if (!termsAccepted) {
      setErrorMessage('You must accept the Campus Code of Conduct and Terms of Service.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await register({
        fullName,
        email,
        role: selectedRole,
        password,
        confirmPassword,
        rollOrEmpId,
        departmentName,
        phone,
        termsAccepted,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to create account.');
      } else {
        const isPending = res.accountStatus === 'pending';
        setSuccessInfo({
          message: res.message || 'Account created successfully!',
          isPending,
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during account creation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Branding */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center relative z-10 px-4">
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors mb-3 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sign In</span>
        </button>
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 p-0.5 shadow-xl shadow-blue-500/20 mb-3">
          <div className="w-full h-full bg-slate-950/80 backdrop-blur-sm rounded-[14px] flex items-center justify-center">
            <Shield className="w-7 h-7 text-teal-400" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-teal-200 bg-clip-text text-transparent">
          Create Institutional Account
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-300">
          Smart Campus 360 – Smart Campus Complaint Management System
        </p>
      </div>

      {/* Main Registration Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg px-4 relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl py-8 px-6 sm:px-10 rounded-3xl border border-slate-800 shadow-2xl shadow-black/50">
          {successInfo ? (
            <div className="text-center space-y-4 py-4 animate-in zoom-in-95">
              <div
                className={`w-16 h-16 mx-auto rounded-3xl flex items-center justify-center ${
                  successInfo.isPending ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {successInfo.isPending ? <Info className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
              </div>
              <h2 className="text-xl font-bold text-white">
                {successInfo.isPending ? 'Registration Under Review' : 'Account Created Successfully!'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                {successInfo.message}
              </p>
              {successInfo.isPending && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs text-left">
                  <p className="font-semibold">Notice for {selectedRole.toUpperCase()} Accounts:</p>
                  <p className="mt-0.5 text-[11px] text-amber-200/90">
                    Faculty, Staff, and HOD registrations are queued for verified administrative clearance to maintain institutional security. You will be able to log in once your campus administrator approves your profile.
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
              >
                Proceed to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error banner */}
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="flex-1">{errorMessage}</span>
                </div>
              )}

              {/* MANDATORY ROLE SELECTION DROPDOWN */}
              <div>
                <label htmlFor="reg-role" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Select Your Role <span className="text-teal-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserCheck className="w-4 h-4 text-teal-400" />
                  </div>
                  <select
                    id="reg-role"
                    value={selectedRole}
                    onChange={(e) => {
                      setSelectedRole(e.target.value as UserRole);
                      setErrorMessage(null);
                    }}
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all appearance-none cursor-pointer"
                  >
                    <option value="student" className="bg-slate-900 text-white">
                      🎓 Student (Instant Access)
                    </option>
                    <option value="professor" className="bg-slate-900 text-white">
                      👨‍🏫 Professor (Requires Admin Verification)
                    </option>
                    <option value="staff" className="bg-slate-900 text-white">
                      🛠️ Staff (Requires Admin Verification)
                    </option>
                    <option value="hod" className="bg-slate-900 text-white">
                      🏛️ HOD (Head of Department - Admin Authorization Required)
                    </option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <span className="text-xs">▼</span>
                  </div>
                </div>

                {/* Role Guidance Helper */}
                <div className="mt-1.5 p-2 rounded-xl bg-slate-800/50 border border-slate-700/50 text-[11px] text-slate-300 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>
                    {selectedRole === 'student' && 'Students receive immediate active access upon registration.'}
                    {selectedRole === 'professor' && 'Professor profiles are registered as pending admin verification.'}
                    {selectedRole === 'staff' && 'Staff accounts require administrative approval before task dispatch.'}
                    {selectedRole === 'hod' && 'HOD privileges require authorized administrator credential verification.'}
                  </span>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="reg-name" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Full Name <span className="text-teal-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Rivera / Dr. John Smith"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor="reg-email" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Institutional Email Address <span className="text-teal-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@campus.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Dynamic Student ID / Employee ID & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-id" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    {selectedRole === 'student' ? 'Student ID / Roll No.' : 'Employee ID'}{' '}
                    <span className="text-teal-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <BadgeCheck className="w-4 h-4" />
                    </div>
                    <input
                      id="reg-id"
                      type="text"
                      required
                      value={rollOrEmpId}
                      onChange={(e) => setRollOrEmpId(e.target.value)}
                      placeholder={selectedRole === 'student' ? '2024-CS-042' : 'EMP-702'}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-dept" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Department <span className="text-teal-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building className="w-4 h-4" />
                    </div>
                    <select
                      id="reg-dept"
                      value={departmentName}
                      onChange={(e) => setDepartmentName(e.target.value)}
                      className="w-full pl-10 pr-8 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all appearance-none cursor-pointer"
                    >
                      {departmentsList.map((dept) => (
                        <option key={dept} value={dept} className="bg-slate-900 text-white">
                          {dept}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                      <span className="text-[10px]">▼</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reg-pass" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Password <span className="text-teal-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="reg-pass"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-confirm-pass" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Confirm Password <span className="text-teal-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="reg-confirm-pass"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Accept Terms Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-teal-500 bg-slate-800 border-slate-700 focus:ring-teal-400 cursor-pointer"
                  />
                  <span className="text-xs text-slate-300 leading-snug">
                    I agree to the <span className="text-teal-400 font-semibold">Campus Code of Conduct</span>, accurate fault reporting policies, and institutional IT terms.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 hover:from-blue-500 hover:via-indigo-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-teal-500/20 transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing Registration...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>

              {/* Return to Sign In */}
              <div className="pt-2 text-center border-t border-slate-800">
                <p className="text-xs text-slate-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={onNavigateToLogin}
                    className="font-bold text-teal-400 hover:text-teal-300 transition-colors underline underline-offset-4 cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
