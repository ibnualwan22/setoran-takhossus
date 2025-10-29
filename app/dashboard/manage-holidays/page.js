import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import HolidayClient from './HolidayClient'; // Komponen Client

const prisma = new PrismaClient();

// Fungsi untuk mengambil data hari libur
async function getHolidays() {
  const holidays = await prisma.hariLibur.findMany({
    orderBy: {
      tanggal: 'asc', 
    },
  });
  // 'h.tanggal' sekarang adalah Date object UTC 00:00
  // Kita ambil YYYY-MM-DD langsung darinya
  return holidays.map(h => ({
      ...h,
      // Gunakan getUTCFullYear(), getUTCMonth(), getUTCDate()
      tanggal: `${h.tanggal.getUTCFullYear()}-${String(h.tanggal.getUTCMonth() + 1).padStart(2, '0')}-${String(h.tanggal.getUTCDate()).padStart(2, '0')}`
  }));
}

// Ini adalah Server Component
export default async function ManageHolidaysPage() {
  const session = await getServerSession(authOptions);

  // Proteksi halaman (hanya Admin & Staf)
  if (!['ADMIN', 'STAF'].includes(session.user.role)) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-red-600">Akses Ditolak</h1>
        <p className="text-gray-700 mt-2">
          Halaman ini hanya untuk Admin dan Staf.
        </p>
      </div>
    );
  }

  // Ambil data awal
  const initialHolidays = await getHolidays();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Manajemen Hari Libur
      </h1>
      <p className="text-gray-600 mb-6">
        Tambahkan tanggal libur setoran (selain Kamis & Jumat) di sini. Tanggal ini akan otomatis ditandai sebagai "Libur" di laporan.
      </p>
      
      {/* Kirim data awal ke komponen client */}
      <HolidayClient initialHolidays={initialHolidays} />
    </div>
  );
}