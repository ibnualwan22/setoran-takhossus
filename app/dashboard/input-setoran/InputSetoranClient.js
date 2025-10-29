'use client';

import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';

export default function InputSetoranClient({ santriList, kitabList, currentUser }) {
  const [searchQuery, setSearchQuery] = useState('');

  // === State untuk Modal ===
  const [isSetoranModalOpen, setIsSetoranModalOpen] = useState(false);
  const [isIzinModalOpen, setIsIzinModalOpen] = useState(false);
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

  // === State untuk Form Izin ===
  const [jenisIzin, setJenisIzin] = useState('SAKIT');
  const [keteranganIzin, setKeteranganIzin] = useState('');

  // === Logika Pencarian ===
  const filteredSantri = useMemo(() => {
    if (!searchQuery) {
      return santriList;
    }
    return santriList.filter((santri) =>
      santri.nama.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, santriList]);

  // === Fungsi Buka/Tutup Modal ===

  const resetFormStates = () => {
    setFormError('');
    setIsLoading(false);
    setKategori('WAJIB');
    setKitabId('');
    setHalamanDari('');
    setHalamanSampai('');
    setBarisKe('');
    setKeteranganSetoran('');
    setJenisIzin('SAKIT');
    setKeteranganIzin('');
  };

  const openSetoranModal = (santri) => {
    resetFormStates();
    setSelectedSantri(santri);
    setIsSetoranModalOpen(true);
  };

  const openIzinModal = (santri) => {
    resetFormStates();
    setSelectedSantri(santri);
    setIsIzinModalOpen(true);
  };

  const closeModals = () => {
    setIsSetoranModalOpen(false);
    setIsIzinModalOpen(false);
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
      toast.success(`Setoran ${kategori} untuk ${selectedSantri.nama} berhasil dicatat!`); // GANTI INI
  closeModals();
}else {
      const data = await res.json();
      setFormError(data.error || 'Gagal mencatat setoran.');
    }
    setIsLoading(false);
  };

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
      toast.success(`Izin ${jenisIzin} untuk ${selectedSantri.nama} berhasil dicatat!`); // GANTI INI
  closeModals();
} else {
      const data = await res.json();
      setFormError(data.error || 'Gagal mencatat izin.');
    }
    setIsLoading(false);
  };

  return (
    <div>
      {/* === Fitur Pencarian Cepat === */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Cari nama santri..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-lg px-4 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* === Daftar Santri === */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Santri</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Penyimak</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredSantri.map((santri) => (
              <tr key={santri.id}>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                  {santri.nama}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">
                  {santri.penyimak?.nama || 'N/A'}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => openSetoranModal(santri)}
                    className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Setoran
                  </button>
                  <button
                    onClick={() => openIzinModal(santri)}
                    className="px-3 py-1 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700"
                  >
                    Izin
                  </button>
                </td>
              </tr>
            ))}
            {filteredSantri.length === 0 && (
                <tr>
                    <td colSpan="3" className="px-4 py-4 text-center text-gray-500">
                        Santri tidak ditemukan.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* === MODAL FORM SETORAN === */}
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

                {/* Halaman */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Halaman Dari</label>
                    <input
                      type="text"
                      value={halamanDari}
                      onChange={(e) => setHalamanDari(e.target.value)}
                      className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Halaman Sampai</label>
                    <input
                      type="text"
                      value={halamanSampai}
                      onChange={(e) => setHalamanSampai(e.target.value)}
                      className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                {/* Baris Ke (Opsional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Baris Ke (Opsional)</label>
                  <input
                    type="text"
                    value={barisKe}
                    onChange={(e) => setBarisKe(e.target.value)}
                    className="w-full px-3 py-2 mt-1 text-gray-900 border border-gray-300 rounded-md"
                  />
                </div>

                {/* Keterangan Setoran (Opsional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Keterangan (Opsional)</label>
                  <textarea
                    value={keteranganSetoran}
                    onChange={(e) => setKeteranganSetoran(e.target.value)}
                    rows={2}
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
                  className="px-4 py-2 font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan Setoran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === MODAL FORM IZIN === */}
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