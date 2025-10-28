'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UserManagementClient({ initialUsers, session }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [editError, setEditError] = useState('');

  // === State untuk Form TAMBAH ===
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('PENCATAT');
  const [isLoading, setIsLoading] = useState(false);

  // === State untuk Modal EDIT ===
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  
  // State untuk form EDIT
  const [editNama, setEditNama] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState('PENCATAT');
  const [editPassword, setEditPassword] = useState('');

  // === STATE LOADING BARU UNTUK HAPUS ===
  const [deletingId, setDeletingId] = useState(null);

  // === Fungsi untuk Form TAMBAH ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError('');

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama, username, password, role }),
    });

    if (res.ok) {
      setNama('');
      setUsername('');
      setPassword('');
      setRole('PENCATAT');
      
      router.refresh(); 
      const newUser = await res.json();
      setUsers((prevUsers) => [newUser, ...prevUsers]);
    } else {
      const data = await res.json();
      setFormError(data.error || 'Gagal menambahkan pengguna');
    }
    setIsLoading(false);
  };

  // === Fungsi untuk HAPUS (DENGAN LOADING) ===
  const handleDelete = async (userId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
      return;
    }
    
    setDeletingId(userId); // <-- TAMBAHKAN INI
    setError('');

    const res = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setUsers(users.filter((user) => user.id !== userId));
    } else {
      const data = await res.json();
      setError(data.error || 'Gagal menghapus pengguna');
    }
    
    setDeletingId(null); // <-- TAMBAHKAN INI
  };

  // === Fungsi untuk Modal EDIT ===
  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditNama(user.penyimak?.nama || '');
    setEditUsername(user.username);
    setEditRole(user.role);
    setEditPassword(''); 
    setEditError('');
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();

    if (!selectedUser) {
      setEditError('Tidak ada pengguna yang dipilih. Silakan tutup dan coba lagi.');
      return;
    }
    
    setIsEditLoading(true);
    setEditError('');

    const dataToUpdate = {
      nama: editNama,
      username: editUsername,
      role: editRole,
    };
    
    if (editPassword) {
      dataToUpdate.password = editPassword;
    }

    const res = await fetch(`/api/users/${selectedUser.id}`, { 
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToUpdate),
    });

    if (res.ok) {
      const updatedUserId = selectedUser.id;
      
      closeEditModal(); 
      router.refresh(); 
      
      setUsers(users.map(u => 
        u.id === updatedUserId 
          ? { ...u, username: editUsername, role: editRole, penyimak: { ...u.penyimak, nama: editNama } } 
          : u
      ));
    } else {
      const data = await res.json();
      setEditError(data.error || 'Gagal memperbarui pengguna');
    }
    setIsEditLoading(false);
  };

  return (
    <div>
      {/* ... (Form Tambah Pengguna tidak berubah) ... */}
      <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Tambah Pengguna Baru</h2>
        {formError && (
          <div className="p-3 text-sm text-red-800 bg-red-100 rounded-md mb-4">
            {formError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nama Lengkap (untuk Penyimak)"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            required
            className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md"
          />
          <input
            type="text"
            placeholder="Username (untuk login)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md"
          >
            {session.user.role === 'ADMIN' && (
              <option value="STAF">Staf</option>
            )}
            <option value="PENCATAT">Pencatat</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Menyimpan...' : 'Simpan Pengguna'}
        </button>
      </form>

      {/* Notifikasi Error Global (untuk hapus) */}
      {error && (
        <div className="p-3 text-sm text-red-800 bg-red-100 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {/* === TABEL DAFTAR PENGGUNA (DENGAN LOADING HAPUS) === */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama (Penyimak)</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className={deletingId === user.id ? 'bg-red-50' : ''}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  {user.penyimak?.nama || 'N/A'}
                </td>
                <td className="px-4 py-2 whitespace-Grap text-sm text-gray-900">
                  {user.username}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                  {user.role}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                  {/* Tampilkan loading jika ID-nya sedang dihapus */}
                  {deletingId === user.id ? (
                    <span className="text-sm text-red-500">Menghapus...</span>
                  ) : (
                    <>
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="ml-4 text-red-600 hover:text-red-900"
                      >
                        Hapus
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ... (Modal Edit tidak berubah) ... */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Edit Pengguna</h2>
            <form onSubmit={handleUpdateSubmit}>
              {editError && (
                <div className="p-3 text-sm text-red-800 bg-red-100 rounded-md mb-4">
                  {editError}
                </div>
              )}
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nama Lengkap"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  placeholder="Username"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md"
                />
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md"
                >
                  {session.user.role === 'ADMIN' && (
                    <option value="STAF">Staf</option>
                  )}
                  <option value="PENCATAT">Pencatat</option>
                </select>
                <input
                  type="password"
                  placeholder="Password Baru (kosongkan jika tidak ganti)"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md"
                />
              </div>
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="px-4 py-2 font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isEditLoading}
                  className="px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  {isEditLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}