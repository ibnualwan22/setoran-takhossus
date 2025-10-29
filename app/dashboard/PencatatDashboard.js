'use client';

import { useState } from 'react';

export default function PencatatDashboard({ alpaList, kitabList, formattedDate }) {
  // === State untuk Modal ===
  const [isSetoranModalOpen, setIsSetoranModalOpen] = useState(false);
  const [isIzinModalOpen, setIsIzinModalOpen] = useState(false); // <-- TAMBAHKAN INI
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  
  // === State untuk Form Setoran ===
  const [kategori, setKategori] = useState('WAJIB');
  const [kitabId, setKitabId] = useState('');
  const [halamanDari, setHalamanDari] = useState('');
  const [halamanSampai, setHalamanSampai] = useState('');
  const [barisKe, setBarisKe] = useState('');
  const [keteranganSetoran, setKeteranganSetoran] = useState('');
  
  // === State untuk Form Izin === (BARU)
  const [jenisIzin, setJenisIzin] = useState('SAKIT');
  const [keteranganIzin, setKeteranganIzin] = useState('');

  // === State untuk daftar Alpa (agar bisa diupdate) ===
  const [currentAlpaList, setCurrentAlpaList] = useState(alpaList);

  // === Fungsi Buka/Tutup Modal ===
  const resetFormStates = () => {
    setFormError('');
    setIsLoading(false);
    // Form Setoran
    setKategori('WAJIB');
    setKitabId('');
    setHalamanDari('');
    setHalamanSampai('');
    setBarisKe('');
    setKeteranganSetoran('');
    // Form Izin (BARU)
    setJenisIzin('SAKIT');
    setKeteranganIzin('');
  };

  const openSetoranModal = (santri) => {
    resetFormStates();
    setSelectedSantri(santri);
    setIsSetoranModalOpen(true);
  };
  
  // Fungsi Buka Modal Izin (BARU)
  const openIzinModal = (santri) => {
    resetFormStates();
    setSelectedSantri(santri);
    setIsIzinModalOpen(true);
  };

  const closeModals = () => {
    setIsSetoranModalOpen(false);
    setIsIzinModalOpen(false); // <-- TAMBAHKAN INI
    setSelectedSantri(null);
  };

  // === Fungsi Submit Form ===
  const handleSetoranSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSantri) return;
    setIsLoading(true);
    setFormError('');

    const body = {
      santriId: selectedSantri.id,
      kategori,
      kitabId: kategori === 'MUKHOTIM' ? kitabId : null,
      halamanDari,
      halamanSampai,
      barisKe,
      keterangan: keteranganSetoran,
    };

    const res = await fetch('/api/setoran', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      alert(`Setoran ${kategori} untuk ${selectedSantri.nama} berhasil dicatat!`);
      // Update UI: Hapus santri dari daftar 'To-Do'
      setCurrentAlpaList(
        currentAlpaList.filter((s) => s.id !== selectedSantri.id)
      );
      closeModals();
    } else {
      const data = await res.json();
      setFormError(data.error || 'Gagal mencatat setoran.');
    }
    setIsLoading(false);
  };
  
  // Fungsi Submit Form Izin (BARU)
  const handleIzinSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSantri) return;
    setIsLoading(true);
    setFormError('');

    const body = {
      santriId: selectedSantri.id,
      jenisIzin,
      keterangan: keteranganIzin,
    };

    const res = await fetch('/api/izin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      alert(`Izin ${jenisIzin} untuk ${selectedSantri.nama} berhasil dicatat!`);
      // Update UI: Hapus santri dari daftar 'To-Do'
      setCurrentAlpaList(
        currentAlpaList.filter((s) => s.id !== selectedSantri.id)
      );
      closeModals();
    } else {
      const data = await res.json();
      setFormError(data.error || 'Gagal mencatat izin.');
    }
    setIsLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Dashboard Asuhan Anda
      </h1>
      <p className="text-lg text-gray-700 mb-6">{formattedDate}</p>

      {/* === Peringatan (Fitur Utama) === */}
      <div className={`p-4 rounded-lg mb-6 ${
        currentAlpaList.length > 0 
          ? 'bg-red-100 border border-red-300' 
          : 'bg-green-100 border border-green-300'
      }`}>
        <h2 className={`text-xl font-bold ${
          currentAlpaList.length > 0 ? 'text-red-800' : 'text-green-800'
        }`}>
          {currentAlpaList.length > 0
            ? `PERINGATAN: Ada ${currentAlpaList.length} santri asuhan Anda yang belum setoran wajib.`
            : 'KEREN! Semua santri asuhan Anda sudah setoran wajib hari ini.'
          }
        </h2>
      </div>

      {/* === Daftar Santri (To-Do List) === */}
      {currentAlpaList.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Santri (Belum Setor)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentAlpaList.map((santri) => (
                <tr key={santri.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                    {santri.nama}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium space-x-2"> {/* <-- Tambah space-x-2 */}
                    <button
                      onClick={() => openSetoranModal(santri)}
                      className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                    >
                      Catat Setoran
                    </button>
                    {/* === TOMBOL IZIN (BARU) === */}
                    <button
                      onClick={() => openIzinModal(santri)}
                      className="px-3 py-1 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700"
                    >
                      Catat Izin
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* === MODAL FORM SETORAN === (Tidak berubah) */}
      {isSetoranModalOpen && selectedSantri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h2 className="text-2xl font-bold mb-2">Input Setoran</h2>
            <p className="text-lg text-gray-800 mb-4 font-semibold">{selectedSantri.nama}</p>
            
            <form onSubmit={handleSetoranSubmit}>
              {formError && (
                <div className="p-3 text-sm text-red-800 bg-red-100 rounded-md mb-4">
                  {formError}
                </div>
              )}
              <div className="space-y-4">
                {/* Kategori */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Kategori Setoran</label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"
                  >
                    <option value="WAJIB">Wajib (Fathul Muin)</option>
                    <option value="MUKHOTIM">Mukhotim</option>
                  </select>
                </div>

                {/* Kitab (Dinamis) */}
                {kategori === 'WAJIB' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kitab</label>
                    <input
                      type="text"
                      value="Fathul Muin"
                      disabled
                      className="w-full px-3 py-2 mt-1 text-gray-500 bg-gray-100 border border-gray-300 rounded-md"
                    />
                  </div>
                )}
                {kategori === 'MUKHOTIM' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Kitab Mukhotim</label>
                    <select
                      value={kitabId}
                      onChange={(e) => setKitabId(e.target.value)}
                      required
                      className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"
                    >
                      <option value="">-- Pilih Kitab --</option>
                      {kitabList.map((kitab) => (
                        <option key={kitab.id} value={kitab.id}>{kitab.namaKitab}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Halaman Dari</label>
                    <input type="text" value={halamanDari} onChange={(e) => setHalamanDari(e.target.value)} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"/>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Halaman Sampai</label>
                    <input type="text" value={halamanSampai} onChange={(e) => setHalamanSampai(e.target.value)} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"/>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Baris Ke (Opsional)</label>
                  <input type="text" value={barisKe} onChange={(e) => setBarisKe(e.target.value)} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Keterangan (Opsional)</label>
                  <textarea value={keteranganSetoran} onChange={(e) => setKeteranganSetoran(e.target.value)} rows={2} className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"/>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-4">
                <button type="button" onClick={closeModals} className="px-4 py-2 font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Batal</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400">
                  {isLoading ? 'Menyimpan...' : 'Simpan Setoran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === MODAL FORM IZIN (BARU) === */}
      {isIzinModalOpen && selectedSantri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h2 className="text-2xl font-bold mb-2">Input Izin</h2>
            <p className="text-lg text-gray-800 mb-4 font-semibold">{selectedSantri.nama}</p>
            
            <form onSubmit={handleIzinSubmit}>
              {formError && (
                <div className="p-3 text-sm text-red-800 bg-red-100 rounded-md mb-4">
                  {formError}
                </div>
              )}
              <div className="space-y-4">
                {/* Jenis Izin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Jenis Izin</label>
                  <select
                    value={jenisIzin}
                    onChange={(e) => setJenisIzin(e.target.value)}
                    required
                    className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"
                  >
                    <option value="SAKIT">Sakit</option>
                    <option value="PULANG">Izin Pulang</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>
                </div>

                {/* Keterangan (Wajib) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Keterangan (Wajib)</label>
                  <textarea
                    value={keteranganIzin}
                    onChange={(e) => setKeteranganIzin(e.target.value)}
                    rows={3}
                    required
                    className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 disabled:bg-gray-400"
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan Izin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}