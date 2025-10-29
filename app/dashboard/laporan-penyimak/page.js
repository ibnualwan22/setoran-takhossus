import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Link from 'next/link';

const prisma = new PrismaClient();

// === (Fungsi Helper Zona Waktu - Tidak Berubah) ===
function getWIBToday() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
}
function getWIBWeekRange(now) {
  const currentDayOfWeek = now.getDay();
  const daysToMonday = (currentDayOfWeek === 0) ? 6 : (currentDayOfWeek - 1);
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 7, 0, 0, 0);
  return { startOfWeek, endOfWeek };
}

// === FUNGSI INTI PENGAMBIL DATA (DIPERBARUI) ===
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

  // Proses Map (Tidak Berubah)
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

  // Hitung H/I/A Mingguan (Tidak Berubah)
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

// === KOMPONEN UTAMA (SERVER COMPONENT) - DIPERBARUI ===
export default async function LaporanPenyimakPage() {
  const session = await getServerSession(authOptions);
  const userRole = session.user.role;

  // === PERBAIKAN: Hapus blok proteksi di sini ===
  // if (!['ADMIN', 'STAF'].includes(session.user.role)) {
  //   return (...Akses Ditolak...);
  // }
  // ===========================================

  // Tentukan data apa yang akan diambil berdasarkan peran
  let reportData;
  if (userRole === 'ADMIN' || userRole === 'STAF') {
    reportData = await getPenyimakReportData(null);
  } else { // Otomatis ini PENCATAT
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
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        {userRole === 'PENCATAT' ? 'Santri Asuhan Anda' : 'Laporan Grup Asuhan'}
      </h1>
      <p className="text-lg text-gray-700 mb-6">Rekap Mingguan ({weekRangeString})</p>

      <div className="space-y-4">
        {reportData.map(penyimak => (
          <div key={penyimak.id} className="border rounded-lg overflow-hidden">
            {(userRole === 'ADMIN' || userRole === 'STAF') ? (
              <details>
                <summary className="px-4 py-3 bg-gray-50 hover:bg-gray-100 cursor-pointer flex justify-between items-center">
                  <span className="text-lg font-medium text-indigo-700">{penyimak.nama}</span>
                  <span className="text-sm font-medium text-gray-600">({penyimak.santri.length} Santri)</span>
                </summary>
                <SantriAsuhanTable santriList={penyimak.santri} />
              </details>
            ) : (
              <SantriAsuhanTable santriList={penyimak.santri} />
            )}
          </div>
        ))}
        {reportData.length === 0 && (
           <p className="text-sm text-gray-500 italic text-center py-4">
              {userRole === 'PENCATAT' ? 'Anda belum memiliki santri asuhan.' : 'Tidak ada data penyimak.'}
            </p>
        )}
      </div>
    </div>
  );
}

// === KOMPONEN BANTUAN TAMPILAN (UNTUK TABEL) - Tidak Berubah ===
function SantriAsuhanTable({ santriList }) {
  if (santriList.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic text-center py-4 px-4">
        Tidak ada santri asuhan yang aktif.
      </p>
    );
  }

  return (
    <div className="p-4 border-t">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nama Santri</th>
            <th className="px-3 py-2 text-center text-xs font-medium text-green-600 uppercase">H</th>
            <th className="px-3 py-2 text-center text-xs font-medium text-yellow-600 uppercase">I</th>
            <th className="px-3 py-2 text-center text-xs font-medium text-red-600 uppercase">A</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {santriList.map(santri => (
            <tr key={santri.id}>
              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{santri.nama}</td>
              <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold text-green-600 text-center">{santri.recap.H}</td>
              <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold text-yellow-600 text-center">{santri.recap.I}</td>
              <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold text-red-600 text-center">{santri.recap.A}</td>
              <td className="px-3 py-2 whitespace-nowrap text-sm">
                <Link href={`/dashboard/detail-santri/${santri.id}`}
                  className="text-indigo-600 hover:text-indigo-900 font-medium"
                >
                  Lihat Detail
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}