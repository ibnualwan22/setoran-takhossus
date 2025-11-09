import { PrismaClient } from '@prisma/client';
import AlpaReportButton from './AlpaReportButton';

export const revalidate = 0;
const prisma = new PrismaClient();

// === FUNGSI HELPER ZONA WAKTU ===
function getWIBToday() {
  return new Date();
}

function getWIBTodayRange(now) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;

  const isoStringStart = `${dateString}T00:00:00.000+07:00`;
  const startOfDayWIB = new Date(isoStringStart);
  
  const isoStringEnd = `${dateString}T23:59:59.999+07:00`;
  const endOfDayWIB = new Date(isoStringEnd);
  
  return { startOfDayWIB, endOfDayWIB };
}

// === FUNGSI INTI PENGAMBIL DATA (DIPERBARUI) ===
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

  // 2. Tentukan Rentang Waktu
  const { startOfDayWIB, endOfDayWIB } = getWIBTodayRange(now);

  // 3. Ambil Data (UPDATED: Include data izin lengkap)
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
    isHoliday ? Promise.resolve([]) : prisma.izin.findMany({
      where: { createdAt: { gte: startOfDayWIB, lte: endOfDayWIB } },
      select: { 
        santriId: true, 
        jenisIzin: true, 
        keterangan: true,
        createdAt: true 
      },
    }),
    prisma.izinJangkaPanjang.findMany({
        where: {
            tanggalMulai: { lte: todayDateOnly },
            tanggalSelesai: { gte: todayDateOnly },
        },
        select: { 
          santriId: true,
          keterangan: true,
          tanggalMulai: true,
          tanggalSelesai: true
        }
    })
  ]);
  
  // 4. Buat Map untuk data izin
  const izinHarianMap = new Map();
  izinHarianToday.forEach(izin => {
    izinHarianMap.set(izin.santriId, {
      jenis: izin.jenisIzin,
      keterangan: izin.keterangan,
      waktu: izin.createdAt
    });
  });

  const izinPanjangMap = new Map();
  izinPanjangToday.forEach(izin => {
    izinPanjangMap.set(izin.santriId, {
      jenis: 'JANGKA_PANJANG',
      keterangan: izin.keterangan,
      tanggalMulai: izin.tanggalMulai,
      tanggalSelesai: izin.tanggalSelesai
    });
  });
  
  // 5. Proses dan Kelompokkan
  const setoranWajibIds = new Set(setoranWajibToday.map(s => s.santriId));

  const hadirList = [];
  const izinList = [];
  const alpaList = []; 

  for (const santri of allActiveSantri) {
    if (setoranWajibIds.has(santri.id)) {
      hadirList.push(santri);
    } 
    else if (izinPanjangMap.has(santri.id)) {
      const izinData = izinPanjangMap.get(santri.id);
      izinList.push({
        ...santri,
        izinInfo: izinData
      });
    }
    else if (!isHoliday && izinHarianMap.has(santri.id)) {
      const izinData = izinHarianMap.get(santri.id);
      izinList.push({
        ...santri,
        izinInfo: izinData
      });
    } 
    else if (!isHoliday) {
      alpaList.push(santri);
    }
  }

  // 6. Group Alpa by Penyimak
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

// === KOMPONEN UTAMA (SERVER COMPONENT) ===
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
           <h2 className="text-xl font-bold text-blue-800">🌙 Hari Ini Libur: {data.keteranganLibur}</h2>
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
          count={data.hadirList.length} 
          list={data.hadirList} 
          color="green"
          icon="✓"
        />
        {!data.isHoliday && (
          <>
            <IzinListCard 
              title="Izin" 
              count={data.izinList.length} 
              list={data.izinList} 
            />
            <SantriListCard 
              title="Alpa (Belum Setor)" 
              count={data.alpaList.length} 
              list={data.alpaList} 
              color="red"
              icon="✗"
            />
          </>
        )}
      </div>
    </div>
  );
}

// === KOMPONEN CARD SANTRI BIASA ===
function SantriListCard({ title, count, list, color, icon }) {
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
          {icon && <span className="mr-2">{icon}</span>}
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

// === KOMPONEN CARD IZIN DENGAN DETAIL (BARU) ===
function IzinListCard({ title, count, list }) {
  const jenisIzinLabel = {
    SAKIT: { text: 'Sakit', color: 'bg-red-50 text-red-700 border-red-200' },
    URUSAN_KELUARGA: { text: 'Urusan Keluarga', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    KEPERLUAN_PENTING: { text: 'Keperluan Penting', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    JANGKA_PANJANG: { text: 'Izin Jangka Panjang', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'short',
      timeZone: 'Asia/Jakarta'
    });
  };

  return (
    <div className="rounded-lg border border-yellow-300 bg-yellow-100">
      <div className="p-4 border-b border-yellow-300">
        <h2 className="text-xl font-bold text-yellow-800">
          <span className="mr-2">📝</span>
          {title} ({count})
        </h2>
      </div>
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {list.length > 0 ? (
          list.map((santri, index) => {
            const izinInfo = santri.izinInfo;
            const jenisInfo = jenisIzinLabel[izinInfo.jenis] || { 
              text: izinInfo.jenis, 
              color: 'bg-gray-50 text-gray-700 border-gray-200' 
            };

            return (
              <div 
                key={santri.id} 
                className="bg-white rounded-lg p-3 border border-yellow-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-gray-900">
                    {index + 1}. {santri.nama}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full border ${jenisInfo.color} font-medium`}>
                    {jenisInfo.text}
                  </span>
                </div>
                
                {izinInfo.keterangan && (
                  <p className="text-sm text-gray-600 mb-2 italic">
                    "{izinInfo.keterangan}"
                  </p>
                )}

                {izinInfo.jenis === 'JANGKA_PANJANG' && izinInfo.tanggalMulai && izinInfo.tanggalSelesai && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                    <span>📅</span>
                    <span>
                      {formatDate(izinInfo.tanggalMulai)} - {formatDate(izinInfo.tanggalSelesai)}
                    </span>
                  </div>
                )}

                {izinInfo.waktu && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
                    <span>🕐</span>
                    <span>
                      Dicatat: {new Date(izinInfo.waktu).toLocaleTimeString('id-ID', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        timeZone: 'Asia/Jakarta'
                      })}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-500 italic">Tidak ada santri yang izin.</p>
        )}
      </div>
    </div>
  );
}