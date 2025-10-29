import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import AdminDashboard from './AdminDashboard'; // Komponen Admin
import PencatatDashboard from './PencatatDashboard'; // Komponen Pencatat

const prisma = new PrismaClient();

// === FUNGSI HELPER ZONA WAKTU (WIB) ===
// (Kita copy dari 'rekap-harian' untuk dipakai di sini)
function getWIBToday() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
}

function getWIBTodayRange(now) {
  const startOfDayWIB = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDayWIB = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  return { startOfDayWIB, endOfDayWIB };
}

// === FUNGSI INTI PENGAMBIL DATA ===
// Kita buat fungsi ini fleksibel:
// - Jika tidak ada 'penyimakId', ambil SEMUA santri.
// - Jika ada 'penyimakId', ambil santri asuhan SAJA.
async function getDailyRecapData(penyimakId = null) {
  const now = getWIBToday();
  const dayOfWeek = now.getDay();

  // 1. Cek Hari Libur (Kamis/Jumat)
  if (dayOfWeek === 4 || dayOfWeek === 5) {
    return {
      isHoliday: true,
      date: now,
    };
  }

  // 2. Tentukan Rentang Waktu Hari Ini
  const { startOfDayWIB, endOfDayWIB } = getWIBTodayRange(now);

  // 3. Tentukan Filter Santri (dinamis)
  let santriWhereClause = { is_active: true };
  if (penyimakId) {
    santriWhereClause.penyimakId = penyimakId;
  }

  // 4. Ambil Semua Data yang Relevan (paralel)
  const [santriList, setoranWajibToday, izinToday] = await Promise.all([
    // Ambil santri (global atau spesifik)
    prisma.santri.findMany({
      where: santriWhereClause,
      orderBy: { nama: 'asc' },
    }),
    // Ambil setoran WAJIB (global atau spesifik)
    prisma.setoran.findMany({
      where: {
        kategori: 'WAJIB',
        createdAt: { gte: startOfDayWIB, lt: endOfDayWIB },
        // Filter setoran berdasarkan santri yang kita cari
        santri: santriWhereClause, 
      },
      select: { santriId: true },
    }),
    // Ambil izin (global atau spesifik)
    prisma.izin.findMany({
      where: {
        createdAt: { gte: startOfDayWIB, lt: endOfDayWIB },
        santri: santriWhereClause,
      },
      select: { santriId: true },
    }),
  ]);

  // 5. Proses dan Kelompokkan Data
  const setoranWajibIds = new Set(setoranWajibToday.map(s => s.santriId));
  const izinIds = new Set(izinToday.map(i => i.santriId));

  const hadirList = [];
  const izinList = [];
  const alpaList = [];

  for (const santri of santriList) {
    if (setoranWajibIds.has(santri.id)) {
      hadirList.push(santri);
    } else if (izinIds.has(santri.id)) {
      izinList.push(santri);
    } else {
      alpaList.push(santri);
    }
  }

  return {
    isHoliday: false,
    date: now,
    hadirList,
    izinList,
    alpaList,
  };
}

// === KOMPONEN UTAMA (SERVER COMPONENT) ===
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userRole = session.user.role;

  const data = {};
  
  if (userRole === 'ADMIN' || userRole === 'STAF') {
    // ADMIN/STAF: Ambil data rekap global
    Object.assign(data, await getDailyRecapData(null));
  
  } else if (userRole === 'PENCATAT') {
    // PENCATAT: Ambil data rekap spesifik
    const penyimak = await prisma.penyimak.findUnique({
      where: { userId: session.user.id },
    });
    
    if (penyimak) {
      Object.assign(data, await getDailyRecapData(penyimak.id));
      // Kita juga butuh daftar kitab untuk modal
      data.kitabList = await prisma.kitab.findMany({ orderBy: { namaKitab: 'asc' }});
    } else {
      // Kasus jika user pencatat tapi datanya belum ada di tabel Penyimak
      return <p>Error: Akun Anda belum terhubung ke data Penyimak.</p>;
    }
  }
  
  // Format tanggal untuk ditampilkan
  const formattedDate = data.date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
  
  // Tampilkan pesan libur jika hari libur
  if (data.isHoliday) {
    return (
       <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-lg text-gray-700 mb-6">{formattedDate}</p>
        <div className="p-8 text-center bg-blue-50 rounded-lg">
          <h2 className="text-3xl font-bold text-blue-800">🎉 Libur Setoran 🎉</h2>
          <p className="text-lg text-blue-700 mt-2">
            Hari ini adalah hari libur (Kamis/Jumat). Tidak ada rekap absensi.
          </p>
        </div>
      </div>
    )
  }

  // Render berdasarkan peran
  if (userRole === 'ADMIN' || userRole === 'STAF') {
    return (
      <AdminDashboard 
        hadirCount={data.hadirList.length}
        izinCount={data.izinList.length}
        alpaCount={data.alpaList.length}
        formattedDate={formattedDate}
      />
    );
  }

  if (userRole === 'PENCATAT') {
    return (
      <PencatatDashboard 
        alpaList={data.alpaList}
        kitabList={data.kitabList || []}
        formattedDate={formattedDate}
      />
    );
  }

  return null; // Fallback
}