import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import UserManagementClient from './UserManagementClient'; // Komponen Client

const prisma = new PrismaClient();

// Fungsi untuk mengambil data pengguna
async function getUsers(session) {
  // Logika Keamanan:
  // - ADMIN bisa melihat STAF dan PENCATAT
  // - STAF hanya bisa melihat PENCATAT
  
  let whereClause = {};

  if (session.user.role === 'STAF') {
    whereClause = {
      role: 'PENCATAT',
    };
  } else if (session.user.role === 'ADMIN') {
    whereClause = {
      role: {
        in: ['STAF', 'PENCATAT'],
      },
    };
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    include: {
      penyimak: true, // Ambil data nama dari tabel Penyimak
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return users;
}

// Ini adalah Server Component
export default async function ManageUsersPage() {
  const session = await getServerSession(authOptions);

  // Proteksi halaman
  if (session.user.role === 'PENCATAT') {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-red-600">Akses Ditolak</h1>
        <p className="text-gray-700 mt-2">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
      </div>
    );
  }

  // Ambil data user di server
  const initialUsers = await getUsers(session);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Manajemen Pengguna
      </h1>
      
      {/* Kita kirim data 'initialUsers' dan 'session' 
        ke komponen client 
      */}
      <UserManagementClient 
        initialUsers={initialUsers} 
        session={session} 
      />
    </div>
  );
}