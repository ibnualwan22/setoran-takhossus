'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiX, FiEdit2, FiTrash2, FiPlus, FiCalendar, FiUser, FiFileText } from 'react-icons/fi';

// Helper format tanggal (opsional, bisa pakai bawaan)
function formatDateID(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00Z'); // Anggap UTC
    return date.toLocaleDateString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'
    });
}

export default function IzinPanjangClient({ santriList, initialIzinList }) {
  const [izinList, setIzinList] = useState(initialIzinList);
  const [globalError, setGlobalError] = useState('');
  const [formError, setFormError] = useState('');

  // === State form tambah ===
  const [showAddForm, setShowAddForm] = useState(false);
  const [santriId, setSantriId] = useState('');
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [jenisIzin, setJenisIzin] = useState('SAKIT');
  const [keterangan, setKeterangan] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // State loading hapus
  const [deletingId, setDeletingId] = useState(null);

  // === STATE untuk Modal Edit ===
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedIzin, setSelectedIzin] = useState(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // === State untuk Form Edit ===
  const [editTanggalMulai, setEditTanggalMulai] = useState('');
  const [editTanggalSelesai, setEditTanggalSelesai] = useState('');
  const [editJenisIzin, setEditJenisIzin] = useState('SAKIT');
  const [editKeterangan, setEditKeterangan] = useState('');

  // === Fungsi Tambah ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError('');
    setGlobalError('');

    const body = { santriId, tanggalMulai, tanggalSelesai, jenisIzin, keterangan };

    const res = await fetch('/api/izin-panjang', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const newIzin = await res.json();
      const formattedNewIzin = {
        ...newIzin,
        tanggalMulai: newIzin.tanggalMulai.split('T')[0],
        tanggalSelesai: newIzin.tanggalSelesai.split('T')[0],
      };
      setIzinList([formattedNewIzin, ...izinList]);
      toast.success('Izin jangka panjang berhasil dicatat.');
      
      setSantriId('');
      setTanggalMulai('');
      setTanggalSelesai('');
      setJenisIzin('SAKIT');
      setKeterangan('');
      setShowAddForm(false);

    } else {
      const data = await res.json();
      setFormError(data.error || 'Gagal menambahkan izin');
      toast.error(data.error || 'Gagal menambahkan izin');
    }
    setIsLoading(false);
  };

  // === Fungsi Hapus ===
  const handleDelete = async (izinId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus catatan izin ini?')) {
      return;
    }
    
    setDeletingId(izinId);
    setGlobalError('');

    const res = await fetch(`/api/izin-panjang/${izinId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setIzinList(izinList.filter((izin) => izin.id !== izinId));
      toast.success('Izin berhasil dihapus.');
    } else {
      const data = await res.json();
      setGlobalError(data.error || 'Gagal menghapus izin');
      toast.error(data.error || 'Gagal menghapus izin');
    }
    setDeletingId(null);
  };
  
  // === Fungsi untuk Modal Edit ===
  const openEditModal = (izin) => {
    setSelectedIzin(izin);
    setEditError('');
    setEditTanggalMulai(izin.tanggalMulai);
    setEditTanggalSelesai(izin.tanggalSelesai);
    setEditJenisIzin(izin.jenisIzin);
    setEditKeterangan(izin.keterangan || '');
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedIzin(null);
  };
  
  // === Fungsi Submit Edit ===
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIzin) return;

    setIsEditLoading(true);
    setEditError('');

    const body = {
        tanggalMulai: editTanggalMulai,
        tanggalSelesai: editTanggalSelesai,
        jenisIzin: editJenisIzin,
        keterangan: editKeterangan,
    };

    const res = await fetch(`/api/izin-panjang/${selectedIzin.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const updatedIzin = await res.json();
      const formattedUpdatedIzin = {
        ...updatedIzin,
        tanggalMulai: updatedIzin.tanggalMulai.split('T')[0],
        tanggalSelesai: updatedIzin.tanggalSelesai.split('T')[0],
      };

      setIzinList(
        izinList.map(item => (item.id === formattedUpdatedIzin.id ? formattedUpdatedIzin : item))
      );
      toast.success('Izin berhasil diperbarui.');
      closeEditModal();
    } else {
      const data = await res.json();
      setEditError(data.error || 'Gagal memperbarui izin');
      toast.error(data.error || 'Gagal memperbarui izin');
    }
    setIsEditLoading(false);
  };

  // Fungsi untuk mendapatkan badge warna berdasarkan jenis izin
  const getJenisBadge = (jenis) => {
    const badges = {
      SAKIT: 'bg-red-100 text-red-800',
      PULANG: 'bg-blue-100 text-blue-800',
      LAINNYA: 'bg-gray-100 text-gray-800'
    };
    return badges[jenis] || badges.LAINNYA;
  };

  return (
    <div className="space-y-6">
      {/* Notifikasi Error Global */}
      {globalError && (
        <div className="p-4 text-sm text-red-800 bg-red-100 rounded-lg flex items-start">
          <span className="flex-1">{globalError}</span>
          <button onClick={() => setGlobalError('')} className="ml-2">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tombol Tambah - Mobile Friendly */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
        >
          <FiPlus className="w-5 h-5" />
          <span>Tambah Izin Baru</span>
        </button>
      )}

      {/* === FORM TAMBAH - Responsive === */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          {/* Header Form */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 md:px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-semibold text-white flex items-center gap-2">
              <FiPlus className="w-5 h-5" />
              Tambah Izin Jangka Panjang
            </h2>
            <button
              onClick={() => {
                setShowAddForm(false);
                setFormError('');
              }}
              className="text-white hover:bg-indigo-800 p-2 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-4 md:p-6">
            {formError && (
              <div className="p-4 mb-4 text-sm text-red-800 bg-red-100 rounded-lg flex items-start">
                <span className="flex-1">{formError}</span>
                <button onClick={() => setFormError('')} className="ml-2">
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="space-y-4">
              {/* Pilih Santri */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FiUser className="w-4 h-4" />
                  Pilih Santri
                </label>
                <select
                  value={santriId}
                  onChange={(e) => setSantriId(e.target.value)}
                  required
                  className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="">-- Pilih Santri --</option>
                  {santriList.map(s => (
                    <option key={s.id} value={s.id}>{s.nama}</option>
                  ))}
                </select>
              </div>

              {/* Tanggal - Stack di mobile, side by side di desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FiCalendar className="w-4 h-4" />
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    required
                    className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FiCalendar className="w-4 h-4" />
                    Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={tanggalSelesai}
                    onChange={(e) => setTanggalSelesai(e.target.value)}
                    required
                    className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Jenis Izin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Izin
                </label>
                <select
                  value={jenisIzin}
                  onChange={(e) => setJenisIzin(e.target.value)}
                  required
                  className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="SAKIT">Sakit</option>
                  <option value="PULANG">Izin Pulang</option>
                  <option value="LAINNYA">Lainnya</option>
                </select>
              </div>

              {/* Keterangan */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FiFileText className="w-4 h-4" />
                  Keterangan (opsional)
                </label>
                <textarea
                  placeholder="Contoh: Opname di RS, Keperluan keluarga, dll"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex flex-col-reverse md:flex-row gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormError('');
                }}
                className="w-full md:w-auto px-6 py-3 font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full md:w-auto px-6 py-3 font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Menyimpan...' : 'Simpan Izin'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* === DAFTAR IZIN - Card di Mobile, Table di Desktop === */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-4 md:px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">
            Daftar Izin Jangka Panjang
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Total: {izinList.length} izin aktif
          </p>
        </div>

        {/* Mobile View - Cards */}
        <div className="md:hidden divide-y divide-gray-200">
          {izinList.length === 0 ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <FiFileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">Belum ada data izin jangka panjang.</p>
            </div>
          ) : (
            izinList.map((izin) => (
              <div
                key={izin.id}
                className={`p-4 ${deletingId === izin.id ? 'bg-red-50' : 'bg-white'} transition-colors`}
              >
                <div className="space-y-3">
                  {/* Nama Santri */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FiUser className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="font-semibold text-gray-900">
                        {izin.santri?.nama || 'Santri dihapus'}
                      </span>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getJenisBadge(izin.jenisIzin)}`}>
                      {izin.jenisIzin}
                    </span>
                  </div>

                  {/* Tanggal */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiCalendar className="w-4 h-4 text-gray-400" />
                    <span>
                      {formatDateID(izin.tanggalMulai)} - {formatDateID(izin.tanggalSelesai)}
                    </span>
                  </div>

                  {/* Keterangan */}
                  {izin.keterangan && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <FiFileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{izin.keterangan}</span>
                    </div>
                  )}

                  {/* Tombol Aksi */}
                  <div className="flex gap-2 pt-2">
                    {deletingId === izin.id ? (
                      <span className="text-sm text-red-500 font-medium">Menghapus...</span>
                    ) : (
                      <>
                        <button
                          onClick={() => openEditModal(izin)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          <FiEdit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(izin.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          Hapus
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nama Santri
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mulai
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Selesai
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jenis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Keterangan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {izinList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                      <FiFileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">Belum ada data izin jangka panjang.</p>
                  </td>
                </tr>
              ) : (
                izinList.map((izin) => (
                  <tr
                    key={izin.id}
                    className={`${deletingId === izin.id ? 'bg-red-50' : 'hover:bg-gray-50'} transition-colors`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <FiUser className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {izin.santri?.nama || 'Santri dihapus'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDateID(izin.tanggalMulai)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatDateID(izin.tanggalSelesai)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getJenisBadge(izin.jenisIzin)}`}>
                        {izin.jenisIzin}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                      {izin.keterangan || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {deletingId === izin.id ? (
                        <span className="text-red-500">Menghapus...</span>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openEditModal(izin)}
                            className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1 transition-colors"
                          >
                            <FiEdit2 className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(izin.id)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1 transition-colors"
                          >
                            <FiTrash2 className="w-4 h-4" />
                            Hapus
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* === MODAL EDIT - Responsive === */}
      {isEditModalOpen && selectedIzin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 md:px-6 py-4 flex items-center justify-between sticky top-0">
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <FiEdit2 className="w-5 h-5" />
                Edit Izin
              </h2>
              <button
                onClick={closeEditModal}
                className="text-white hover:bg-indigo-800 p-2 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Form Edit */}
            <form onSubmit={handleEditSubmit} className="p-4 md:p-6">
              {editError && (
                <div className="p-4 mb-4 text-sm text-red-800 bg-red-100 rounded-lg flex items-start">
                  <span className="flex-1">{editError}</span>
                  <button onClick={() => setEditError('')} className="ml-2">
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <div className="space-y-4">
                {/* Info santri (tidak bisa diubah) */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FiUser className="w-4 h-4" />
                    Santri
                  </label>
                  <input
                    type="text"
                    value={selectedIzin.santri?.nama || ''}
                    disabled
                    className="w-full px-4 py-3 text-gray-500 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
                  />
                </div>

                {/* Tanggal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <FiCalendar className="w-4 h-4" />
                      Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      value={editTanggalMulai}
                      onChange={(e) => setEditTanggalMulai(e.target.value)}
                      required
                      className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <FiCalendar className="w-4 h-4" />
                      Tanggal Selesai
                    </label>
                    <input
                      type="date"
                      value={editTanggalSelesai}
                      onChange={(e) => setEditTanggalSelesai(e.target.value)}
                      required
                      className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Jenis Izin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jenis Izin
                  </label>
                  <select
                    value={editJenisIzin}
                    onChange={(e) => setEditJenisIzin(e.target.value)}
                    required
                    className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  >
                    <option value="SAKIT">Sakit</option>
                    <option value="PULANG">Izin Pulang</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>
                </div>

                {/* Keterangan */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <FiFileText className="w-4 h-4" />
                    Keterangan (opsional)
                  </label>
                  <textarea
                    placeholder="Keterangan"
                    value={editKeterangan}
                    onChange={(e) => setEditKeterangan(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="flex flex-col-reverse md:flex-row gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="w-full md:w-auto px-6 py-3 font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isEditLoading}
                  className="w-full md:flex-1 px-6 py-3 font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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