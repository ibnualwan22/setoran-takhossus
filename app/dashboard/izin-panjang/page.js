import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import IzinPanjangClient from './IzinPanjangClient';
import { FiAlertCircle, FiInfo } from 'react-icons/fi';

const prisma = new PrismaClient();

// Fungsi helper untuk format tanggal YYYY-MM-DD (Wajib UTC)
function toYYYYMMDD(date) {
  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Ambil data untuk form dan tabel
async function getPageData() {
  const [santriList, izinList] = await Promise.all([
    prisma.santri.findMany({
      where: { is_active: true },
      orderBy: { nama: 'asc' },
      select: { id: true, nama: true }
    }),
    prisma.izinJangkaPanjang.findMany({
      orderBy: { tanggalMulai: 'desc' },
      include: {
        santri: { select: { nama: true } }
      }
    })
  ]);

  // Format tanggal agar aman dikirim ke client
  const formattedIzinList = izinList.map(izin => ({
    ...izin,
    tanggalMulai: toYYYYMMDD(izin.tanggalMulai),
    tanggalSelesai: toYYYYMMDD(izin.tanggalSelesai),
  }));

  return { santriList, formattedIzinList };
}

// Server Component
export default async function ManageIzinPanjangPage() {
  const session = await getServerSession(authOptions);

  // Proteksi halaman (hanya Admin & Staf)
  if (!['ADMIN', 'STAF'].includes(session.user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <FiAlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Akses Ditolak</h1>
          <p className="text-gray-700">
            Halaman ini hanya dapat diakses oleh Admin dan Staf.
          </p>
        </div>
      </div>
    );
  }

  const { santriList, formattedIzinList } = await getPageData();

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header Section - Responsive */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-lg flex items-center justify-center">
                <FiInfo className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                Manajemen Izin Jangka Panjang
              </h1>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                Catat santri yang izin sakit atau pulang selama beberapa hari. Sistem akan otomatis menandai mereka sebagai "Izin" di laporan harian.
              </p>
            </div>
          </div>

          {/* Info Cards - Stack di mobile, side by side di tablet+ */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-900">
                  Izin Aktif: {formattedIzinList.length}
                </span>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-900">
                  Total Santri: {santriList.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Client Component */}
        <IzinPanjangClient 
          santriList={santriList} 
          initialIzinList={formattedIzinList}
        />

        {/* Help Section - Collapsible di mobile */}
        <div className="mt-6 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-indigo-900 mb-3">
            💡 Tips Penggunaan
          </h3>
          <ul className="space-y-2 text-sm md:text-base text-indigo-800">
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-1">•</span>
              <span>Pastikan tanggal selesai lebih besar atau sama dengan tanggal mulai</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-1">•</span>
              <span>Santri yang sedang izin akan otomatis ditandai di laporan harian</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-1">•</span>
              <span>Anda dapat mengedit atau menghapus izin kapan saja</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-1">•</span>
              <span>Keterangan bersifat opsional namun disarankan untuk dokumentasi</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}