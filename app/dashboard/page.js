export default function DashboardPage() {
  return (
    // Konten ini akan dimasukkan ke dalam DashboardLayout
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Statistik Cepat
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-100 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">Santri Hadir</h3>
          <p className="text-3xl font-bold text-blue-900">0</p>
        </div>
        <div className="p-4 bg-yellow-100 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800">Santri Izin</h3>
          <p className="text-3xl font-bold text-yellow-900">0</p>
        </div>
        <div className="p-4 bg-red-100 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800">Santri Alpa</h3>
          {/* INI YANG DIPERBAIKI */}
          <p className="text-3xl font-bold text-red-900">0</p> 
        </div>
      </div>
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold text-gray-800">Catatan</h2>
        <p className="text-gray-700 mt-2">
          Selamat datang di Panel Admin. Silakan gunakan menu di sebelah kiri
          untuk mengelola data.
        </p>
      </div>
    </div>
  );
}