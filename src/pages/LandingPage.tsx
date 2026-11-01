import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  Building2,
  ShieldCheck,
  Zap,
  MapPin,
  Clock,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  Briefcase,
  Wrench,
  Shield,
  FileText,
  Star,
  Layers,
  Sparkles,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenAuth?: (tab?: 'signin' | 'signup') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onOpenAuth }) => {
  const { switchDemoRole, demoAccounts } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleRoleSelect = (role: UserRole) => {
    switchDemoRole(role);
    onEnterApp();
  };

  const faqs = [
    {
      q: 'How does Smart Campus 360 automatically recommend departments and priorities?',
      a: 'The system uses an intelligent keyword and category matching engine. Safety hazards (e.g. sparks, leaks, electrical shocks) automatically trigger Critical priority with a 2-hour SLA window and immediate admin escalation. Routine issues receive Medium/Low priority.',
    },
    {
      q: 'Does the application work without an internet connection or live database?',
      a: 'Yes! Smart Campus 360 features a complete dual-mode database layer. If Supabase PostgreSQL credentials are not provided, it seamlessly runs in Local Demonstration Mode using localStorage with rich pre-loaded college data, persistent comments, and real-time state simulation.',
    },
    {
      q: 'Can students report complaints anonymously?',
      a: 'Yes, for designated categories (such as hostel issues, sanitation, and safety). Anonymized submissions protect the student’s identity from ordinary staff while recording incident metadata for repair.',
    },
    {
      q: 'How does the Duplicate Complaint Detector prevent spam?',
      a: 'When a user enters a complaint title, room number, or asset ID, the system queries active open tickets in that specific location and displays an alert banner if a matching incident is already under repair.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      {/* Public Navbar */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-700 via-indigo-700 to-teal-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight">
                Smart Campus <span className="text-teal-600 dark:text-teal-400">360</span>
              </span>
              <span className="ml-1.5 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                Mini Project
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {onOpenAuth && (
              <>
                <button
                  onClick={() => onOpenAuth('signin')}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-colors hidden sm:inline-block"
                >
                  Create Account
                </button>
              </>
            )}
            <button
              onClick={() => handleRoleSelect('student')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20 transition-all active:scale-95"
            >
              Launch Demo System →
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Next-Generation College Facility & Complaint Intelligence</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
          Resolve Campus Facility Issues Faster with{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500">
            Intelligent Automation
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          From broken classroom projectors and lab centrifuges to Wi-Fi outages and plumbing hazards. Smart Campus 360 automates smart routing, SLA tracking, and root-cause analysis for modern universities.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {onOpenAuth && (
            <button
              onClick={() => onOpenAuth('signup')}
              className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-xl shadow-teal-600/25 transition-all flex items-center gap-2"
            >
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleRoleSelect('student')}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white text-sm font-bold shadow-xl shadow-blue-600/25 transition-all flex items-center gap-2"
          >
            <span>Explore as Student</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleRoleSelect('admin')}
            className="px-6 py-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-bold shadow-sm transition-all"
          >
            Admin Dashboard
          </button>
        </div>

        {/* Live Metrics Strip */}
        <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">98.4%</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">SLA Compliance Rate</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-teal-600">&lt; 2 hrs</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Critical Safety Response</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600">7 Units</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Campus Departments</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-500">4.8 / 5</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Student Satisfaction</p>
          </div>
        </div>
      </section>

      {/* Instant Demo Role Switcher Cards */}
      <section className="py-12 bg-slate-100/70 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Evaluate Any Persona with One Click</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
              Pre-populated demo accounts allow testing complete end-to-end workflows without credential setup.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {demoAccounts.map((acc) => (
              <div
                key={acc.id}
                onClick={() => handleRoleSelect(acc.role)}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {acc.role.replace('_', ' ')}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {acc.fullName}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate">{acc.email}</p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-mono">{acc.rollOrEmpId}</span>
                  <span className="text-blue-600 font-bold group-hover:underline">Login →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight">Core System Architecture</h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Engineered to fulfill all requirements for university mini and final-year evaluations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold">Smart Routing & SLA Rules</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Automatic category, department, and priority recommendations. Real-time countdowns track target response windows from 2 to 72 hours.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold">Interactive Campus Map</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Schematic 2D facility layout with dynamic incident counts, hazard pins, and floor-level complaint inspection.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold">Root-Cause Recurring Detection</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Detects repeated room and asset breakdowns. Generates preventive engineering advisories for department heads.
            </p>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="py-16 bg-slate-100/60 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-500">Technical insights and project architecture details.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left font-semibold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center justify-between gap-3"
                  >
                    <span>{faq.q}</span>
                    <span className="text-slate-400 text-sm">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-10 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-2">
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          Smart Campus 360 – Smart Campus Complaint Management System
        </p>
        <p>Built with React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts, and Supabase / Local Dual-Mode Persistence.</p>
        <p className="text-[11px] text-slate-400">Suitable for College Mini & Final-Year Engineering Demonstrations.</p>
      </footer>
    </div>
  );
};
