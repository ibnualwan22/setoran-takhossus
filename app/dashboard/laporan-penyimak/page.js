import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';

const prisma = new PrismaClient();

// === FUNGSI HELPER ZONA WAKTU ===
function getWIBToday() {
  return new Date();
}

function getWIBWeekRange(now) {
  const currentDayOfWeek = now.getDay();
  const daysToMonday = (currentDayOfWeek === 0) ? 6 : (currentDayOfWeek - 1);
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 7, 0, 0, 0);
  return { startOfWeek, endOfWeek };
}

// === FUNGSI INTI PENGAMBIL DATA ===
async function getPenyimakReportData(penyimakId = null) {
  const now = getWIBToday();
  const { startOfWeek, endOfWeek } = getWIBWeekRange(now);

  const whereClause = penyimakId ? { id: penyimakId } : {};
  const allPenyimak = await prisma.penyimak.findMany({
    where: whereClause,
    orderBy: { nama: 'asc' },
    include: {
      santri: {
        where: { is_active: true },
        orderBy: { nama: 'asc' },
      },
    },
  });

  const [setoranWajib, izin] = await Promise.all([
    prisma.setoran.findMany({
      where: {
        kategori: 'WAJIB',
        createdAt: { gte: startOfWeek, lt: endOfWeek },
      },
      select: { santriId: true, createdAt: true },
    }),
    prisma.izin.findMany({
      where: {
        createdAt: { gte: startOfWeek, lt: endOfWeek },
      },
      select: { santriId: true, createdAt: true },
    }),
  ]);

  // Proses Map
  const setoranWajibMap = new Map();
  for (const setoran of setoranWajib) {
    const tgl = new Date(setoran.createdAt.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).getDate();
    if (!setoranWajibMap.has(setoran.santriId)) {
      setoranWajibMap.set(setoran.santriId, new Set());
    }
    setoranWajibMap.get(setoran.santriId).add(tgl);
  }
  
  const izinMap = new Map();
  for (const i of izin) {
    const tgl = new Date(i.createdAt.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).getDate();
    if (!izinMap.has(i.santriId)) {
      izinMap.set(i.santriId, new Set());
    }
    izinMap.get(i.santriId).add(tgl);
  }

  // Hitung H/I/A Mingguan
  const reportData = allPenyimak.map(penyimak => {
    const santriWithRecap = penyimak.santri.map(santri => {
      const santriSetoran = setoranWajibMap.get(santri.id) || new Set();
      const santriIzin = izinMap.get(santri.id) || new Set();
      let totalHadir = 0;
      let totalIzin = 0;
      let totalAlpa = 0;
      
      for (let i = 0; i < 7; i++) {
        const dateToCheck = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i);
        const dayOfWeek = dateToCheck.getDay();
        const tgl = dateToCheck.getDate();
        if (dayOfWeek === 4 || dayOfWeek === 5) continue;
        if (santriSetoran.has(tgl)) totalHadir++;
        else if (santriIzin.has(tgl)) totalIzin++;
        else totalAlpa++;
      }
      return { ...santri, recap: { H: totalHadir, I: totalIzin, A: totalAlpa } };
    });
    return { ...penyimak, santri: santriWithRecap };
  });

  return reportData;
}

