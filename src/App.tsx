import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { SystemSettingsModal } from './components/admin/SystemSettingsModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MasterSiswa } from './components/admin/MasterSiswa';
import { MasterKelas } from './components/admin/MasterKelas';
import { MasterUser } from './components/admin/MasterUser';
import { MasterTahunAjar } from './components/admin/MasterTahunAjar';
import { MasterAngket } from './components/admin/MasterAngket';
import { MasterPertanyaan } from './components/admin/MasterPertanyaan';
import { AuditLogViewer } from './components/admin/AuditLogViewer';
import { BkDashboard } from './components/bk/BkDashboard';
import { StudentListBK } from './components/bk/StudentListBK';
import { ClassRecapView } from './components/bk/ClassRecapView';
import { SchoolRecapView } from './components/bk/SchoolRecapView';
import { CareerRecapView } from './components/bk/CareerRecapView';
import { FollowUpManager } from './components/bk/FollowUpManager';
import { CounselingNotesManager } from './components/bk/CounselingNotesManager';
import { ReportsBK } from './components/bk/ReportsBK';
import { StudentDashboard } from './components/student/StudentDashboard';
import { QuestionnaireTaking } from './components/student/QuestionnaireTaking';
import { StudentHistory } from './components/student/StudentHistory';
import { StudentProfile } from './components/student/StudentProfile';
import { GoogleSheetsManagerView } from './components/common/GoogleSheetsManagerView';
import { GoogleSheetsSyncModal } from './components/common/GoogleSheetsSyncModal';
import { LoginPage } from './components/common/LoginPage';
import { CloudSyncService } from './services/CloudSyncService';
import { MySqlSyncService } from './services/MySqlSyncService';
import { Menu } from 'lucide-react';

const isMenuAllowedForRole = (menu: string, r: string): boolean => {
  if (menu === 'google-sheets') return true;
  if (r === 'ADMIN') {
    return [
      'admin-dashboard',
      'master-user',
      'master-tahun-ajar',
      'master-siswa',
      'master-kelas',
      'master-angket',
      'master-pertanyaan',
      'penugasan-angket',
      'audit-log',
    ].includes(menu);
  }
  if (r === 'GURU_BK') {
    return [
      'bk-dashboard',
      'bk-siswa',
      'bk-rekap-kelas',
      'bk-rekap-sekolah',
      'bk-pemetaan-karier',
      'bk-tindak-lanjut',
      'bk-catatan-konseling',
      'bk-laporan',
    ].includes(menu);
  }
  if (r === 'SISWA') {
    return [
      'siswa-dashboard',
      'siswa-angket-daftar',
      'siswa-angket-taking',
      'siswa-riwayat',
      'siswa-profil',
    ].includes(menu);
  }
  return false;
};

const getDefaultMenuForRole = (r: string): string => {
  if (r === 'ADMIN') return 'admin-dashboard';
  if (r === 'SISWA') return 'siswa-dashboard';
  return 'bk-dashboard';
};

