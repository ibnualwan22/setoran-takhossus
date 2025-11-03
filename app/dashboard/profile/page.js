import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import ChangePasswordForm from './ChangePasswordForm'; // Komponen Client
import { FiUser, FiShield } from 'react-icons/fi';

// Halaman ini tidak perlu 'revalidate = 0' karena
// data sesi (username/peran) tidak akan berubah di tengah sesi.
export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return <p>Silakan login terlebih dahulu.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* 1. Kartu Info Profil */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Profil Saya</h1>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <FiUser className="w-5 h-5 text-gray-500" />
            <span className="text-lg text-gray-700">
              Username: <span className="font-semibold text-gray-900">{session.user.username}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <FiShield className="w-5 h-5 text-gray-500" />
            <span className="text-lg text-gray-700">
              Peran: <span className="font-semibold text-gray-900">{session.user.role}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Form Ganti Password (Client Component) */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Ganti Password</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}