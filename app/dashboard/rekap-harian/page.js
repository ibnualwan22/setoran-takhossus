import { PrismaClient } from '@prisma/client';
import AlpaReportButton from './AlpaReportButton'; // Komponen baru

const prisma = new PrismaClient();

// === FUNGSI HELPER ZONA WAKTU (WIB) ===
function getWIBToday() {
  return new Date(); // Jauh lebih sederhana dan sekarang sudah akurat
}

function getWIBTodayRange(now) {
  const startOfDayWIB = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDayWIB = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  return { startOfDayWIB, endOfDayWIB };
}

// === FUNGSI INTI PENGAMBIL DATA (DIPERBARUI UNTUK LIBUR) ===
async function getDailyRecapData() {
  const now = getWIBToday();
  const dayOfWeek = now.getDay();
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

  const { startOfDayWIB, endOfDayWIB } = getWIBTodayRange(now);

  // 3. Ambil Data (Santri Aktif & Setoran Wajib)
  // PERBARUI: Pastikan include penyimak di sini
  const [allActiveSantri, setoranWajibToday] = await Promise.all([
    prisma.santri.findMany({ 
        where: { is_active: true }, 
        orderBy: { nama: 'asc' },
        include: { penyimak: true } // <<< PENTING: Include penyimak
    }),
    prisma.setoran.findMany({
      where: { kategori: 'WAJIB', createdAt: { gte: startOfDayWIB, lt: endOfDayWIB } },
      select: { santriId: true },
    }),
  ]);
  
  // 4. Ambil Izin (Hanya jika TIDAK libur)
  let izinToday = [];
  if (!isHoliday) {
      izinToday = await prisma.izin.findMany({
        where: { createdAt: { gte: startOfDayWIB, lt: endOfDayWIB } },
        select: { santriId: true },
      });
  }

  // 5. Proses dan Kelompokkan
  const setoranWajibIds = new Set(setoranWajibToday.map(s => s.santriId));
  const izinIds = new Set(izinToday.map(i => i.santriId));
  const hadirList = [];
  const izinList = [];
  const alpaList = []; // Akan berisi objek santri lengkap dgn penyimak

  for (const santri of allActiveSantri) {
    if (setoranWajibIds.has(santri.id)) {
      hadirList.push(santri);
    } else if (!isHoliday && izinIds.has(santri.id)) {
      izinList.push(santri);
    } else if (!isHoliday) {
      alpaList.push(santri); // Masukkan objek santri lengkap
    }
  }

  // 6. Kelompokkan Alpa berdasarkan Penyimak
  const alpaGroupedByPenyimak = alpaList.reduce((acc, santri) => {
    const penyimakName = santri.penyimak?.nama || 'Belum Ditentukan';
    if (!acc[penyimakName]) {
      acc[penyimakName] = [];
    }
    acc[penyimakName].push(santri.nama); // Hanya simpan nama
    return acc;
  }, {});

  return { 
      isHoliday, 
      keteranganLibur, 
      date: now, 
      hadirList, 
      izinList, 
      alpaList, // List asli (objek)
      alpaGroupedByPenyimak // Objek terkelompok { Penyimak: [NamaSantri,...] }
  };
}

// === KOMPONEN UTAMA (SERVER COMPONENT) - DIPERBARUI ===
export default async function RekapHarianPage() {
  const data = await getDailyRecapData();

  const formattedDate = data.date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Rekap Absensi Hari Ini</h1>
      <p className="text-lg text-gray-700 mb-6">{formattedDate}</p>

      {/* Tampilkan Pesan Libur jika ya */}
      {data.isHoliday && (
        <div className="p-4 rounded-lg mb-6 bg-blue-100 border border-blue-300">
           <h2 className="text-xl font-bold text-blue-800">
             Hari Ini Libur: {data.keteranganLibur}
           </h2>
           <p className="text-blue-700 mt-1">Hanya santri yang tetap setoran wajib yang ditampilkan di bawah.</p>
        </div>
      )}
      {/* === Tombol Laporan WA (BARU) === */}
      {/* Hanya tampilkan jika TIDAK libur dan ADA yang alpa */}
      {!data.isHoliday && data.alpaList.length > 0 && (
          <div className="mb-6 p-4 border rounded-lg bg-yellow-50">
             <AlpaReportButton groupedAlpa={data.alpaGroupedByPenyimak} />
          </div>
      )}

      {/* Grid Kolom */}
      {/* Jika libur hanya 1 kolom, jika tidak 3 kolom */}
      <div className={`grid grid-cols-1 ${data.isHoliday ? 'md:grid-cols-1' : 'md:grid-cols-3'} gap-6`}>
        
        {/* Kolom Hadir (Selalu tampil) */}
        <SantriListCard
          title={data.isHoliday ? "Santri yang Tetap Setor (Wajib)" : "Sudah Setor (Wajib)"}
          count={data.hadirList.length}
          list={data.hadirList}
          color="green"
        />

        {/* Kolom Izin & Alpa (Hanya jika TIDAK libur) */}
        {!data.isHoliday && (
          <>
            <SantriListCard
              title="Izin"
              count={data.izinList.length}
              list={data.izinList}
              color="yellow"
            />
            <SantriListCard
              title="Alpa (Belum Setor)"
              count={data.alpaList.length}
              list={data.alpaList}
              color="red"
            />
          </>
        )}
        
      </div>
    </div>
  );
}

// === KOMPONEN BANTUAN TAMPILAN ===
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