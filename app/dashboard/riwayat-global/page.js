import { PrismaClient } from '@prisma/client';
import MonthFilter from './MonthFilter';
import ReportClientWrapper from './ReportClientWrapper'; 

const prisma = new PrismaClient();

// === (Fungsi Helper Zona Waktu - Tidak Berubah) ===
function getWIBDate(year, month, day = 1) {
  const isoString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000+07:00`;
  return new Date(isoString);
}
function getMonthDetails(month, year) {
  const y = parseInt(year);
  const m = parseInt(month);
  const startDate = getWIBDate(y, m, 1);
  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? y + 1 : y;
  const endDate = getWIBDate(nextYear, nextMonth, 1); 
  const daysInMonth = new Date(y, m, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  return { startDate, endDate, daysArray, daysInMonth, y, m };
}

// === FUNGSI INTI PENGAMBIL DATA (BACKEND) - DIPERBARUI ===
async function getGlobalRecapData(month, year) {
  const { startDate, endDate, daysArray, daysInMonth, y, m } = getMonthDetails(month, year);

  // Info Hari Ini (Tidak berubah)
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const todayDate = now.getDate();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const isCurrentMonthView = (parseInt(month) === currentMonth && parseInt(year) === currentYear);

  // 1. Ambil semua data relevan
  const [allActiveSantri, setoranWajib, izinHarian, hariLiburManual, izinPanjang] = await Promise.all([
    prisma.santri.findMany({ where: { is_active: true }, orderBy: { nama: 'asc' } }),
    prisma.setoran.findMany({ where: { kategori: 'WAJIB', createdAt: { gte: startDate, lt: endDate } }, select: { santriId: true, createdAt: true } }),
    prisma.izin.findMany({ where: { createdAt: { gte: startDate, lt: endDate } }, select: { santriId: true, createdAt: true } }),
    prisma.hariLibur.findMany({ where: { tanggal: { gte: startDate, lt: endDate } }, select: { tanggal: true } }),
    // === TAMBAHKAN INI ===
    // Ambil semua izin panjang yang bersinggungan dengan bulan ini
    prisma.izinJangkaPanjang.findMany({
        where: {
            tanggalMulai: { lt: endDate }, // Mulai sebelum akhir bulan
            tanggalSelesai: { gte: startDate }, // Selesai setelah awal bulan
        },
        select: { santriId: true, tanggalMulai: true, tanggalSelesai: true }
    })
  ]);

  // 2. Proses Maps (Tidak Berubah)
  const setoranWajibMap = new Map();
  for (const setoran of setoranWajib) {
    const tgl = new Date(new Date(setoran.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).getDate();
    if (!setoranWajibMap.has(setoran.santriId)) setoranWajibMap.set(setoran.santriId, new Set());
    setoranWajibMap.get(setoran.santriId).add(tgl);
  }
  const izinMap = new Map();
  for (const i of izinHarian) {
    const tgl = new Date(new Date(i.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).getDate();
    if (!izinMap.has(i.santriId)) izinMap.set(i.santriId, new Set());
    izinMap.get(i.santriId).add(tgl);
  }
  const liburSet = new Set(hariLiburManual.map(l => l.tanggal.getUTCDate()));

  // 3. Bangun data rekap (LOGIKA DIPERBARUI)
  const izinPanjangMap = new Map();
  for (const izin of izinPanjang) {
      if (!izinPanjangMap.has(izin.santriId)) {
          izinPanjangMap.set(izin.santriId, []);
      }
      // Simpan rentang tanggalnya (sebagai timestamp UTC)
      izinPanjangMap.get(izin.santriId).push({
          start: izin.tanggalMulai.getTime(), // Waktu (UTC)
          end: izin.tanggalSelesai.getTime(), // Waktu (UTC)
      });
  }

  // 3. Bangun data rekap (LOGIKA DIPERBARUI)
  const rekapData = [];
  for (const santri of allActiveSantri) {
    const santriRow = { id: santri.id, nama: santri.nama, dates: {}, totalHadir: 0, totalIzin: 0, totalAlpa: 0 };
    const santriSetoran = setoranWajibMap.get(santri.id) || new Set();
    const santriIzin = izinMap.get(santri.id) || new Set();
    const santriIzinPanjang = izinPanjangMap.get(santri.id) || []; // Ambil array rentang

    for (const day of daysArray) {
      const currentDateUTC = new Date(Date.UTC(y, m - 1, day)); // Tanggal 00:00 UTC
      const currentTimestamp = currentDateUTC.getTime(); // Timestamp
      const dayOfWeek = currentDateUTC.getUTCDay();
      const isHoliday = (dayOfWeek === 4 || dayOfWeek === 5 || liburSet.has(day));

      // Cek apakah hari ini ada di dalam salah satu rentang izin panjang
      const isIzinPanjang = santriIzinPanjang.some(
          range => currentTimestamp >= range.start && currentTimestamp <= range.end
      );

      // === LOGIKA BARU ===
      if (isCurrentMonthView && day > todayDate) {
        santriRow.dates[day] = 'EMPTY';
      } else if (santriSetoran.has(day)) {
        santriRow.dates[day] = 'HADIR';
        santriRow.totalHadir++;
      } else if (isHoliday) {
        santriRow.dates[day] = 'LIBUR';
      } 
      // === CEK IZIN PANJANG ===
      else if (isIzinPanjang) {
          santriRow.dates[day] = 'IZIN';
          santriRow.totalIzin++;
      }
      // ========================
      else if (santriIzin.has(day)) {
        santriRow.dates[day] = 'IZIN';
        santriRow.totalIzin++;
      } else {
        santriRow.dates[day] = 'ALPA';
        santriRow.totalAlpa++;
      }
    }
    rekapData.push(santriRow);
  }

  return { rekapData, daysArray };
}

// === (Helper `getCurrentWIBDateParts` - Tidak Berubah) ===
function getCurrentWIBDateParts() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}


// === KOMPONEN UTAMA (SERVER COMPONENT) - Tidak Berubah ===
export default async function RiwayatGlobalPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const { month: currentMonth, year: currentYear } = getCurrentWIBDateParts();
  const selectedMonth = resolvedSearchParams.month || currentMonth;
  const selectedYear = resolvedSearchParams.year || currentYear;
  const { rekapData, daysArray } = await getGlobalRecapData(selectedMonth, selectedYear);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Riwayat Absensi Global</h1>
      <MonthFilter />
      <ReportClientWrapper 
        rekapData={rekapData} 
        daysArray={daysArray}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />
    </div>
  );
}
