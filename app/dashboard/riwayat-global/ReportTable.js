'use client';

// Komponen helper untuk render sel status (DIPERBARUI)
function renderStatusCell(status) {
  switch (status) {
    case 'HADIR':
      return <span title="Hadir">✅</span>;
    case 'IZIN':
      return <span title="Izin" className="font-bold text-yellow-600">I</span>;
    case 'ALPA':
      return <span title="Alpa" className="text-red-500">❌</span>;
    case 'LIBUR':
      // === PERUBAHAN TAMPILAN ===
      return <span title="Libur" className="font-bold text-gray-400">L</span>; 
    default:
      return <span className="text-gray-300">?</span>;
  }
}

// Komponen ini hanya bertugas me-render tabel dari data yang sudah difilter
export default function ReportTable({ filteredData, daysArray }) {
  // ... (sisa kode ReportTable.js tidak berubah) ...
    return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-40">Nama Santri</th>
            {daysArray.map(day => (
              <th key={day} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase w-10">
                {day}
              </th>
            ))}
            <th className="px-2 py-2 text-center text-xs font-medium text-green-600 uppercase">H</th>
            <th className="px-2 py-2 text-center text-xs font-medium text-yellow-600 uppercase">I</th>
            <th className="px-2 py-2 text-center text-xs font-medium text-red-600 uppercase">A</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredData.map((santri, index) => (
            <tr key={santri.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
              <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{santri.nama}</td>
              {daysArray.map(day => (
                <td key={day} className="px-2 py-2 whitespace-nowrap text-sm text-center">
                  {renderStatusCell(santri.dates[day])}
                </td>
              ))}
              <td className="px-2 py-2 whitespace-nowrap text-sm font-semibold text-green-600 text-center">{santri.totalHadir}</td>
              <td className="px-2 py-2 whitespace-nowrap text-sm font-semibold text-yellow-600 text-center">{santri.totalIzin}</td>
              <td className="px-2 py-2 whitespace-nowrap text-sm font-semibold text-red-600 text-center">{santri.totalAlpa}</td>
            </tr>
          ))}
          {filteredData.length === 0 && (
            <tr>
              <td colSpan={daysArray.length + 5} className="text-center py-4 text-gray-500">
                Tidak ada data yang cocok dengan filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}