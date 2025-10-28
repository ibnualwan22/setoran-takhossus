import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import InputSetoranClient from './InputSetoranClient'; // Komponen Client

const prisma = new PrismaClient();

// Fungsi untuk mengambil data santri yang aktif
async function getActiveSantri() {
  const santri = await prisma.santri.findMany({
    where: {
      is_active: true // HANYA santri aktif
    },
    orderBy: {
      nama: 'asc', // Urutkan A-Z
    },
    include: {
      penyimak: true, // Ambil data penyimak
    },
  });
  return santri;
}

// Fungsi untuk mengambil daftar kitab mukhotim
async function getKitabList() {
  const kitab = await prisma.kitab.findMany({
    orderBy: {
      namaKitab: 'asc',
    },
  });
  return kitab;
}

// Ini adalah Server Component
export default async function InputSetoranPage() {
  // Halaman ini bisa diakses oleh semua peran (Admin, Staf, Pencatat)
  // jadi kita tidak perlu proteksi peran di sini
  
  // Ambil data santri & kitab di server
  const santriList = await getActiveSantri();
  const kitabList = await getKitabList();
  
  // Kita juga ambil data sesi untuk dikirim ke client
  // Kita akan butuh ID pencatat saat menyimpan setoran
  const session = await getServerSession(authOptions);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Input Setoran & Izin Harian
      </h1>
      
      {/* Kirim data awal ke komponen client */}
      <InputSetoranClient 
        santriList={santriList} 
        kitabList={kitabList}
        currentUser={session.user} // Kirim data user yang login
      />
    </div>
  );
}