const MainAppContent: React.FC = () => {
  const { role, isAuthenticated, currentUser } = useAuth();
  const [activeMenu, setActiveMenu] = useState<string>(() => {
    return currentUser ? getDefaultMenuForRole(currentUser.role) : 'bk-dashboard';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState<boolean>(false);

  // Questionnaire taking state for student
  const [takingTypeId, setTakingTypeId] = useState<string | null>(null);

  // Initialize Firestore and TiDB MySQL real-time synchronization across devices and pull all responses
  useEffect(() => {
    // 1. Init Firestore real-time snapshots
    CloudSyncService.initCloudSync();
    CloudSyncService.pullAllDataFromCloud().catch(() => {});

    // 2. Init & Sync TiDB MySQL in background
    MySqlSyncService.pullAllFromMySql()
      .then((res) => {
        // If MySQL was empty, automatically push existing dataset to MySQL
        if (res.success && (!res.count || res.count === 0)) {
          MySqlSyncService.pushAllToMySql().catch(() => {});
        }
      })
      .catch(() => {});

    const handleStorageSync = () => {
      window.dispatchEvent(new CustomEvent('sibks_data_synced'));
    };

    window.addEventListener('storage', handleStorageSync);

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('sibks_realtime_channel');
        bc.onmessage = () => {
          window.dispatchEvent(new CustomEvent('sibks_data_synced'));
        };
      } catch (e) {}
    }

    return () => {
      window.removeEventListener('storage', handleStorageSync);
      if (bc) {
        try {
          bc.close();
        } catch (e) {}
      }
    };
  }, []);

  // Synchronize default menu when role or user changes
  useEffect(() => {
    if (currentUser) {
      const defaultMenu = getDefaultMenuForRole(currentUser.role);
      setActiveMenu((prev) => (isMenuAllowedForRole(prev, currentUser.role) ? prev : defaultMenu));
      if (currentUser.role !== 'SISWA') {
        setTakingTypeId(null);
      }
    }
  }, [currentUser?.id, currentUser?.role]);

  // If user is not authenticated or logged in, show the comprehensive Login Page
  if (!isAuthenticated || !currentUser) {
    return (
      <>
        <LoginPage />
        <ToastContainer />
      </>
    );
  }

  // Ensure activeMenu is always valid for the active role (guarantees no blank screen)
  const currentMenu = isMenuAllowedForRole(activeMenu, role) ? activeMenu : getDefaultMenuForRole(role);

  const handleStartQuestionnaire = (typeId: string) => {
    setTakingTypeId(typeId);
    setActiveMenu('siswa-angket-taking');
  };

  const handleFinishQuestionnaire = () => {
    setTakingTypeId(null);
    setActiveMenu('siswa-riwayat');
  };

  const handleCancelQuestionnaire = () => {
    setTakingTypeId(null);
    setActiveMenu('siswa-dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        activeMenu={currentMenu}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenGoogleSheets={() => setIsSheetsModalOpen(true)}
      />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar
          activeMenu={currentMenu}
          onSelectMenu={(menu) => {
            if (menu === 'pengaturan-sistem') {
              setIsSettingsModalOpen(true);
            } else {
              setActiveMenu(menu);
              if (menu !== 'siswa-angket-taking') {
                setTakingTypeId(null);
              }
            }
          }}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Mobile menu trigger button */}
          <div className="md:hidden mb-4 flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <Menu className="w-4 h-4 text-blue-600" />
              <span>Menu Navigasi SIBKS</span>
            </button>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
              {role}
            </span>
          </div>

          {/* Common Google Sheets View */}
          {currentMenu === 'google-sheets' && <GoogleSheetsManagerView />}

          {/* Role: ADMIN Pages */}
          {role === 'ADMIN' && (
            <>
              {currentMenu === 'admin-dashboard' && (
                <AdminDashboard
                  onNavigate={setActiveMenu}
                  onOpenSettings={() => setIsSettingsModalOpen(true)}
                />
              )}
              {currentMenu === 'master-user' && <MasterUser />}
              {currentMenu === 'master-tahun-ajar' && <MasterTahunAjar />}
              {currentMenu === 'master-siswa' && <MasterSiswa />}
              {currentMenu === 'master-kelas' && <MasterKelas />}
              {currentMenu === 'master-angket' && <MasterAngket />}
              {currentMenu === 'master-pertanyaan' && <MasterPertanyaan />}
              {currentMenu === 'penugasan-angket' && <MasterAngket />}
              {currentMenu === 'audit-log' && <AuditLogViewer />}
              {/* Fallback for admin if menu is somehow not matched */}
              {!['admin-dashboard', 'master-user', 'master-tahun-ajar', 'master-siswa', 'master-kelas', 'master-angket', 'master-pertanyaan', 'penugasan-angket', 'audit-log', 'google-sheets'].includes(currentMenu) && (
                <AdminDashboard
                  onNavigate={setActiveMenu}
                  onOpenSettings={() => setIsSettingsModalOpen(true)}
                />
              )}
            </>
          )}

          {/* Role: GURU BK Pages */}
          {role === 'GURU_BK' && (
            <>
              {currentMenu === 'bk-dashboard' && <BkDashboard onNavigate={setActiveMenu} />}
              {currentMenu === 'bk-siswa' && <StudentListBK />}
              {currentMenu === 'bk-rekap-kelas' && <ClassRecapView />}
              {currentMenu === 'bk-rekap-sekolah' && <SchoolRecapView />}
              {currentMenu === 'bk-pemetaan-karier' && <CareerRecapView />}
              {currentMenu === 'bk-tindak-lanjut' && <FollowUpManager />}
              {currentMenu === 'bk-catatan-konseling' && <CounselingNotesManager />}
              {currentMenu === 'bk-laporan' && <ReportsBK />}
              {/* Fallback for guru bk */}
              {!['bk-dashboard', 'bk-siswa', 'bk-rekap-kelas', 'bk-rekap-sekolah', 'bk-pemetaan-karier', 'bk-tindak-lanjut', 'bk-catatan-konseling', 'bk-laporan', 'google-sheets'].includes(currentMenu) && (
                <BkDashboard onNavigate={setActiveMenu} />
              )}
            </>
          )}

          {/* Role: SISWA Pages */}
          {role === 'SISWA' && (
            <>
              {(currentMenu === 'siswa-dashboard' || currentMenu === 'siswa-angket-daftar') && (
                <StudentDashboard
                  onStartQuestionnaire={handleStartQuestionnaire}
                  onViewHistory={() => setActiveMenu('siswa-riwayat')}
                  onViewProfile={() => setActiveMenu('siswa-profil')}
                />
              )}
              {currentMenu === 'siswa-angket-taking' && takingTypeId && (
                <QuestionnaireTaking
                  questionnaireTypeId={takingTypeId}
                  onFinish={handleFinishQuestionnaire}
                  onCancel={handleCancelQuestionnaire}
                />
              )}
              {currentMenu === 'siswa-riwayat' && <StudentHistory />}
              {currentMenu === 'siswa-profil' && <StudentProfile />}
              {/* Fallback for siswa */}
              {!['siswa-dashboard', 'siswa-angket-daftar', 'siswa-angket-taking', 'siswa-riwayat', 'siswa-profil'].includes(currentMenu) && (
                <StudentDashboard
                  onStartQuestionnaire={handleStartQuestionnaire}
                  onViewHistory={() => setActiveMenu('siswa-riwayat')}
                  onViewProfile={() => setActiveMenu('siswa-profil')}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Floating Toast Notification Container */}
      <ToastContainer />

      {/* System Settings Modal */}
      <SystemSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      {/* Google Sheets Sync Modal */}
      <GoogleSheetsSyncModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </NotificationProvider>
  );
}
