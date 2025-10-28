'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SantriManagementClient({ initialSantri, penyimakList }) {
  const router = useRouter();
  const [santriList, setSantriList] = useState(initialSantri);
  
  // State untuk notifikasi
  const [syncMessage, setSyncMessage] = useState('');
  const [syncError, setSyncError] = useState('');

  // State untuk loading
  const [isSyncLoading, setIsSyncLoading] = useState(false);
  const [assignLoadingId, setAssignLoadingId] = useState(null);
  
  // === STATE BARU untuk loading toggle aktif/nonaktif ===
  const [togglingId, setTogglingId] = useState(null);

  // === Fungsi untuk SINKRONISASI ===
  const handleSync = async () => {
    setIsSyncLoading(true);
    setSyncMessage('');
    setSyncError('');

    const res = await fetch('/api/santri/sync', {
      method: 'POST',
    });
    const data = await res.json();

    if (res.ok) {
      setSyncMessage(`Sinkronisasi berhasil! Total data difilter: ${data.totalDifilter}, Total disimpan: ${data.totalDisimpan}.`);
      router.refresh(); 
    } else {
      setSyncError(data.error || 'Gagal melakukan sinkronisasi');
    }
    setIsSyncLoading(false);
  };

  // === Fungsi untuk ASSIGN PENYIMAK ===
  const handleAssignPenyimak = async (santriId, newPenyimakId) => {
    setAssignLoadingId(santriId);
    
    const penyimakIdToSend = (newPenyimakId === 'null' || newPenyimakId === '') ? null : parseInt(newPenyimakId);

    const res = await fetch(`/api/santri/${santriId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ penyimakId: penyimakIdToSend }),
      });
      
    if (res.ok) {
        const updatedSantri = await res.json();
        setSantriList(santriList.map(s => 
            s.id === updatedSantri.id ? updatedSantri : s
        ));
    } else {
        alert('Gagal mengupdate penyimak');
    }
    setAssignLoadingId(null);
  };

  // === FUNGSI BARU untuk Toggle Aktif/Nonaktif ===
  const handleToggleActive = async (santriId, newStatus) => {
    setTogglingId(santriId);
    
    const res = await fetch(`/api/santri/${santriId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus }),
      });
      
    if (res.ok) {
        const updatedSantri = await res.json();
        // Update state lokal
        setSantriList(santriList.map(s => 
            s.id === updatedSantri.id ? updatedSantri : s
        ));
    } else {
        alert('Gagal mengupdate status santri');
    }
    
    setTogglingId(null);
  };

  return (
    <div>
      {/* === Tombol Sinkronisasi === */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Sinkronisasi Data</h2>
        <p className="text-sm text-gray-600 mb-4">
          Klik tombol ini untuk mengambil data santri (Putra Takhossus)
          terbaru dari API SIGAP.
        </p>
        <button
          onClick={handleSync}
          disabled={isSyncLoading}
          className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSyncLoading ? 'Sinkronisasi berjalan...' : 'Mulai Sinkronisasi Data Santri'}
        </button>
        {syncMessage && (
            <div className="mt-4 p-3 text-sm text-green-800 bg-green-100 rounded-md">
                {syncMessage}
            </div>
        )}
        {syncError && (
            <div className="mt-4 p-3 text-sm text-red-800 bg-red-100 rounded-md">
                {syncError}
            </div>
        )}
      </div>

      {/* === TABEL DAFTAR SANTRI (Diperbarui) === */}
      <h2 className="text-xl font-semibold mb-4">Daftar Santri Lokal</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Santri</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assign Penyimak</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {santriList.map((santri) => (
              <tr key={santri.id} className={!santri.is_active ? 'bg-gray-100' : ''}>
                
                <td className="px-4 py-2 whitespace-nowrap text-sm">
                  <span className={!santri.is_active ? 'text-gray-500' : 'text-gray-900'}>
                    {santri.nama}
                  </span>
                </td>
                
                <td className="px-4 py-2 whitespace-nowrap text-sm">
                  {santri.is_active ? (
                    <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                      Aktif
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
                      Nonaktif
                    </span>
                  )}
                </td>
                
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium w-64">
                  {assignLoadingId === santri.id ? (
                    <span className="text-sm text-gray-500">Menyimpan...</span>
                  ) : (
                    <select
                      value={santri.penyimakId || 'null'}
                      onChange={(e) => handleAssignPenyimak(santri.id, e.target.value)}
                      disabled={assignLoadingId === santri.id || togglingId === santri.id}
                      className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md"
                    >
                      <option value="null">-- Belum di-assign --</option>
                      {penyimakList.map((penyimak) => (
                        <option key={penyimak.id} value={penyimak.id}>
                          {penyimak.nama}
                        </option>
                      ))}
                    </select>
                  )}
                </td>

                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium w-40">
                  {togglingId === santri.id ? (
                    <span className="text-sm text-gray-500">Memproses...</span>
                  ) : (
                    <>
                      {santri.is_active ? (
                        <button
                          onClick={() => handleToggleActive(santri.id, false)}
                          disabled={assignLoadingId === santri.id}
                          className="text-red-600 hover:text-red-900"
                        >
                          Nonaktifkan
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleActive(santri.id, true)}
                          disabled={assignLoadingId === santri.id}
                          className="text-green-600 hover:text-green-900"
                        >
                          Aktifkan
                        </button>
                      )}
                    </>
                  )}
                </td>

              </tr>
            ))}
            {santriList.length === 0 && (
                <tr>
                    <td colSpan="4" className="px-4 py-4 text-center text-gray-500">
                        Belum ada data santri. Silakan lakukan sinkronisasi.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}