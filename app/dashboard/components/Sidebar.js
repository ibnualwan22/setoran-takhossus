import Link from 'next/link';
// Kita akan tambahkan ikon nanti agar lebih cantik
// Untuk sekarang, kita pakai teks dulu

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-800 text-white min-h-screen p-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-center">Setoran Takhossus</h2>
      </div>
      <nav>
        <ul className="space-y-2">
          {/* Nanti kita akan buat Link ini lebih dinamis */}
          <li>
            <Link
              href="/dashboard"
              className="block px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/input-setoran"
              className="block px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Input Setoran
            </Link>
          </li>
          
          <li className="pt-4 mt-4 border-t border-gray-700">
            <span className="px-4 text-xs font-semibold text-gray-400 uppercase">
              Admin Area
            </span>
          </li>
          <li>
            <Link
              href="/dashboard/manage-users"
              className="block px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Manajemen Pengguna
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/manage-santri"
              className="block px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Manajemen Santri
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/rekapitulasi-absen"
              className="block px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Rekapitulasi Absen
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/manage-kitab"
              className="block px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Manajemen Kitab
            </Link>
          </li>
          <li className="pt-4 mt-4 border-t border-gray-700">
            <span className="px-4 text-xs font-semibold text-gray-400 uppercase">
              Laporan
            </span>
          </li>
          <li>
            <Link
              href="/dashboard/rekap-harian"
              className="block px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Rekap Harian
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/laporan-penyimak"
              className="block px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Laporan Santri Per-Penyimak
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/riwayat-global"
              className="block px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Riwayat Absensi Global
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}