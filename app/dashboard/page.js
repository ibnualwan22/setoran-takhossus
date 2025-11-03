import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import AdminDashboard from './AdminDashboard';
import PencatatDashboard from './PencatatDashboard';

export const revalidate = 0; 
const prisma = new PrismaClient();

// === FUNGSI HELPER ZONA WAKTU (DIPERBAIKI) ===
function getWIBToday() {
  return new Date(); // TZ=Asia/Jakarta di Vercel
}

function getWIBTodayRange(now) {
  // 'now' adalah Date object (WIB)
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`; 

  // === Menggunakan Logika dari wibUtils.js (Terbukti Bekerja) ===
  const isoStringStart = `${dateString}T00:00:00.000+07:00`;
  const startOfDayWIB = new Date(isoStringStart);
  
  const isoStringEnd = `${dateString}T23:59:59.999+07:00`;
  const endOfDayWIB = new Date(isoStringEnd);
  
  return { startOfDayWIB, endOfDayWIB };
}

// === FUNGSI INTI PENGAMBIL DATA (DIPERBAIKI) ===
async function getDashboardData(penyimakId = null) {
  const now = getWIBToday();
  const dayOfWeek = now.getDay();
  const todayDateOnly = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  // 1. Cek Libur & Keterangan (Tidak berubah)
  let isHoliday = false;
  let keteranganLibur = '';
  // ... (logika cek libur kamis/jumat/manual) ...
  if (dayOfWeek === 4) { isHoliday = true; keteranganLibur = 'Libur Rutin (Malam Jumat)'; }
  else if (dayOfWeek === 5) { isHoliday = true; keteranganLibur = 'Libur Rutin (Malam Sabtu)'; }
  else {
    const manualHoliday = await prisma.hariLibur.findUnique({ where: { tanggal: todayDateOnly } });
    if (manualHoliday) { isHoliday = true; keteranganLibur = manualHoliday.keterangan || 'Libur Manual'; }
  }


  // 2. Tentukan Rentang Waktu (Sekarang sudah akurat)
  const { startOfDayWIB, endOfDayWIB } = getWIBTodayRange(now);

  // 3. Tentukan Filter Santri (Tidak berubah)
  let santriWhereClause = { is_active: true };
  if (penyimakId) {
    santriWhereClause.penyimakId = penyimakId;
  }

  // 4. Ambil Data Santri (Tidak berubah)
  const shouldFetchAllAssigned = isHoliday && !!penyimakId; 
  const santriList = await prisma.santri.findMany({
    where: santriWhereClause,
    orderBy: { nama: 'asc' },
  });

  // 5. Ambil Absensi Hari Ini
  let setoranWajibToday = [];
  let izinToday = [];
  
  if (!shouldFetchAllAssigned) { 
      [setoranWajibToday, izinToday] = await Promise.all([
        prisma.setoran.findMany({
          where: {
            kategori: 'WAJIB',
            // === PERBAIKI QUERY: gte dan lte (<=) ===
            createdAt: { gte: startOfDayWIB, lte: endOfDayWIB }, 
            santri: santriWhereClause, 
          },
          select: { santriId: true },
        }),
        prisma.izin.findMany({
          where: {
            // === PERBAIKI QUERY: gte dan lte (<=) ===
            createdAt: { gte: startOfDayWIB, lte: endOfDayWIB },
            santri: santriWhereClause,
          },
          select: { santriId: true },
        }),
      ]);
  }

  // 6. Proses dan Kelompokkan (Tidak berubah)
  // ... (logika pengelompokan hadirList, izinList, alpaList) ...
  const setoranWajibIds = new Set(setoranWajibToday.map(s => s.santriId));
  const izinIds = new Set(izinToday.map(i => i.santriId));
  const hadirList = [];
  const izinList = [];
  const alpaList = [];
  const allAssignedList = santriList; 
  if (!shouldFetchAllAssigned) {
      for (const santri of santriList) {
        if (setoranWajibIds.has(santri.id)) {
          hadirList.push(santri);
        } else if (izinIds.has(santri.id)) {
          izinList.push(santri);
        } else {
          if (!isHoliday) { 
             alpaList.push(santri);
          }
        }
      }
  }

  return {
    isHoliday, keteranganLibur, date: now,
    alpaList: shouldFetchAllAssigned ? [] : alpaList, 
    allAssignedList: shouldFetchAllAssigned ? allAssignedList : [], 
    hadirList, izinList,
  };
}

// === KOMPONEN UTAMA (SERVER COMPONENT) - (Tidak Berubah) ===
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  // ... (logika render berdasarkan peran tidak berubah) ...
  const userRole = session.user.role;
  let data = {}; 
  let kitabList = []; 
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
      return <p>Peran tidak dikenal.</p>;
  }
  const formattedDate = data.date ? data.date.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta',
  }) : 'Tanggal tidak tersedia';
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