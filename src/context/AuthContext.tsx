import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../db/storage';
import { Student, Teacher, User, UserRole } from '../types/database';
import { AuditService } from '../services/AuditService';

export interface LoginResult {
  success: boolean;
  message?: string;
}

export interface StudentLoginResult {
  success: boolean;
  student?: Student;
  message?: string;
}

interface AuthContextType {
  currentUser: User | null;
  currentStudent: Student | null;
  currentTeacher: Teacher | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (username: string, password?: string) => LoginResult;
  loginStudentByNis: (nis: string) => StudentLoginResult;
  logout: () => void;
  switchRole: (role: UserRole, targetId?: string) => void;
  canManageMasterData: boolean;
  canAccessCounselingNotes: boolean;
  canFillQuestionnaire: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'sibks_active_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // When the user starts or restarts the app simulation, show login page
    const sessionActive = sessionStorage.getItem('sibks_session_active');
    if (!sessionActive) {
      localStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }
    const savedId = localStorage.getItem(CURRENT_USER_KEY);
    if (!savedId) return null;
    const users = db.getUsers();
    return users.find((u) => u.id === savedId) || null;
  });

  const currentStudent = React.useMemo<Student | null>(() => {
    if (!currentUser || currentUser.role !== 'SISWA') return null;
    const stds = db.getStudents();
    return (
      stds.find(
        (s) => s.id === currentUser.related_id || s.user_id === currentUser.id || s.nis === currentUser.username
      ) || null
    );
  }, [currentUser]);

  const currentTeacher = React.useMemo<Teacher | null>(() => {
    if (!currentUser || currentUser.role !== 'GURU_BK') return null;
    const tchs = db.getTeachers();
    return (
      tchs.find((t) => t.id === currentUser.related_id || t.user_id === currentUser.id) ||
      tchs[0] ||
      null
    );
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(CURRENT_USER_KEY, currentUser.id);
      sessionStorage.setItem('sibks_session_active', 'true');
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
      sessionStorage.removeItem('sibks_session_active');
    }
  }, [currentUser]);

  const login = (usernameOrId: string, passwordInput?: string): LoginResult => {
    const users = db.getUsers();
    const students = db.getStudents();
    const teachers = db.getTeachers();
    const clean = usernameOrId.toLowerCase().trim();

    if (!clean) {
      return { success: false, message: 'Masukkan username, NIS, atau NIP Anda.' };
    }

    // 1. Direct username or email match
    let user = users.find(
      (u) => u.username.toLowerCase() === clean || (u.email && u.email.toLowerCase() === clean)
    );

    // 2. Student NIS / NISN match
    if (!user) {
      const std = students.find((s) => s.nis.toLowerCase() === clean || s.nisn.toLowerCase() === clean);
      if (std) {
        user = users.find((u) => u.related_id === std.id || u.username.toLowerCase() === std.nis.toLowerCase());
      }
    }

    // 3. Teacher NIP match
    if (!user) {
      const cleanNip = clean.replace(/\s+/g, '');
      const tch = teachers.find((t) => t.nip.replace(/\s+/g, '').toLowerCase() === cleanNip);
      if (tch) {
        user = users.find((u) => u.related_id === tch.id);
      }
    }

    if (!user) {
      return { success: false, message: 'Akun dengan username, NIS, atau NIP tersebut tidak ditemukan.' };
    }

    // 4. Check if account is active
    if (user.is_active === false) {
      return {
        success: false,
        message: 'Akun ini telah dinonaktifkan oleh Administrator. Silakan hubungi admin sekolah untuk mengaktifkan kembali.',
      };
    }

    // 5. Password verification
    let expectedPassword = user.password;
    if (!expectedPassword) {
      if (user.username.toLowerCase() === 'administrator' || user.username.toLowerCase() === 'admin') {
        expectedPassword = 'rahasia';
      } else {
        expectedPassword = '12345678';
      }
    }

    const inputPwd = (passwordInput || '').trim();
    if (!inputPwd) {
      return { success: false, message: 'Masukkan kata sandi (password).' };
    }

    if (inputPwd !== expectedPassword) {
      return { success: false, message: 'Kata sandi (password) salah. Silakan periksa kembali.' };
    }

    // Update last_login
    const updatedUser: User = {
      ...user,
      last_login: new Date().toISOString(),
    };
    db.saveUser(updatedUser);

    setCurrentUser(updatedUser);
    sessionStorage.setItem('sibks_session_active', 'true');
    localStorage.setItem(CURRENT_USER_KEY, updatedUser.id);
    AuditService.log(
      updatedUser.id,
      updatedUser.name,
      updatedUser.role,
      'LOGIN',
      'Authentication',
      `Pengguna ${updatedUser.name} (${updatedUser.username}) berhasil masuk.`
    );
    return { success: true, message: `Selamat datang, ${updatedUser.name}!` };
  };

  const loginStudentByNis = (nisInput: string): StudentLoginResult => {
    const cleanNis = nisInput.trim().toLowerCase();
    if (!cleanNis) {
      return { success: false, message: 'Silakan masukkan NIS siswa.' };
    }

    const students = db.getStudents();
    const student = students.find(
      (s) => s.nis.toLowerCase() === cleanNis || s.nisn.toLowerCase() === cleanNis
    );

    if (!student) {
      return {
        success: false,
        message: `Data siswa dengan NIS "${nisInput}" tidak ditemukan di database.`,
      };
    }

    // Find or create user account for this student
    const users = db.getUsers();
    let user = users.find(
      (u) => u.related_id === student.id || u.username.toLowerCase() === student.nis.toLowerCase()
    );

    if (!user) {
      user = {
        id: `usr-std-${student.id}`,
        username: student.nis,
        name: student.name,
        email: `${student.nis}@siswa.smkn1gunungguruh.sch.id`,
        role: 'SISWA',
        related_id: student.id,
        password: '12345678',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.saveUser(user);
    }

    if (user.is_active === false) {
      return {
        success: false,
        message: 'Akun siswa Anda telah dinonaktifkan oleh Administrator. Silakan hubungi Guru BK.',
      };
    }

    const updatedUser: User = {
      ...user,
      last_login: new Date().toISOString(),
    };
    db.saveUser(updatedUser);

    setCurrentUser(updatedUser);
    sessionStorage.setItem('sibks_session_active', 'true');
    localStorage.setItem(CURRENT_USER_KEY, updatedUser.id);
    AuditService.log(
      updatedUser.id,
      updatedUser.name,
      'SISWA',
      'LOGIN_STUDENT_NIS',
      'StudentPortal',
      `Siswa ${student.name} (NIS: ${student.nis}) masuk langsung untuk pengisian angket.`
    );

    return {
      success: true,
      student,
      message: `Selamat datang, ${student.name}! Silakan isi angket bimbingan Anda.`,
    };
  };

  const logout = () => {
    if (currentUser) {
      AuditService.log(currentUser.id, currentUser.name, currentUser.role, 'LOGOUT', 'Authentication', `Pengguna ${currentUser.name} keluar.`);
    }
    sessionStorage.removeItem('sibks_session_active');
    localStorage.removeItem(CURRENT_USER_KEY);
    setCurrentUser(null);
  };

  const switchRole = (newRole: UserRole, targetId?: string) => {
    const users = db.getUsers();
    let targetUser: User | undefined;

    if (newRole === 'ADMIN') {
      targetUser = users.find((u) => u.role === 'ADMIN');
    } else if (newRole === 'GURU_BK') {
      targetUser = users.find((u) => u.role === 'GURU_BK');
    } else if (newRole === 'SISWA') {
      if (targetId) {
        targetUser = users.find((u) => u.role === 'SISWA' && (u.related_id === targetId || u.id === targetId));
      }
      if (!targetUser) {
        targetUser = users.find((u) => u.role === 'SISWA');
      }
    }

    if (targetUser) {
      setCurrentUser(targetUser);
      sessionStorage.setItem('sibks_session_active', 'true');
      localStorage.setItem(CURRENT_USER_KEY, targetUser.id);
      AuditService.log(
        targetUser.id,
        targetUser.name,
        targetUser.role,
        'SWITCH_ROLE',
        'UserRole',
        `Beralih ke peran ${newRole} (${targetUser.name})`
      );
    }
  };

  const role: UserRole = currentUser?.role || 'GURU_BK';
  const canManageMasterData = role === 'ADMIN';
  const canAccessCounselingNotes = role === 'GURU_BK' || role === 'ADMIN';
  const canFillQuestionnaire = role === 'SISWA';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentStudent,
        currentTeacher,
        role,
        isAuthenticated: !!currentUser,
        login,
        loginStudentByNis,
        logout,
        switchRole,
        canManageMasterData,
        canAccessCounselingNotes,
        canFillQuestionnaire,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
