'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function KitabManagementClient({ initialKitab }) {
  const router = useRouter();
  const [kitabList, setKitabList] = useState(initialKitab);
  
  // State untuk notifikasi
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [editError, setEditError] = useState('');

  // State untuk form TAMBAH
  const [namaKitab, setNamaKitab] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // State untuk Modal EDIT
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKitab, setSelectedKitab] = useState(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [editNamaKitab, setEditNamaKitab] = useState('');

  // State untuk loading HAPUS
  const [deletingId, setDeletingId] = useState(null);

  // === Fungsi untuk Form TAMBAH ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError('');

    const res = await fetch('/api/kitab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ namaKitab }),
    });

    if (res.ok) {
      setNamaKitab('');
      const newKitab = await res.json();
      setKitabList([...kitabList, newKitab].sort((a, b) => a.namaKitab.localeCompare(b.namaKitab))); // Jaga agar tetap terurut
    } else {
      const data = await res.json();
      setFormError(data.error || 'Gagal menambahkan kitab');
    }
    setIsLoading(false);
  };

  // === Fungsi untuk HAPUS ===
  const handleDelete = async (kitabId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kitab ini?')) {
      return;
    }
    
    setDeletingId(kitabId);
    setError('');

    const res = await fetch(`/api/kitab/${kitabId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setKitabList(kitabList.filter((kitab) => kitab.id !== kitabId));
    } else {
      const data = await res.json();
      setError(data.error || 'Gagal menghapus kitab');
    }
    setDeletingId(null);
  };

  // === Fungsi untuk Modal EDIT ===
  const openEditModal = (kitab) => {
    setSelectedKitab(kitab);
    setEditNamaKitab(kitab.namaKitab);
    setEditError('');
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setSelectedKitab(null);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedKitab) return;
    
    setIsEditLoading(true);
    setEditError('');

    const res = await fetch(`/api/kitab/${selectedKitab.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ namaKitab: editNamaKitab }),
    });

    if (res.ok) {
      const updatedKitab = await res.json();
      closeEditModal();
      setKitabList(
        kitabList
          .map(k => (k.id === updatedKitab.id ? updatedKitab : k))
          .sort((a, b) => a.namaKitab.localeCompare(b.namaKitab)) // Jaga urutan
      );
    } else {
      const data = await res.json();
      setEditError(data.error || 'Gagal memperbarui kitab');
    }
    setIsEditLoading(false);
  };

  return (
    <div>
      {/* Notifikasi Error Global (untuk hapus/edit) */}
      {error && (
        <div className="p-3 text-sm text-red-800 bg-red-100 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* === FORM TAMBAH KITAB === */}
      <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Tambah Kitab Baru</h2>
        {formError && (
          <div className="p-3 text-sm text-red-800 bg-red-100 rounded-md mb-4">
            {formError}
          </div>
        )}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Nama Kitab (cth: Alfiyah Ibnu Malik)"
            value={namaKitab}
            onChange={(e) => setNamaKitab(e.target.value)}
            required
            className="flex-grow px-3 py-2 text-gray-900 border border-gray-300 rounded-md"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {isLoading ? '...' : 'Simpan'}
          </button>
        </div>
      </form>

      {/* === TABEL DAFTAR KITAB === */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Kitab</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {kitabList.map((kitab) => (
              <tr key={kitab.id} className={deletingId === kitab.id ? 'bg-red-50' : ''}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  {kitab.namaKitab}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium w-40">
                  {deletingId === kitab.id ? (
                    <span className="text-sm text-red-500">Menghapus...</span>
                  ) : (
                    <>
                      <button
                        onClick={() => openEditModal(kitab)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(kitab.id)}
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

      {/* === MODAL EDIT KITAB === */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Edit Kitab</h2>
            <form onSubmit={handleUpdateSubmit}>
              {editError && (
                <div className="p-3 text-sm text-red-800 bg-red-100 rounded-md mb-4">
                  {editError}
                </div>
              )}
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nama Kitab"
                  value={editNamaKitab}
                  onChange={(e) => setEditNamaKitab(e.target.value)}
                  required
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