'use client';

import { useState } from 'react';

// Helper format tanggal (opsional, bisa pakai bawaan)
function formatDateID(dateString) { // dateString adalah YYYY-MM-DD
    if (!dateString) return '';
    // Buat Date object dengan asumsi UTC agar tidak bergeser
    const [year, month, day] = dateString.split('-');
    // Gunakan UTC agar 'toLocaleDateString' tidak melakukan konversi timezone aneh
    const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day))); 
    return date.toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        timeZone: 'UTC' // Tetap UTC agar output konsisten dengan YYYY-MM-DD
    });
}


export default function HolidayClient({ initialHolidays }) {
  const [holidays, setHolidays] = useState(initialHolidays);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  // State form tambah
  const [tanggal, setTanggal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // State loading hapus
  const [deletingId, setDeletingId] = useState(null);

  // === Fungsi Tambah ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setFormError('');
    setError('');

    const res = await fetch('/api/holidays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tanggal, keterangan }),
    });

    if (res.ok) {
      setTanggal('');
      setKeterangan('');
      const newHoliday = await res.json();
      // Format tanggal sebelum disimpan di state
      const formattedNewHoliday = {
        ...newHoliday,
        tanggal: newHoliday.tanggal.split('T')[0] // Ambil YYYY-MM-DD
      };
      // Tambah dan urutkan lagi
      setHolidays([...holidays, formattedNewHoliday].sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal)));
    } else {
      const data = await res.json();
      setFormError(data.error || 'Gagal menambahkan hari libur');
    }
    setIsLoading(false);
  };

  // === Fungsi Hapus ===
  const handleDelete = async (holidayId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus tanggal libur ini?')) {
      return;
    }
    
    setDeletingId(holidayId);
    setError('');

    const res = await fetch(`/api/holidays/${holidayId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setHolidays(holidays.filter((h) => h.id !== holidayId));
    } else {
      const data = await res.json();
      setError(data.error || 'Gagal menghapus hari libur');
    }
    setDeletingId(null);
  };

  return (
    <div>
      {/* Notifikasi Error Global (untuk hapus) */}
      {error && (
        <div className="p-3 text-sm text-red-800 bg-red-100 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* === FORM TAMBAH === */}
      <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Tambah Hari Libur Baru</h2>
        {formError && (
          <div className="p-3 text-sm text-red-800 bg-red-100 rounded-md mb-4">
            {formError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            required
            className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md"
          />
          <input
            type="text"
            placeholder="Keterangan (Opsional)"
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan Tanggal'}
          </button>
        </div>
      </form>

      {/* === TABEL DAFTAR HARI LIBUR === */}
      <h2 className="text-xl font-semibold mb-4">Daftar Hari Libur</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {holidays.map((holiday) => (
              <tr key={holiday.id} className={deletingId === holiday.id ? 'bg-red-50' : ''}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {formatDateID(holiday.tanggal)}
                </td>
                <td className="px-4 py-2 text-sm text-gray-700">
                  {holiday.keterangan || '-'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium w-32">
                  {deletingId === holiday.id ? (
                    <span className="text-sm text-red-500">Menghapus...</span>
                  ) : (
                    <button
                      onClick={() => handleDelete(holiday.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Hapus
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {holidays.length === 0 && (
                <tr>
                    <td colSpan="3" className="px-4 py-4 text-center text-gray-500">
                        Belum ada hari libur manual yang ditambahkan.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}