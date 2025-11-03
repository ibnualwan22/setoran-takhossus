import { PrismaClient } from '@prisma/client';
import AlpaReportButton from './AlpaReportButton';

const prisma = new PrismaClient();

// === FUNGSI HELPER ZONA WAKTU (DIPERBAIKI) ===
function getWIBToday() {
  // TZ=Asia/Jakarta di Vercel membuat new Date() sudah benar (WIB)
  return new Date(); 
}

function getWIBTodayRange(now) {
  // 'now' adalah objek Date WIB
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  // Buat string ISO eksplisit untuk jam 00:00:00 WIB
  const isoStringStart = `${year}-${month}-${day}T00:00:00.000+07:00`;
  const startOfDayWIB = new Date(isoStringStart);
  
  // Buat timestamp untuk hari berikutnya
  // Tambahkan 24 jam dalam milidetik
  const tomorrow = new Date(startOfDayWIB.getTime() + (24 * 60 * 60 * 1000));
  
  const yearTmr = tomorrow.getFullYear();
  const monthTmr = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const dayTmr = String(tomorrow.getDate()).padStart(2, '0');
  
  // Ini adalah jam 00:00:00 WIB besok
  const isoStringEnd = `${yearTmr}-${monthTmr}-${dayTmr}T00:00:00.000+07:00`;
  const endOfDayWIB = new Date(isoStringEnd); 

  return { startOfDayWIB, endOfDayWIB };
}

// === FUNGSI INTI PENGAMBIL DATA (DIPERBAIKI) ===
async function getDailyRecapData() {
  const now = getWIBToday(); // 'now' sudah WIB
  const dayOfWeek = now.getDay();
  
  // Tanggal UTC 00:00 untuk perbandingan dengan DB (HariLibur)
  // Ini mengambil TANGGAL dari 'now' (WIB) dan membuatnya jadi UTC 00:00
  const todayDateOnly = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  // 1. Cek Libur & Keterangan
  let isHoliday = false;
  let keteranganLibur = '';
  if (dayOfWeek === 4) { isHoliday = true; keteranganLibur = 'Libur Rutin (Malam Jumat)'; }
  else if (dayOfWeek === 5) { isHoliday = true; keteranganLibur = 'Libur Rutin (Malam Sabtu)'; }
  else {
    const manualHoliday = await prisma.hariLibur.findUnique({ where: { tanggal: todayDateOnly } });
    if (manualHoliday) { isHoliday = true; keteranganLibur = manualHoliday.keterangan || 'Libur Manual'; }
  }

  // 2. Tentukan Rentang Waktu (Sekarang sudah akurat 00:00 WIB)
  const { startOfDayWIB, endOfDayWIB } = getWIBTodayRange(now);

  // 3. Ambil Data (Santri Aktif & Setoran Wajib)
  const [allActiveSantri, setoranWajibToday] = await Promise.all([
    prisma.santri.findMany({ 
        where: { is_active: true }, 
        orderBy: { nama: 'asc' },
        include: { penyimak: true } 
    }),
    prisma.setoran.findMany({
      where: { kategori: 'WAJIB', createdAt: { gte: startOfDayWIB, lt: endOfDayWIB } },
      select: { santriId: true },
    }),
  ]);
  
  // 4. Ambil Izin (HANYA jika TIDAK libur)
  let izinToday = [];
  if (!isHoliday) {
      izinToday = await prisma.izin.findMany({
        where: { createdAt: { gte: startOfDayWIB, lt: endOfDayWIB } },
        select: { santriId: true },
      });
  }

  // 5. Proses dan Kelompokkan (Tidak berubah)
  const setoranWajibIds = new Set(setoranWajibToday.map(s => s.santriId));
  const izinIds = new Set(izinToday.map(i => i.santriId));
  const hadirList = [];
  const izinList = [];
  const alpaList = []; 

  for (const santri of allActiveSantri) {
    if (setoranWajibIds.has(santri.id)) {
      hadirList.push(santri);
    } else if (!isHoliday && izinIds.has(santri.id)) {
      izinList.push(santri);
    } else if (!isHoliday) {
      alpaList.push(santri);
    }
  }

  // 6. Kelompokkan Alpa (Tidak berubah)
  const alpaGroupedByPenyimak = alpaList.reduce((acc, santri) => {
    const penyimakName = santri.penyimak?.nama || 'Belum Ditentukan';
    if (!acc[penyimakName]) {
      acc[penyimakName] = [];
    }
    acc[penyimakName].push(santri.nama);
    return acc;
  }, {});

  return { 
      isHoliday, keteranganLibur, date: now, 
      hadirList, izinList, alpaList, 
      alpaGroupedByPenyimak
  };
}

// === KOMPONEN UTAMA (SERVER COMPONENT) - DIPERBARUI ===
export const revalidate = 0; // Memaksa halaman ini untuk selalu dinamis

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

      {/* Tombol Laporan WA */}
      {!data.isHoliday && data.alpaList.length > 0 && (
          <div className="mb-6 p-4 border rounded-lg bg-yellow-50">
             <AlpaReportButton groupedAlpa={data.alpaGroupedByPenyimak} />
          </div>
      )}

      {/* Grid Kolom */}
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