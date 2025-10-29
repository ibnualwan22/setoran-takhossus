// Ini adalah Server Component (default)
// Tugasnya hanya menampilkan data yang sudah diolah
export default function AdminDashboard({ hadirCount, izinCount, alpaCount, formattedDate }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Statistik Cepat (Global)
      </h1>
      <p className="text-lg text-gray-700 mb-6">{formattedDate}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-green-100 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800">Hadir (Wajib)</h3>
          <p className="text-3xl font-bold text-green-900">{hadirCount}</p>
        </div>
        <div className="p-4 bg-yellow-100 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800">Izin</h3>
          <p className="text-3xl font-bold text-yellow-900">{izinCount}</p>
        </div>
        <div className="p-4 bg-red-100 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800">Alpa</h3>
          <p className="text-3xl font-bold text-red-900">{alpaCount}</p>
        </div>
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold text-gray-800">Catatan</h2>
        <p className="text-gray-700 mt-2">
          Statistik ini menampilkan rekap absensi **wajib** untuk **semua santri aktif** hari ini.
        </p>
      </div>
    </div>
  );
}