import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { AccessDeniedPage } from './pages/auth/AccessDeniedPage';
import { StudentDashboard } from './pages/dashboards/StudentDashboard';
import { ProfessorDashboard } from './pages/dashboards/ProfessorDashboard';
import { StaffDashboard } from './pages/dashboards/StaffDashboard';
import { HodDashboard } from './pages/dashboards/HodDashboard';
import { ComplaintDirectoryPage } from './pages/ComplaintDirectoryPage';
import { CampusMapPage } from './pages/CampusMapPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { AssetsPage } from './pages/AssetsPage';
import { MaintenancePlannerPage } from './pages/MaintenancePlannerPage';
import { RecurringIssuesPage } from './pages/RecurringIssuesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AdminManagementPage } from './pages/AdminManagementPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ProfilePage } from './pages/ProfilePage';
import { CreateComplaintModal } from './components/complaints/CreateComplaintModal';
import { ComplaintDetailsModal } from './components/complaints/ComplaintDetailsModal';
import { Complaint, UserRole } from './types';
import { Shield } from 'lucide-react';

const MainApp: React.FC = () => {
  const { isAuthenticated, isAuthChecking, role, currentUser, logout } = useAuth();
  const { showToast } = useToast();

  const getRepoPrefix = (): string => {
    return window.location.pathname.startsWith('/StudentComplaintManagement')
      ? '/StudentComplaintManagement'
      : '';
  };

  const getCleanPath = (): string => {
    let p = window.location.pathname;
    const prefix = window.location.pathname.startsWith('/StudentComplaintManagement')
      ? '/StudentComplaintManagement'
      : '';
    if (prefix && p.startsWith(prefix)) {
      p = p.substring(prefix.length);
    }
    return p && p !== '/' ? p : '/login';
  };

  // Route state initialized from window.location.pathname
  const [currentPath, setCurrentPath] = useState<string>(getCleanPath);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [buildingFilter, setBuildingFilter] = useState<string | undefined>(undefined);

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(getCleanPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigation helper that pushes browser history
  const navigateTo = (path: string) => {
    const prefix = getRepoPrefix();
    const fullPath = prefix + path;
    if (window.location.pathname !== fullPath) {
      window.history.pushState({}, '', fullPath);
    }
    setCurrentPath(path);
  };

  const getAuthorizedDashboardPath = (userRole: UserRole): string => {
    switch (userRole) {
      case 'student':
        return '/student/dashboard';
      case 'professor':
      case 'faculty':
        return '/professor/dashboard';
      case 'staff':
        return '/staff/dashboard';
      case 'hod':
      case 'department_head':
      case 'admin':
        return '/hod/dashboard';
      default:
        return '/student/dashboard';
    }
  };

  // Sync route on authentication change
  useEffect(() => {
    if (isAuthChecking) return;

    if (!isAuthenticated) {
      // If user is unauthenticated and tries to access a protected route
      if (currentPath !== '/register' && currentPath !== '/login') {
        navigateTo('/login');
      }
    } else {
      // If user is authenticated and on login or register, route to their authorized dashboard
      if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
        navigateTo(getAuthorizedDashboardPath(role));
      }
    }
  }, [isAuthenticated, isAuthChecking, role]);

  // Loading Screen while verifying active session
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 p-0.5 shadow-xl shadow-blue-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Shield className="w-8 h-8 text-teal-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Smart Campus 360</h1>
            <p className="text-xs text-slate-400">Authenticating secure institutional session...</p>
          </div>
          <div className="w-48 bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="w-full h-full bg-gradient-to-r from-blue-500 to-teal-400 rounded-full animate-indeterminate" />
          </div>
        </div>
      </div>
    );
  }

  // 1. UNAUTHENTICATED STATE: LOGIN & REGISTRATION
  if (!isAuthenticated) {
    if (currentPath === '/register') {
      return (
        <RegisterPage
          onNavigateToLogin={() => navigateTo('/login')}
          onRegisterSuccess={(msg, registeredRole) => {
            showToast('success', 'Registration Submitted', msg);
            navigateTo('/login');
          }}
        />
      );
    }
    // Default: Login page opens first
    return (
      <LoginPage
        onNavigateToRegister={() => navigateTo('/register')}
        onLoginSuccess={(authedRole) => {
          showToast('success', 'Authentication Successful', `Welcome to the ${authedRole.toUpperCase()} Portal.`);
          navigateTo(getAuthorizedDashboardPath(authedRole));
        }}
      />
    );
  }

  // 2. AUTHENTICATED STATE: ROLE-BASED DASHBOARD & PAGE RENDERING
  const handleSelectComplaint = (id: string) => {
    setSelectedComplaintId(id);
  };

  const handleFilterBuilding = (bldgName: string) => {
    setBuildingFilter(bldgName);
    navigateTo('/complaint-directory');
  };

  const handleComplaintCreated = (complaint: Complaint) => {
    setSelectedComplaintId(complaint.id);
  };

  // Check if current user is attempting to access an unauthorized dashboard directly via URL
  const isStudentOnOtherDashboard =
    role === 'student' &&
    (currentPath === '/professor/dashboard' ||
      currentPath === '/staff/dashboard' ||
      currentPath === '/hod/dashboard');

  const isProfessorOnOtherDashboard =
    (role === 'professor' || role === 'faculty') &&
    (currentPath === '/student/dashboard' ||
      currentPath === '/staff/dashboard' ||
      currentPath === '/hod/dashboard');

  const isStaffOnOtherDashboard =
    role === 'staff' &&
    (currentPath === '/student/dashboard' ||
      currentPath === '/professor/dashboard' ||
      currentPath === '/hod/dashboard');

  const isHodOnOtherDashboard =
    (role === 'hod' || role === 'department_head') &&
    (currentPath === '/student/dashboard' ||
      currentPath === '/professor/dashboard' ||
      currentPath === '/staff/dashboard');

  if (
    isStudentOnOtherDashboard ||
    isProfessorOnOtherDashboard ||
    isStaffOnOtherDashboard ||
    isHodOnOtherDashboard
  ) {
    return (
      <AccessDeniedPage
        attemptedPath={currentPath}
        onReturnToAuthorizedDashboard={() => navigateTo(getAuthorizedDashboardPath(role))}
      />
    );
  }

  // Map internal nav clicks to routes
  const handleNavClick = (pageId: string) => {
    switch (pageId) {
      case 'dashboard':
        navigateTo(getAuthorizedDashboardPath(role));
        break;
      case 'login':
        logout();
        navigateTo('/login');
        break;
      case 'submit-complaint':
        setIsCreateOpen(true);
        break;
      default:
        navigateTo(`/${pageId}`);
        break;
    }
  };

  // Convert currentPath back to pageId for sidebar active highlight
  const currentPageId = currentPath.replace('/', '');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onOpenCreateComplaint={() => setIsCreateOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onNavigate={handleNavClick}
      />

      <div className="flex-1 flex">
        {/* Role-Specific Left Sidebar */}
        <Sidebar
          currentPage={currentPageId}
          onNavigate={handleNavClick}
          onOpenCreateComplaint={() => setIsCreateOpen(true)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-16">
          {/* A. STUDENT DASHBOARD */}
          {(currentPath === '/student/dashboard' || (currentPath === '/dashboard' && role === 'student')) && (
            <StudentDashboard
              onOpenCreate={() => setIsCreateOpen(true)}
              onSelectComplaint={handleSelectComplaint}
              onNavigate={handleNavClick}
            />
          )}

          {/* B. PROFESSOR DASHBOARD */}
          {(currentPath === '/professor/dashboard' ||
            (currentPath === '/dashboard' && (role === 'professor' || role === 'faculty'))) && (
            <ProfessorDashboard
              onOpenCreate={() => setIsCreateOpen(true)}
              onSelectComplaint={handleSelectComplaint}
              onNavigate={handleNavClick}
            />
          )}

          {/* C. STAFF DASHBOARD */}
          {(currentPath === '/staff/dashboard' || (currentPath === '/dashboard' && role === 'staff')) && (
            <StaffDashboard
              onSelectComplaint={handleSelectComplaint}
              onNavigate={handleNavClick}
            />
          )}

          {/* D. HOD DASHBOARD */}
          {(currentPath === '/hod/dashboard' ||
            (currentPath === '/dashboard' &&
              (role === 'hod' || role === 'department_head' || role === 'admin'))) && (
            <HodDashboard
              onSelectComplaint={handleSelectComplaint}
              onNavigate={handleNavClick}
            />
          )}

          {/* SHARED / AUTHORIZED MODULES */}
          {currentPath === '/complaint-directory' && (
            <ComplaintDirectoryPage
              onSelectComplaint={handleSelectComplaint}
              onOpenCreate={() => setIsCreateOpen(true)}
              initialBuildingFilter={buildingFilter}
            />
          )}

          {currentPath === '/campus-map' && (
            <CampusMapPage
              onSelectComplaint={handleSelectComplaint}
              onFilterBuilding={handleFilterBuilding}
            />
          )}

          {currentPath === '/knowledge-base' && <KnowledgeBasePage />}

          {currentPath === '/assets' && <AssetsPage />}

          {currentPath === '/maintenance-planner' && <MaintenancePlannerPage />}

          {currentPath === '/recurring-issues' && (
            <RecurringIssuesPage onSelectComplaint={handleSelectComplaint} />
          )}

          {(currentPath === '/analytics' || currentPath === '/reports') && <AnalyticsPage />}

          {currentPath === '/admin-management' && <AdminManagementPage />}

          {currentPath === '/audit-logs' && <AuditLogsPage />}

          {currentPath === '/profile' && (
            <ProfilePage
              onSignOut={() => {
                logout();
                navigateTo('/login');
              }}
              onAccountDeleted={() => {
                logout();
                navigateTo('/login');
              }}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <CreateComplaintModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleComplaintCreated}
      />

      <ComplaintDetailsModal
        complaintId={selectedComplaintId}
        isOpen={Boolean(selectedComplaintId)}
        onClose={() => setSelectedComplaintId(null)}
        onUpdated={() => {
          window.dispatchEvent(new CustomEvent('sc360_data_updated'));
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
