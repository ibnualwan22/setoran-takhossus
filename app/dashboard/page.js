import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import AdminDashboard from './AdminDashboard';
import PencatatDashboard from './PencatatDashboard';

export const revalidate = 0;
const prisma = new PrismaClient();

// === (Fungsi Helper Zona Waktu - Tidak Berubah) ===
function getWIBToday() {
  return new Date(); // Jauh lebih sederhana dan sekarang sudah akurat
}
function getWIBTodayRange(now) {
  const startOfDayWIB = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDayWIB = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  return { startOfDayWIB, endOfDayWIB };
}

// === FUNGSI INTI PENGAMBIL DATA (DIPERBARUI UNTUK LIBUR) ===
async function getDashboardData(penyimakId = null) {
  const now = getWIBToday();
  const dayOfWeek = now.getDay(); // 0=Minggu, ..., 4=Kamis, 5=Jumat
  const todayDateOnly = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())); // Tanggal UTC 00:00

  // 1. Cek Hari Libur & Ambil Keterangan
  let isHoliday = false;
  let keteranganLibur = '';
  if (dayOfWeek === 4) {
    isHoliday = true;
    keteranganLibur = 'Libur Rutin (Malam Jumat)';
  } else if (dayOfWeek === 5) {
    isHoliday = true;
    keteranganLibur = 'Libur Rutin (Malam Sabtu)';
  } else {
    // Cek libur manual
    const manualHoliday = await prisma.hariLibur.findUnique({
      where: { tanggal: todayDateOnly },
    });
    if (manualHoliday) {
      isHoliday = true;
      keteranganLibur = manualHoliday.keterangan || 'Libur Manual';
    }
  }

  // 2. Tentukan Rentang Waktu Hari Ini
  const { startOfDayWIB, endOfDayWIB } = getWIBTodayRange(now);

  // 3. Tentukan Filter Santri
  let santriWhereClause = { is_active: true };
  if (penyimakId) {
    santriWhereClause.penyimakId = penyimakId;
  }

  // 4. Ambil Data Santri (Semua jika libur & Pencatat, terfilter jika tidak)
  // Ambil semua santri jika libur dan ini dashboard PENCATAT
  const shouldFetchAllAssigned = isHoliday && !!penyimakId; 
  const santriList = await prisma.santri.findMany({
    where: santriWhereClause,
    orderBy: { nama: 'asc' },
  });

  // 5. Ambil Absensi Hari Ini (jika bukan libur ATAU jika libur tapi kita butuh yg hadir)
  let setoranWajibToday = [];
  let izinToday = [];
  // Hanya ambil data ini jika kita perlu menghitung Hadir/Izin/Alpa
  // Jika libur & dashboard Pencatat, kita tidak perlu ini, hanya daftar nama
  if (!shouldFetchAllAssigned) { 
      [setoranWajibToday, izinToday] = await Promise.all([
        prisma.setoran.findMany({
          where: {
            kategori: 'WAJIB',
            createdAt: { gte: startOfDayWIB, lt: endOfDayWIB },
            santri: santriWhereClause, 
          },
          select: { santriId: true },
        }),
        prisma.izin.findMany({
          where: {
            createdAt: { gte: startOfDayWIB, lt: endOfDayWIB },
            santri: santriWhereClause,
          },
          select: { santriId: true },
        }),
      ]);
  }

  // 6. Proses dan Kelompokkan (Hanya jika perlu)
  const setoranWajibIds = new Set(setoranWajibToday.map(s => s.santriId));
  const izinIds = new Set(izinToday.map(i => i.santriId));

  const hadirList = [];
  const izinList = [];
  const alpaList = [];
  const allAssignedList = santriList; // Untuk Pencatat saat libur

  // Jika hari libur & ini dashboard Pencatat, kita tidak perlu kelompokkan
  if (!shouldFetchAllAssigned) {
      for (const santri of santriList) {
        if (setoranWajibIds.has(santri.id)) {
          hadirList.push(santri);
        } else if (izinIds.has(santri.id)) {
          izinList.push(santri);
        } else {
          // Jika hari libur, jangan masukkan ke Alpa
          if (!isHoliday) { 
             alpaList.push(santri);
          }
        }
      }
  }

  return {
    isHoliday,
    keteranganLibur,
    date: now,
    // Jika libur & pencatat, alpaList kosong, tapi allAssignedList berisi semua
    alpaList: shouldFetchAllAssigned ? [] : alpaList, 
    allAssignedList: shouldFetchAllAssigned ? allAssignedList : [], 
    // Data lain tetap dihitung (misal untuk Admin)
    hadirList, 
    izinList,
  };
}

// === KOMPONEN UTAMA (SERVER COMPONENT) ===
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userRole = session.user.role;

  let data = {}; // Inisialisasi objek data
  let kitabList = []; // Inisialisasi kitabList
  
  if (userRole === 'ADMIN' || userRole === 'STAF') {
    Object.assign(data, await getDashboardData(null));
  
  } else if (userRole === 'PENCATAT') {
    const penyimak = await prisma.penyimak.findUnique({ where: { userId: session.user.id } });
    if (penyimak) {
      Object.assign(data, await getDashboardData(penyimak.id));
      kitabList = await prisma.kitab.findMany({ orderBy: { namaKitab: 'asc' }});
    } else {
      return <p>Error: Akun Anda belum terhubung ke data Penyimak.</p>;
    }
  } else {
      return <p>Peran tidak dikenal.</p> // Fallback jika peran aneh
  }
  
  // Format tanggal
  const formattedDate = data.date ? data.date.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta',
  }) : 'Tanggal tidak tersedia';
  
  // Render berdasarkan peran
  if (userRole === 'ADMIN' || userRole === 'STAF') {
    return (
      <AdminDashboard 
        hadirCount={data.hadirList?.length || 0}
        izinCount={data.izinList?.length || 0}
        alpaCount={data.alpaList?.length || 0}
        isHoliday={data.isHoliday || false}
        keteranganLibur={data.keteranganLibur || ''}
        formattedDate={formattedDate}
      />
    );
  }

  if (userRole === 'PENCATAT') {
    return (
      <PencatatDashboard 
        // Kirim 'allAssignedList' jika libur, 'alpaList' jika tidak
        santriToDisplay={data.isHoliday ? data.allAssignedList : data.alpaList} 
        isHoliday={data.isHoliday || false}
        keteranganLibur={data.keteranganLibur || ''}
        kitabList={kitabList}
        formattedDate={formattedDate}
      />
    );
  }

  return null; 
}