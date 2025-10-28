import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import KitabManagementClient from './KitabManagementClient'; // Komponen Client

const prisma = new PrismaClient();

// Fungsi untuk mengambil data kitab
async function getKitab() {
  const kitab = await prisma.kitab.findMany({
    orderBy: {
      namaKitab: 'asc', // Urutkan A-Z
    },
  });
  return kitab;
}

// Ini adalah Server Component
export default async function ManageKitabPage() {
  const session = await getServerSession(authOptions);

  // Proteksi halaman (hanya Admin & Staf)
  if (!['ADMIN', 'STAF'].includes(session.user.role)) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-red-600">Akses Ditolak</h1>
        <p className="text-gray-700 mt-2">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
      </div>
    );
  }

  // Ambil data kitab di server
  const initialKitab = await getKitab();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Manajemen Kitab Mukhotim
      </h1>
      <p className="text-gray-600 mb-4">
        Daftar ini hanya untuk kitab-kitab kategori Mukhotim. Kitab setoran
        Wajib (Fathul Mu'in) sudah diatur oleh sistem.
      </p>
      
      {/* Kirim data awal ke komponen client */}
      <KitabManagementClient initialKitab={initialKitab} />
    </div>
  );
}