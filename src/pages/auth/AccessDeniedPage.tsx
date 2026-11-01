import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';

interface AccessDeniedPageProps {
  attemptedPath: string;
  onReturnToAuthorizedDashboard: () => void;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({
  attemptedPath,
  onReturnToAuthorizedDashboard,
}) => {
  const { currentUser, role } = useAuth();

  const getAuthorizedPath = () => {
    switch (role) {
      case 'student':
        return '/student/dashboard';
      case 'professor':
        return '/professor/dashboard';
      case 'staff':
        return '/staff/dashboard';
      case 'hod':
        return '/hod/dashboard';
      default:
        return '/student/dashboard';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900 border border-rose-500/30 shadow-2xl shadow-rose-950/50 space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
          <ShieldAlert className="w-10 h-10 animate-bounce" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-rose-500/20 text-rose-300">
            HTTP 403 • Access Denied
          </span>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Unauthorized Portal Access
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            You do not have administrative clearance to access the route{' '}
            <code className="px-2 py-0.5 rounded bg-slate-800 text-rose-300 font-mono text-xs">
              {attemptedPath}
            </code>
            .
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-xs text-left space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span>Signed In As:</span>
            <span className="font-semibold text-white">{currentUser?.fullName}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Assigned Role:</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase bg-blue-500/20 text-blue-300">
              {role}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Authorized Route:</span>
            <span className="font-mono text-teal-300 text-xs">{getAuthorizedPath()}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onReturnToAuthorizedDashboard}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Return to My Authorized Dashboard</span>
        </button>
      </div>
    </div>
  );
};
