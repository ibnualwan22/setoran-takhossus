export default function Loading() {
  // Anda bisa membuat komponen skeleton yang cantik di sini
  // Tapi untuk sekarang, teks sederhana sudah cukup
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Manajemen Pengguna
      </h1>
      <div className="text-center p-8">
        <p className="text-lg text-gray-600">Memuat data pengguna...</p>
      </div>
    </div>
  );
}