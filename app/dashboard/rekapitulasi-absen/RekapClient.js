'use client';

import { useState } from 'react';

// Fungsi helper untuk format tanggal ke YYYY-MM-DD
function toYYYYMMDD(date) {
  return date.toISOString().split('T')[0];
}

// Dapatkan tanggal hari ini (WIB)
function getTodayWIB() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  return toYYYYMMDD(now);
}

export default function RekapClient({ santriList, kitabList }) {
  // === State untuk Filter ===
  const [startDate, setStartDate] = useState(getTodayWIB());
  const [endDate, setEndDate] = useState(getTodayWIB());
  const [santriId, setSantriId] = useState(''); // 'ALL' atau ID
  const [type, setType] = useState('SEMUA'); // SEMUA, WAJIB, MUKHOTIM, IZIN
  
  // === State untuk Data & Loading ===
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // === State untuk Modal ===
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState(null); // Data yang akan diedit
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // === State untuk Form Edit ===
  // (Kita akan isi ini saat modal dibuka)
  const [editFields, setEditFields] = useState({});

  // === Fungsi: Ambil Data (Fetch) ===
  const handleFetchData = async () => {
    setIsLoading(true);
    setError('');
    setData([]); // Kosongkan data lama

    // Buat URL parameter
    const params = new URLSearchParams();
    params.set('startDate', startDate);
    params.set('endDate', endDate);
    if (santriId) params.set('santriId', santriId);
    if (type) params.set('type', type);

    try {
      const res = await fetch(`/api/rekap?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal mengambil data');
      }
      const rekapData = await res.json();
      setData(rekapData);
    } catch (err) {
      setError(err.message);
    }
    setIsLoading(false);
  };

  // === Fungsi: Hapus Data ===
  const handleDelete = async (item) => {
    const { id, dataType } = item;
    const isSetoran = dataType === 'WAJIB' || dataType === 'MUKHOTIM';
    const apiEndpoint = isSetoran ? `/api/setoran/${id}` : `/api/izin/${id}`;
    
    if (!window.confirm(`Apakah Anda yakin ingin menghapus catatan ${dataType} ini?`)) {
      return;
    }

    try {
      const res = await fetch(apiEndpoint, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menghapus');
      }
      // Hapus dari state UI
      setData(data.filter(d => d.id !== id || d.dataType !== dataType));
    } catch (err) {
      setError(err.message);
    }
  };

  // === Fungsi: Buka Modal Edit ===
  const openEditModal = (item) => {
    setSelectedData(item);
    setEditError('');
    
    // Isi form edit berdasarkan tipe data
    if (item.dataType === 'IZIN') {
      setEditFields({
        jenisIzin: item.jenisIzin,
        keterangan: item.keterangan,
      });
    } else { // WAJIB atau MUKHOTIM
      setEditFields({
        kitabId: item.kitabId || '',
        halamanDari: item.halamanDari || '',
        halamanSampai: item.halamanSampai || '',
        barisKe: item.barisKe || '',
        keterangan: item.keterangan || '',
      });
    }
    setIsModalOpen(true);
  };

  // === Fungsi: Handle Perubahan Form Edit ===
  const handleEditChange = (e) => {
    setEditFields({
      ...editFields,
      [e.target.name]: e.target.value,
    });
  };

  // === Fungsi: Submit Edit ===
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsEditLoading(true);
    setEditError('');

    const { id, dataType } = selectedData;
    const isSetoran = dataType === 'WAJIB' || dataType === 'MUKHOTIM';
    const apiEndpoint = isSetoran ? `/api/setoran/${id}` : `/api/izin/${id}`;

    try {
      const res = await fetch(apiEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFields),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan perubahan');
      }
      
      const updatedItem = await res.json();
      
      // Update data di tabel UI
      setData(data.map(d => 
        (d.id === id && d.dataType === dataType) ? { ...d, ...updatedItem, dataType: d.dataType } : d
      ));
      
      setIsModalOpen(false);
    } catch (err) {
      setEditError(err.message);
    }
    setIsEditLoading(false);
  };

  // Format tanggal untuk tampilan
  const formatTgl = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'
    });
  };

  return (
    <div>
      {/* === Panel Filter === */}
      <div className="p-4 border rounded-lg bg-gray-50 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md" />
          <select value={santriId} onChange={(e) => setSantriId(e.target.value)} className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md">
            <option value="">Semua Santri</option>
            {santriList.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md">
            <option value="SEMUA">Semua Tipe</option>
            <option value="WAJIB">Setoran Wajib</option>
            <option value="MUKHOTIM">Setoran Mukhotim</option>
            <option value="IZIN">Izin</option>
          </select>
          <button
            onClick={handleFetchData}
            disabled={isLoading}
            className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Mencari...' : 'Cari Data'}
          </button>
        </div>
        {error && <p className="text-red-600 mt-4">{error}</p>}
      </div>

      {/* === Tabel Hasil === */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Waktu</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Santri</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Detail</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pencatat</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={`${item.dataType}-${item.id}`}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{formatTgl(item.createdAt)}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.santri?.nama}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{item.dataType}</td>
                <td className="px-4 py-2 text-sm text-gray-700">
                  {item.dataType === 'IZIN'
                    ? `${item.jenisIzin}: ${item.keterangan}`
                    : `${item.kitab?.namaKitab || 'Fathul Muin'} (Hal: ${item.halamanDari || ''}-${item.halamanSampai || ''})`
                  }
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{item.pencatat?.username}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => openEditModal(item)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                  <button onClick={() => handleDelete(item)} className="ml-4 text-red-600 hover:text-red-900">Hapus</button>
                </td>
              </tr>
            ))}
            {!isLoading && data.length === 0 && (
              <tr><td colSpan={6} className="text-center py-4 text-gray-500">Tidak ada data. Silakan ubah filter dan klik "Cari Data".</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* === Modal Edit === */}
      {isModalOpen && selectedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Edit Catatan: {selectedData.santri?.nama}</h2>
            <form onSubmit={handleEditSubmit}>
              {editError && <p className="text-red-600 mb-4">{editError}</p>}
              
              {/* Form Izin */}
              {selectedData.dataType === 'IZIN' && (
                <div className="space-y-4">
                  <select name="jenisIzin" value={editFields.jenisIzin} onChange={handleEditChange} className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md">
                    <option value="SAKIT">Sakit</option>
                    <option value="PULANG">Izin Pulang</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>
                  <textarea name="keterangan" value={editFields.keterangan} onChange={handleEditChange} rows={3} className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md" />
                </div>
              )}

              {/* Form Setoran */}
              {(selectedData.dataType === 'WAJIB' || selectedData.dataType === 'MUKHOTIM') && (
                <div className="space-y-4">
                  {selectedData.dataType === 'MUKHOTIM' && (
                    <select name="kitabId" value={editFields.kitabId} onChange={handleEditChange} className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md">
                      <option value="">-- Pilih Kitab --</option>
                      {kitabList.map(k => <option key={k.id} value={k.id}>{k.namaKitab}</option>)}
                    </select>
                  )}
                  <input type="text" name="halamanDari" value={editFields.halamanDari} onChange={handleEditChange} placeholder="Halaman Dari" className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md" />
                  <input type="text" name="halamanSampai" value={editFields.halamanSampai} onChange={handleEditChange} placeholder="Halaman Sampai" className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md" />
                  <input type="text" name="barisKe" value={editFields.barisKe} onChange={handleEditChange} placeholder="Baris Ke" className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md" />
                  <textarea name="keterangan" value={editFields.keterangan} onChange={handleEditChange} rows={2} placeholder="Keterangan" className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md" />
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Batal</button>
                <button type="submit" disabled={isEditLoading} className="px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400">
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