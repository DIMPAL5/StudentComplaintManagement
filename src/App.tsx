import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
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
import { AuthModal } from './components/auth/AuthModal';
import { Complaint } from './types';

const MainApp: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [buildingFilter, setBuildingFilter] = useState<string | undefined>(undefined);

  // Sign In / Create Account Modal
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup' | 'forgot'>('signin');

  // If on landing page (or if unauthenticated)
  if (!isAuthenticated || currentPage === 'landing') {
    return (
      <>
        <LandingPage
          onEnterApp={() => setCurrentPage('dashboard')}
          onOpenAuth={(tab) => {
            setAuthModalTab(tab || 'signin');
            setIsAuthOpen(true);
          }}
        />
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          initialTab={authModalTab}
        />
      </>
    );
  }

  const handleSelectComplaint = (id: string) => {
    setSelectedComplaintId(id);
  };

  const handleFilterBuilding = (bldgName: string) => {
    setBuildingFilter(bldgName);
    setCurrentPage('complaint-directory');
  };

  const handleComplaintCreated = (complaint: Complaint) => {
    setSelectedComplaintId(complaint.id);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onOpenCreateComplaint={() => setIsCreateOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onNavigate={(page) => setCurrentPage(page)}
        onOpenAuthModal={() => {
          setAuthModalTab('signin');
          setIsAuthOpen(true);
        }}
      />

      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-16">
          {currentPage === 'dashboard' && (
            <DashboardPage
              onOpenCreate={() => setIsCreateOpen(true)}
              onSelectComplaint={handleSelectComplaint}
              onNavigate={(page) => setCurrentPage(page)}
            />
          )}

          {currentPage === 'complaint-directory' && (
            <ComplaintDirectoryPage
              onSelectComplaint={handleSelectComplaint}
              onOpenCreate={() => setIsCreateOpen(true)}
              initialBuildingFilter={buildingFilter}
            />
          )}

          {currentPage === 'campus-map' && (
            <CampusMapPage
              onSelectComplaint={handleSelectComplaint}
              onFilterBuilding={handleFilterBuilding}
            />
          )}

          {currentPage === 'knowledge-base' && <KnowledgeBasePage />}

          {currentPage === 'assets' && <AssetsPage />}

          {currentPage === 'maintenance-planner' && <MaintenancePlannerPage />}

          {currentPage === 'recurring-issues' && (
            <RecurringIssuesPage onSelectComplaint={handleSelectComplaint} />
          )}

          {(currentPage === 'analytics' || currentPage === 'reports') && <AnalyticsPage />}

          {currentPage === 'admin-management' && <AdminManagementPage />}

          {currentPage === 'audit-logs' && <AuditLogsPage />}

          {currentPage === 'profile' && (
            <ProfilePage
              onSignOut={() => setCurrentPage('landing')}
              onAccountDeleted={() => setCurrentPage('landing')}
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

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialTab={authModalTab}
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