// === KOMPONEN UTAMA (SERVER COMPONENT) ===
export default async function LaporanPenyimakPage() {
  const session = await getServerSession(authOptions);
  const userRole = session.user.role;

  // Tentukan data yang akan diambil berdasarkan peran
  let reportData;
  if (userRole === 'ADMIN' || userRole === 'STAF') {
    reportData = await getPenyimakReportData(null);
  } else {
    const penyimak = await prisma.penyimak.findUnique({
      where: { userId: session.user.id },
    });
    if (penyimak) {
      reportData = await getPenyimakReportData(penyimak.id);
    } else {
      reportData = [];
    }
  }
  
  const now = getWIBToday();
  const { startOfWeek, endOfWeek } = getWIBWeekRange(now);
  const weekRangeString = `${startOfWeek.toLocaleDateString('id-ID', {day: '2-digit', month: 'short'})} - ${new Date(endOfWeek.getTime() - 1).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}`;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          {userRole === 'PENCATAT' ? 'Santri Asuhan Anda' : 'Laporan Grup Asuhan'}
        </h1>
        <p className="text-sm sm:text-lg text-gray-700">
          Rekap Mingguan ({weekRangeString})
        </p>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {reportData.map(penyimak => (
          <div key={penyimak.id} className="border rounded-lg overflow-hidden">
            {(userRole === 'ADMIN' || userRole === 'STAF') ? (
              <details className="group">
                <summary className="px-4 py-3 bg-gray-50 hover:bg-gray-100 cursor-pointer flex justify-between items-center transition-colors">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-base sm:text-lg font-medium text-indigo-700 truncate">
                      {penyimak.nama}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">
                      ({penyimak.santri.length})
                    </span>
                  </div>
                  <svg 
                    className="w-5 h-5 text-gray-500 transition-transform group-open:rotate-180" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <SantriAsuhanTable santriList={penyimak.santri} />
              </details>
            ) : (
              <>
                <div className="px-4 py-3 bg-gray-50 border-b">
                  <span className="text-base sm:text-lg font-medium text-indigo-700">
                    {penyimak.nama}
                  </span>
                  <span className="ml-2 text-xs sm:text-sm text-gray-600">
                    ({penyimak.santri.length} Santri)
                  </span>
                </div>
                <SantriAsuhanTable santriList={penyimak.santri} />
              </>
            )}
          </div>
        ))}
        
        {reportData.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 italic">
              {userRole === 'PENCATAT' ? 'Anda belum memiliki santri asuhan.' : 'Tidak ada data penyimak.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// === KOMPONEN TABEL RESPONSIF ===
function SantriAsuhanTable({ santriList }) {
  if (santriList.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic text-center py-4 px-4">
        Tidak ada santri asuhan yang aktif.
      </p>
    );
  }

  return (
    <>
      {/* Desktop Table View (md and up) */}
      <div className="hidden md:block p-4 border-t overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nama Santri
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-green-600 uppercase tracking-wider">
                Hadir
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-yellow-600 uppercase tracking-wider">
                Izin
              </th>
              <th className="px-3 py-2 text-center text-xs font-medium text-red-600 uppercase tracking-wider">
                Alpa
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {santriList.map(santri => (
              <tr key={santri.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                  {santri.nama}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-sm font-semibold text-green-600">
                    {santri.recap.H}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-sm font-semibold text-yellow-600">
                    {santri.recap.I}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-sm font-semibold text-red-600">
                    {santri.recap.A}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm">
                  <Link 
                    href={`/dashboard/detail-santri/${santri.id}`}
                    className="text-indigo-600 hover:text-indigo-900 font-medium hover:underline"
                  >
                    Lihat Detail
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (below md) */}
      <div className="md:hidden p-4 space-y-3">
        {santriList.map((santri, index) => (
          <div 
            key={santri.id} 
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Nama Santri */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 text-base">
                {index + 1}. {santri.nama}
              </h3>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              {/* Hadir */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-1">
                  <span className="text-lg font-bold text-green-600">
                    {santri.recap.H}
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-600">Hadir</p>
              </div>

              {/* Izin */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 mb-1">
                  <span className="text-lg font-bold text-yellow-600">
                    {santri.recap.I}
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-600">Izin</p>
              </div>

              {/* Alpa */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-1">
                  <span className="text-lg font-bold text-red-600">
                    {santri.recap.A}
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-600">Alpa</p>
              </div>
            </div>

            {/* Action Button */}
            <Link 
              href={`/dashboard/detail-santri/${santri.id}`}
              className="block w-full text-center py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
            >
              Lihat Detail
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}