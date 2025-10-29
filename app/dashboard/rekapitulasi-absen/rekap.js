import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import RekapClient from './RekapClient'; // Komponen Client

const prisma = new PrismaClient();

// Ambil data untuk filter
async function getFilterData() {
  const [santriList, kitabList] = await Promise.all([
    prisma.santri.findMany({
      where: { is_active: true },
      orderBy: { nama: 'asc' },
      select: { id: true, nama: true }
    }),
    prisma.kitab.findMany({
      orderBy: { namaKitab: 'asc' },
      select: { id: true, namaKitab: true }
    })
  ]);
  return { santriList, kitabList };
}

// Ini adalah Server Component
export default async function RekapitulasiPage() {
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

  const { santriList, kitabList } = await getFilterData();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Rekapitulasi Absen (Koreksi Data)
      </h1>
      <p className="text-gray-600 mb-6">
        Gunakan halaman ini untuk mencari, mengedit, atau menghapus catatan setoran/izin yang salah input.
      </p>
      
      {/* Kirim data filter ke komponen client */}
      <RekapClient 
        santriList={santriList} 
        kitabList={kitabList} 
      />
    </div>
  );
}