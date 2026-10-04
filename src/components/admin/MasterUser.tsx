import React, { useState } from 'react';
import { db } from '../../db/storage';
import { User, UserRole } from '../../types/database';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { AuditService } from '../../services/AuditService';
import {
  UserCog,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  KeyRound,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Info,
  RotateCcw,
  Power,
  Mail,
  User as UserIcon,
} from 'lucide-react';

const DEFAULT_PASSWORD = '12345678';

export const MasterUser: React.FC = () => {
  const { currentUser, role } = useAuth();
  const { showToast } = useNotification();

  const [users, setUsers] = useState<User[]>(() => db.getUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form fields
  const [formUsername, setFormUsername] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('GURU_BK');
  const [formPassword, setFormPassword] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  // Reset Password Modal state
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [customResetPassword, setCustomResetPassword] = useState(DEFAULT_PASSWORD);
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Delete confirmation
  const [deleteModalUser, setDeleteModalUser] = useState<User | null>(null);

  const refreshUsers = () => {
    setUsers(db.getUsers());
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormUsername('');
    setFormName('');
    setFormEmail('');
    setFormRole('GURU_BK');
    setFormPassword(DEFAULT_PASSWORD);
    setFormIsActive(true);
    setShowPasswordInput(false);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormUsername(user.username);
    setFormName(user.name);
    setFormEmail(user.email || '');
    setFormRole(user.role);
    setFormPassword(''); // blank means keep existing password
    setFormIsActive(user.is_active !== false);
    setShowPasswordInput(false);
    setIsFormModalOpen(true);
  };

  // Save Create or Update
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanUsername = formUsername.trim().toLowerCase();
    const cleanName = formName.trim();
    const cleanEmail = formEmail.trim();

    if (!cleanUsername) {
      showToast('warning', 'Peringatan', 'Username wajib diisi.');
      return;
    }
    if (!cleanName) {
      showToast('warning', 'Peringatan', 'Nama pengguna wajib diisi.');
      return;
    }

    // Check unique username
    const existing = users.find(
      (u) => u.username.toLowerCase() === cleanUsername && u.id !== editingUser?.id
    );
    if (existing) {
      showToast('error', 'Username Sudah Terpakai', `Username "${cleanUsername}" sudah digunakan oleh pengguna lain.`);
      return;
    }

    const now = new Date().toISOString();

    if (editingUser) {
      // Update
      const updatedUser: User = {
        ...editingUser,
        username: cleanUsername,
        name: cleanName,
        email: cleanEmail || `${cleanUsername}@smkn1gunungguruh.sch.id`,
        role: formRole,
        is_active: formIsActive,
        updated_at: now,
      };

      // Update password only if provided
      if (formPassword.trim()) {
        updatedUser.password = formPassword.trim();
      }

      db.saveUser(updatedUser);

      if (currentUser) {
        AuditService.log(
          currentUser.id,
          currentUser.name,
          role,
          'UPDATE_USER',
          'UserManagement',
          `Memperbarui data pengguna: ${cleanName} (${cleanUsername})`,
          updatedUser.id
        );
      }

      showToast('success', 'Berhasil', `Data pengguna ${cleanName} berhasil diperbarui.`);
    } else {
      // Create
      const newUser: User = {
        id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        username: cleanUsername,
        name: cleanName,
        email: cleanEmail || `${cleanUsername}@smkn1gunungguruh.sch.id`,
        role: formRole,
        password: formPassword.trim() || DEFAULT_PASSWORD,
        is_active: formIsActive,
        created_at: now,
        updated_at: now,
      };

      db.saveUser(newUser);

      if (currentUser) {
        AuditService.log(
          currentUser.id,
          currentUser.name,
          role,
          'CREATE_USER',
          'UserManagement',
          `Membuat pengguna baru: ${cleanName} (${cleanUsername}) sebagai ${formRole}`,
          newUser.id
        );
      }

      showToast(
        'success',
        'Pengguna Ditambahkan',
        `Pengguna ${cleanName} berhasil dibuat dengan password: ${newUser.password}`
      );
    }

    refreshUsers();
    setIsFormModalOpen(false);
  };

  // Toggle user active / inactive status
  const handleToggleStatus = (targetUser: User) => {
    if (currentUser && targetUser.id === currentUser.id) {
      showToast('warning', 'Tidak Diizinkan', 'Anda tidak dapat menonaktifkan akun Anda sendiri yang sedang aktif.');
      return;
    }

    const newStatus = db.toggleUserStatus(targetUser.id);
    refreshUsers();

    if (currentUser) {
      AuditService.log(
        currentUser.id,
        currentUser.name,
        role,
        'TOGGLE_USER_STATUS',
        'UserManagement',
        `Mengubah status pengguna ${targetUser.name} (${targetUser.username}) menjadi ${newStatus ? 'AKTIF' : 'NONAKTIF'}`,
        targetUser.id
      );
    }

    showToast(
      newStatus ? 'success' : 'info',
      newStatus ? 'Akun Diaktifkan' : 'Akun Dinonaktifkan',
      `Status akun ${targetUser.name} (${targetUser.username}) sekarang: ${newStatus ? 'Aktif' : 'Nonaktif'}.`
    );
  };

  // Handle open reset password dialog
  const handleOpenReset = (user: User) => {
    setResetModalUser(user);
    setCustomResetPassword(DEFAULT_PASSWORD);
    setShowResetPassword(false);
  };

  // Confirm reset password
  const handleConfirmResetPassword = () => {
    if (!resetModalUser) return;

    const newPass = customResetPassword.trim() || DEFAULT_PASSWORD;
    db.resetUserPassword(resetModalUser.id, newPass);
    refreshUsers();

    if (currentUser) {
      AuditService.log(
        currentUser.id,
        currentUser.name,
        role,
        'RESET_USER_PASSWORD',
        'UserManagement',
        `Mereset kata sandi pengguna ${resetModalUser.name} (${resetModalUser.username}) ke: ${newPass}`,
        resetModalUser.id
      );
    }

    showToast(
      'success',
      'Password Berhasil Direset',
      `Kata sandi untuk ${resetModalUser.name} telah direset ke: ${newPass}`
    );

    setResetModalUser(null);
  };

  // Handle delete user
  const handleConfirmDelete = () => {
    if (!deleteModalUser) return;

    if (currentUser && deleteModalUser.id === currentUser.id) {
      showToast('error', 'Ditolak', 'Anda tidak dapat menghapus akun Anda sendiri.');
      setDeleteModalUser(null);
      return;
    }

    if (deleteModalUser.username.toLowerCase() === 'administrator') {
      showToast('error', 'Ditolak', 'Akun master administrator tidak dapat dihapus.');
      setDeleteModalUser(null);
      return;
    }

    db.deleteUser(deleteModalUser.id);
    refreshUsers();

    if (currentUser) {
      AuditService.log(
        currentUser.id,
        currentUser.name,
        role,
        'DELETE_USER',
        'UserManagement',
        `Menghapus pengguna: ${deleteModalUser.name} (${deleteModalUser.username})`,
        deleteModalUser.id
      );
    }

    showToast('info', 'Pengguna Dihapus', `Akun pengguna ${deleteModalUser.name} berhasil dihapus.`);
    setDeleteModalUser(null);
  };

  // Filtering
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q));

    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;

    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && u.is_active !== false) ||
      (statusFilter === 'INACTIVE' && u.is_active === false);

    return matchSearch && matchRole && matchStatus;
  });

  // Metrics
  const totalCount = users.length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const guruBkCount = users.filter((u) => u.role === 'GURU_BK').length;
  const siswaCount = users.filter((u) => u.role === 'SISWA').length;
  const activeCount = users.filter((u) => u.is_active !== false).length;
  const inactiveCount = users.filter((u) => u.is_active === false).length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold mb-1">
            <UserCog className="w-3.5 h-3.5 text-purple-600" />
            <span>Master Data Akun</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Manajemen Pengguna (User Management)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola akun pengguna SIBKS, kontrol status aktif/nonaktif, hak akses peran, dan reset kata sandi (default: {DEFAULT_PASSWORD}).
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pengguna</span>
          <div className="text-xl font-black text-slate-800 mt-1">{totalCount}</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Akun terdaftar</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-purple-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Administrator</span>
          <div className="text-xl font-black text-purple-700 mt-1">{adminCount}</div>
          <span className="text-[10px] text-purple-500 mt-0.5 block">Hak penuh sistem</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-blue-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Guru BK</span>
          <div className="text-xl font-black text-blue-700 mt-1">{guruBkCount}</div>
          <span className="text-[10px] text-blue-500 mt-0.5 block">Konselor sekolah</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-emerald-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Siswa</span>
          <div className="text-xl font-black text-emerald-700 mt-1">{siswaCount}</div>
          <span className="text-[10px] text-emerald-500 mt-0.5 block">Pengisi angket</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-emerald-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Status Aktif</span>
          <div className="text-xl font-black text-emerald-700 mt-1 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{activeCount}</span>
          </div>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">Bisa masuk</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-rose-200/90 shadow-2xs">
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Status Nonaktif</span>
          <div className="text-xl font-black text-rose-700 mt-1 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>{inactiveCount}</span>
          </div>
          <span className="text-[10px] text-rose-600 mt-0.5 block">Akses diblokir</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pengguna berdasarkan nama, username, atau email..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-[11px] font-medium text-slate-500">Peran:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-blue-500 bg-white"
            >
              <option value="ALL">Semua Peran</option>
              <option value="ADMIN">Administrator</option>
              <option value="GURU_BK">Guru BK</option>
              <option value="SISWA">Siswa</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-[11px] font-medium text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-blue-500 bg-white"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif Saja</option>
              <option value="INACTIVE">Nonaktif Saja</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Peran</th>
                <th className="py-3 px-4">Status Akun</th>
                <th className="py-3 px-4">Kata Sandi</th>
                <th className="py-3 px-4">Aktivitas Terakhir</th>
                <th className="py-3 px-4 text-center">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <UserCog className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Tidak ada data pengguna yang cocok</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Coba sesuaikan kata kunci pencarian atau filter.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isActive = u.is_active !== false;
                  const isCurrent = currentUser?.id === u.id;
                  const isMasterAdmin = u.username.toLowerCase() === 'administrator';

                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        !isActive ? 'bg-slate-50/40 text-slate-400' : ''
                      }`}
                    >
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-700'
                                : u.role === 'GURU_BK'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {u.role === 'ADMIN' ? (
                              <ShieldCheck className="w-4 h-4" />
                            ) : u.role === 'GURU_BK' ? (
                              <UserCheck className="w-4 h-4" />
                            ) : (
                              <GraduationCap className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span className="truncate">{u.name}</span>
                              {isCurrent && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 font-extrabold uppercase">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{u.email || '-'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                        <code className="bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-700 border border-slate-200">
                          {u.username}
                        </code>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : u.role === 'GURU_BK'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {u.role === 'ADMIN' && <ShieldCheck className="w-3 h-3" />}
                          {u.role === 'GURU_BK' && <UserCheck className="w-3 h-3" />}
                          {u.role === 'SISWA' && <GraduationCap className="w-3 h-3" />}
                          <span>{u.role}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>Nonaktif</span>
                          </span>
                        )}
                      </td>

                      {/* Password Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[11px] font-mono text-slate-600">
                            {u.password ? '••••••••' : `Default (${DEFAULT_PASSWORD})`}
                          </span>
                        </div>
                      </td>

                      {/* Activity */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {u.last_login ? (
                          <div>
                            <span className="text-slate-700 font-medium">
                              {new Date(u.last_login).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <div className="text-[10px] text-slate-400">
                              {new Date(u.last_login).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum pernah masuk</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Toggle Active/Inactive */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isCurrent
                                ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                                : isActive
                                ? 'bg-emerald-50 hover:bg-rose-50 text-emerald-700 hover:text-rose-700 border-emerald-200 hover:border-rose-200'
                                : 'bg-rose-50 hover:bg-emerald-50 text-rose-700 hover:text-emerald-700 border-rose-200 hover:border-emerald-200'
                            }`}
                            title={
                              isCurrent
                                ? 'Akun Anda sendiri'
                                : isActive
                                ? 'Klik untuk NONAKTIFKAN akun'
                                : 'Klik untuk AKTIFKAN akun'
                            }
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() => handleOpenReset(u)}
                            className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                            title={`Reset Password ke default (${DEFAULT_PASSWORD})`}
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit User */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                            title="Edit Data Pengguna"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete User */}
                          <button
                            type="button"
                            onClick={() => setDeleteModalUser(u)}
                            disabled={isCurrent || isMasterAdmin}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isCurrent || isMasterAdmin
                                ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                                : 'border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700'
                            }`}
                            title={
                              isCurrent
                                ? 'Tidak bisa menghapus akun Anda sendiri'
                                : isMasterAdmin
                                ? 'Akun master administrator tidak boleh dihapus'
                                : 'Hapus Pengguna'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card at Bottom */}
      <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl text-purple-900 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-bold">Ketentuan Pengelolaan Pengguna:</p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-purple-800">
            <li>Kata sandi default untuk pengguna baru atau setelah di-reset adalah <strong>{DEFAULT_PASSWORD}</strong>.</li>
            <li>Akun Administrator master memiliki username <strong>administrator</strong> dengan kata sandi <strong>rahasia</strong>.</li>
            <li>Pengguna yang dinonaktifkan tidak akan bisa masuk ke dalam sistem sampai diaktifkan kembali oleh Administrator.</li>
          </ul>
        </div>
      </div>

      {/* MODAL: Form Tambah / Edit Pengguna */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-purple-800 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <UserCog className="w-5 h-5 text-purple-200" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">
                    {editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
                  </h3>
                  <p className="text-[11px] text-purple-200">
                    {editingUser ? 'Perbarui informasi dan hak akses akun' : 'Buat kredensial akun baru untuk akses SIBKS'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Username */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder="contoh: bk_guru2, 22231005"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-blue-500"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Huruf kecil tanpa spasi</span>
                </div>

                {/* Peran / Role */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Peran (Role) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-blue-500 bg-white"
                  >
                    <option value="ADMIN">Administrator</option>
                    <option value="GURU_BK">Guru Bimbingan Konseling</option>
                    <option value="SISWA">Siswa</option>
                  </select>
                </div>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nama lengkap dan gelar (jika ada)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-blue-500"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Alamat Email (Opsional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="email@smkn1gunungguruh.sch.id"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-blue-500"
                  />
                </div>
              </div>

              {/* Kata Sandi */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    {editingUser ? 'Ubah Kata Sandi (Kosongkan jika tidak diubah)' : 'Kata Sandi (Password)'}
                  </label>
                  {!editingUser && (
                    <span className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-1.5 py-0.5 rounded">
                      Default: {DEFAULT_PASSWORD}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPasswordInput ? 'text' : 'password'}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={editingUser ? 'Masukkan password baru untuk mengganti' : DEFAULT_PASSWORD}
                    className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordInput(!showPasswordInput)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPasswordInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Status Switch */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-700 block">Status Akun Aktif</span>
                  <p className="text-[11px] text-slate-500">
                    Jika dinonaktifkan, pengguna tidak dapat login ke sistem.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Tambah Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Reset Password */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-5 bg-amber-500 text-white flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">Reset Kata Sandi Pengguna</h3>
                <p className="text-[11px] text-amber-100">
                  Kembalikan kata sandi ke bawaan default atau tentukan kata sandi baru
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Pengguna:</span>
                <div className="font-bold text-slate-900 mt-0.5 text-sm">{resetModalUser.name}</div>
                <div className="text-slate-500 font-mono text-[11px]">
                  Username: <strong className="text-slate-800">{resetModalUser.username}</strong> • Peran: {resetModalUser.role}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">
                    Kata Sandi Baru
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomResetPassword(DEFAULT_PASSWORD)}
                    className="text-[10px] text-purple-700 hover:underline font-semibold cursor-pointer"
                  >
                    Gunakan Default ({DEFAULT_PASSWORD})
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    value={customResetPassword}
                    onChange={(e) => setCustomResetPassword(e.target.value)}
                    placeholder="Masukkan kata sandi baru"
                    className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResetPassword}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Reset Kata Sandi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Pengguna */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="p-5 bg-rose-600 text-white flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-white shrink-0" />
              <div>
                <h3 className="font-extrabold text-sm">Hapus Akun Pengguna</h3>
                <p className="text-[11px] text-rose-100">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-600">
                Apakah Anda yakin ingin menghapus akun pengguna berikut dari database sistem?
              </p>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <div className="font-bold text-rose-900">{deleteModalUser.name}</div>
                <div className="text-rose-700 font-mono text-[11px] mt-0.5">
                  @{deleteModalUser.username} • {deleteModalUser.role}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeleteModalUser(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Ya, Hapus Pengguna
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
