import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import SantriManagementClient from './SantriManagementClient';

const prisma = new PrismaClient();

// Fungsi untuk mengambil data santri lokal
async function getSantri() {
  const santri = await prisma.santri.findMany({
    // === PERUBAHAN: Hapus filter 'is_active: true' ===
    // Kita ambil semua data agar bisa me-nonaktifkan / meng-aktifkan
    orderBy: {
      nama: 'asc',
    },
    include: {
      penyimak: true, 
    },
  });
  return santri;
}

// Fungsi untuk mengambil daftar penyimak
async function getPenyimakList() {
  const penyimak = await prisma.penyimak.findMany({
    orderBy: {
      nama: 'asc',
    },
  });
  return penyimak;
}

// Ini adalah Server Component
export default async function ManageSantriPage() {
  const session = await getServerSession(authOptions);

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

  const initialSantri = await getSantri();
  const penyimakList = await getPenyimakList();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Manajemen Santri
      </h1>
      
      <SantriManagementClient 
        initialSantri={initialSantri} 
        penyimakList={penyimakList} 
      />
    </div>
  );
}