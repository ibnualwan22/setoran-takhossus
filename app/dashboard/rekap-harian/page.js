import { PrismaClient } from '@prisma/client';
import AlpaReportButton from './AlpaReportButton';

export const revalidate = 0; // Tetap paksa dinamis
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
  const dateString = `${year}-${month}-${day}`; // cth: "2025-11-03"

  // === Menggunakan Logika dari wibUtils.js (Terbukti Bekerja) ===
  // Jam 00:00:00 WIB
  const isoStringStart = `${dateString}T00:00:00.000+07:00`;
  const startOfDayWIB = new Date(isoStringStart);
  
  // Jam 23:59:59 WIB
  const isoStringEnd = `${dateString}T23:59:59.999+07:00`;
  const endOfDayWIB = new Date(isoStringEnd);
  
  // Kita ubah query menjadi gte (>=) dan lte (<=)
  return { startOfDayWIB, endOfDayWIB };
}

// === FUNGSI INTI PENGAMBIL DATA (DIPERBARUI) ===
async function getDailyRecapData() {
  const now = getWIBToday();
  const dayOfWeek = now.getDay();
  // Tanggal UTC 00:00 untuk perbandingan DB
  const todayDateOnly = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  // 1. Cek Libur & Keterangan (Tidak berubah)
  let isHoliday = false;
  let keteranganLibur = '';
  if (dayOfWeek === 4) { isHoliday = true; keteranganLibur = 'Libur Rutin (Malam Jumat)'; }
  else if (dayOfWeek === 5) { isHoliday = true; keteranganLibur = 'Libur Rutin (Malam Sabtu)'; }
  else {
    const manualHoliday = await prisma.hariLibur.findUnique({ where: { tanggal: todayDateOnly } });
    if (manualHoliday) { isHoliday = true; keteranganLibur = manualHoliday.keterangan || 'Libur Manual'; }
  }


  // 2. Tentukan Rentang Waktu (Sekarang sudah akurat 00:00 - 23:59 WIB)
  const { startOfDayWIB, endOfDayWIB } = getWIBTodayRange(now);

  // 3. Ambil Data (Santri Aktif & Setoran Wajib)
  const [allActiveSantri, setoranWajibToday, izinHarianToday, izinPanjangToday] = await Promise.all([
    prisma.santri.findMany({ 
        where: { is_active: true }, 
        orderBy: { nama: 'asc' },
        include: { penyimak: true } 
    }),
    prisma.setoran.findMany({
      where: { kategori: 'WAJIB', createdAt: { gte: startOfDayWIB, lte: endOfDayWIB } }, 
      select: { santriId: true },
    }),
    // Ambil Izin Harian (HANYA jika TIDAK libur)
    isHoliday ? Promise.resolve([]) : prisma.izin.findMany({
      where: { createdAt: { gte: startOfDayWIB, lte: endOfDayWIB } },
      select: { santriId: true },
    }),
    // === TAMBAHKAN INI ===
    // Ambil Izin Jangka Panjang yang aktif HARI INI
    // (todayDateOnly harus di antara tanggalMulai dan tanggalSelesai)
    prisma.izinJangkaPanjang.findMany({
        where: {
            tanggalMulai: { lte: todayDateOnly },
            tanggalSelesai: { gte: todayDateOnly },
        },
        select: { santriId: true }
    })
  ]);

  // 5. Proses dan Kelompokkan (Tidak berubah)
  // ... (logika pengelompokan hadirList, izinList, alpaList) ...
  const setoranWajibIds = new Set(setoranWajibToday.map(s => s.santriId));
  const izinHarianIds = new Set(izinHarianToday.map(i => i.santriId));
  const izinPanjangIds = new Set(izinPanjangToday.map(i => i.santriId)); // <-- BARU

  const hadirList = [];
  const izinList = [];
  const alpaList = []; 

  for (const santri of allActiveSantri) {
    if (setoranWajibIds.has(santri.id)) {
      hadirList.push(santri);
    } 
    // === LOGIKA DIPERBARUI ===
    // Cek izin jangka panjang DULU
    else if (izinPanjangIds.has(santri.id)) {
        izinList.push(santri);
    }
    // Baru cek izin harian
    else if (!isHoliday && izinHarianIds.has(santri.id)) {
      izinList.push(santri);
    } 
    // Baru cek alpa
    else if (!isHoliday) {
      alpaList.push(santri);
    }
    // Jika isHoliday dan tidak setor/izin panjang, dia tidak masuk mana-mana
  }

  // 5. Kelompokkan Alpa (Tidak berubah)
  const alpaGroupedByPenyimak = alpaList.reduce((acc, santri) => { /* ... */ });

  return { 
      isHoliday, keteranganLibur, date: now, 
      hadirList, izinList, alpaList, 
      alpaGroupedByPenyimak
  };
}

// === KOMPONEN UTAMA (SERVER COMPONENT) - DIPERBARUI ===

export default async function RekapHarianPage() {
  const data = await getDailyRecapData();

  const formattedDate = data.date.toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long',
      year: 'numeric', timeZone: 'Asia/Jakarta'
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
       <h1 className="text-2xl font-bold text-gray-900 mb-2">Rekap Absensi Hari Ini</h1>
      <p className="text-lg text-gray-700 mb-6">{formattedDate}</p>
      
      {data.isHoliday && (
        <div className="p-4 rounded-lg mb-6 bg-blue-100 border border-blue-300">
           <h2 className="text-xl font-bold text-blue-800"> Hari Ini Libur: {data.keteranganLibur}</h2>
           <p className="text-blue-700 mt-1">Hanya santri yang tetap setoran wajib yang ditampilkan di bawah.</p>
        </div>
      )}
      {!data.isHoliday && data.alpaList.length > 0 && (
          <div className="mb-6 p-4 border rounded-lg bg-yellow-50">
             <AlpaReportButton groupedAlpa={data.alpaGroupedByPenyimak} />
          </div>
      )}
      <div className={`grid grid-cols-1 ${data.isHoliday ? 'md:grid-cols-1' : 'md:grid-cols-3'} gap-6`}>
         <SantriListCard
          title={data.isHoliday ? "Santri yang Tetap Setor (Wajib)" : "Sudah Setor (Wajib)"}
          count={data.hadirList.length} list={data.hadirList} color="green"
        />
        {!data.isHoliday && (
          <>
            <SantriListCard title="Izin" count={data.izinList.length} list={data.izinList} color="yellow" />
            <SantriListCard title="Alpa (Belum Setor)" count={data.alpaList.length} list={data.alpaList} color="red" />
          </>
        )}
      </div>
    </div>
  );
}

// === (Komponen SantriListCard - Tidak Berubah) ===
function SantriListCard({ title, count, list, color }) {
  const colors = {
    green: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    red: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  };
  const theme = colors[color] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };

  return (
    <div className={`rounded-lg border ${theme.border} ${theme.bg}`}>
      <div className="p-4 border-b">
        <h2 className={`text-xl font-bold ${theme.text}`}>
          {title} ({count})
        </h2>
      </div>
      <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
        {list.length > 0 ? (
          list.map((santri, index) => (
            <p key={santri.id} className="text-sm text-gray-800">
              {index + 1}. {santri.nama}
            </p>
          ))
        ) : (
          <p className="text-sm text-gray-500 italic">Tidak ada santri.</p>
        )}
      </div>
    </div>
  );
}