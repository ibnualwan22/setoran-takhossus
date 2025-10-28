import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// === FUNGSI HELPER ZONA WAKTU (WIB) ===
function getWIBToday() {
  // Paksa 'new Date()' untuk merefleksikan zona waktu Asia/Jakarta
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
}

function getWIBTodayRange(now) {
  // Set ke jam 00:00:00 WIB hari ini
  const startOfDayWIB = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  // Set ke jam 00:00:00 WIB BESOK
  const endOfDayWIB = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  return { startOfDayWIB, endOfDayWIB };
}

// === FUNGSI INTI PENGAMBIL DATA ===
async function getDailyRecapData() {
  const now = getWIBToday();
  const dayOfWeek = now.getDay(); // 0=Minggu, 1=Senin, ... , 4=Kamis, 5=Jumat

  // 1. Cek Hari Libur (Kamis/Malam Jumat & Jumat/Malam Sabtu)
  if (dayOfWeek === 4 || dayOfWeek === 5) {
    return {
      isHoliday: true,
      date: now,
    };
  }

  // 2. Tentukan Rentang Waktu Hari Ini
  const { startOfDayWIB, endOfDayWIB } = getWIBTodayRange(now);

  // 3. Ambil Semua Data yang Relevan (secara paralel)
  const [allActiveSantri, setoranWajibToday, izinToday] = await Promise.all([
    // Ambil semua santri aktif
    prisma.santri.findMany({
      where: { is_active: true },
      orderBy: { nama: 'asc' },
    }),
    // Ambil ID santri yang setoran WAJIB hari ini
    prisma.setoran.findMany({
      where: {
        kategori: 'WAJIB',
        createdAt: {
          gte: startOfDayWIB,
          lt: endOfDayWIB,
        },
      },
      select: { santriId: true }, // Hanya butuh ID
    }),
    // Ambil ID santri yang IZIN hari ini
    prisma.izin.findMany({
      where: {
        createdAt: {
          gte: startOfDayWIB,
          lt: endOfDayWIB,
        },
      },
      select: { santriId: true }, // Hanya butuh ID
    }),
  ]);

  // 4. Proses dan Kelompokkan Data (di server)
  // Gunakan 'Set' untuk pencarian super cepat (lebih baik dari Array.includes)
  const setoranWajibIds = new Set(setoranWajibToday.map(s => s.santriId));
  const izinIds = new Set(izinToday.map(i => i.santriId));

  const hadirList = [];
  const izinList = [];
  const alpaList = [];

  for (const santri of allActiveSantri) {
    if (setoranWajibIds.has(santri.id)) {
      // Prioritas 1: Jika sudah setoran wajib -> HADIR
      hadirList.push(santri);
    } else if (izinIds.has(santri.id)) {
      // Prioritas 2: Jika tidak setoran, tapi izin -> IZIN
      izinList.push(santri);
    } else {
      // Sisanya -> ALPA
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
export default async function RekapHarianPage() {
  const data = await getDailyRecapData();

  // Helper untuk format tanggal
  const formattedDate = data.date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });

  // Tampilan Jika Hari Libur
  if (data.isHoliday) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Rekap Absensi Hari Ini</h1>
        <p className="text-lg text-gray-700 mb-6">{formattedDate}</p>
        <div className="p-8 text-center bg-blue-50 rounded-lg">
          <h2 className="text-3xl font-bold text-blue-800">🎉 Libur Setoran 🎉</h2>
          <p className="text-lg text-blue-700 mt-2">
            Hari ini adalah hari libur (Kamis/Jumat). Tidak ada rekap absensi.
          </p>
        </div>
      </div>
    );
  }

  // Tampilan Jika Hari Biasa
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Rekap Absensi Hari Ini</h1>
      <p className="text-lg text-gray-700 mb-6">{formattedDate}</p>

      {/* Grid 3 Kolom untuk Hadir, Izin, Alpa */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Kolom Hadir */}
        <SantriListCard
          title="Sudah Setor (Wajib)"
          count={data.hadirList.length}
          list={data.hadirList}
          color="green"
        />

        {/* Kolom Izin */}
        <SantriListCard
          title="Izin"
          count={data.izinList.length}
          list={data.izinList}
          color="yellow"
        />

        {/* Kolom Alpa */}
        <SantriListCard
          title="Alpa (Belum Setor)"
          count={data.alpaList.length}
          list={data.alpaList}
          color="red"
        />
        
      </div>
    </div>
  );
}

// === KOMPONEN BANTUAN TAMPILAN ===
// (Kita letakkan di file yang sama agar simpel)
function SantriListCard({ title, count, list, color }) {
  const colors = {
    green: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    red: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  };
  const theme = colors[color] || colors['gray'];

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