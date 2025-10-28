'use client';

import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx'; // Import library excel
import ReportTable from './ReportTable'; // Import tabel yang baru kita buat

export default function ReportClientWrapper({ rekapData, daysArray, selectedMonth, selectedYear }) {
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, HADIR, IZIN, ALPA

  // 1. Logika Filter Status (Client-side)
  const filteredData = useMemo(() => {
    if (statusFilter === 'ALL') {
      return rekapData;
    }
    // Filter berdasarkan total
    return rekapData.filter(santri => {
      if (statusFilter === 'HADIR') return santri.totalHadir > 0;
      if (statusFilter === 'IZIN') return santri.totalIzin > 0;
      if (statusFilter === 'ALPA') return santri.totalAlpa > 0;
      return true;
    });
  }, [rekapData, statusFilter]);

  // 2. Logika Ekspor Excel
  const handleExport = () => {
    console.log('Memulai ekspor...');
    
    // Nama bulan untuk file
    const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('id-ID', { month: 'long' });
    const fileName = `Rekap Absensi ${monthName} ${selectedYear} (Filter: ${statusFilter}).xlsx`;

    // A. Siapkan Header (Baris 1)
    const headers = [
      'No', 
      'Nama Santri', 
      ...daysArray, // 1, 2, 3, ...
      'H', 
      'I', 
      'A'
    ];
    
    // B. Siapkan Data (Baris 2 dst.)
    const dataForSheet = filteredData.map((santri, index) => {
      const row = [
        index + 1,
        santri.nama
      ];
      // Isi status harian
      daysArray.forEach(day => {
        const status = santri.dates[day];
        // Ubah ikon menjadi teks
        if (status === 'HADIR') row.push('H');
        else if (status === 'IZIN') row.push('I');
        else if (status === 'ALPA') row.push('A');
        else if (status === 'LIBUR') row.push('-');
        else row.push('');
      });
      // Isi total
      row.push(santri.totalHadir);
      row.push(santri.totalIzin);
      row.push(santri.totalAlpa);
      
      return row;
    });

    // C. Buat Worksheet
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataForSheet]);
    
    // D. Atur Lebar Kolom (Opsional tapi bagus)
    ws['!cols'] = [
      { wch: 4 }, // No
      { wch: 30 }, // Nama
      ...daysArray.map(() => ({ wch: 3 })), // Tanggal
      { wch: 4 }, // H
      { wch: 4 }, // I
      { wch: 4 }, // A
    ];

    // E. Buat Workbook dan Unduh
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Rekap ${monthName} ${selectedYear}`);
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div>
      {/* === Filter Aksi (Baru) === */}
      <div className="my-4 p-4 border rounded-lg bg-gray-50 flex justify-between items-center">
        {/* Filter Status (Kiri) */}
        <div className="flex items-center gap-2">
          <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700">
            Tampilkan:
          </label>
          <select
            id="statusFilter"
            name="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-gray-900 border border-gray-300 rounded-md"
          >
            <option value="ALL">Semua Santri</option>
            <option value="HADIR">Yang Pernah Hadir</option>
            <option value="IZIN">Yang Pernah Izin</option>
            <option value="ALPA">Yang Pernah Alpa</option>
          </select>
        </div>
        
        {/* Tombol Ekspor (Kanan) */}
        <button
          onClick={handleExport}
          className="px-4 py-2 font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
        >
          Ekspor ke Excel
        </button>
      </div>

      {/* === Render Tabel (Menggunakan komponen baru) === */}
      <ReportTable filteredData={filteredData} daysArray={daysArray} />
    </div>
  );
}