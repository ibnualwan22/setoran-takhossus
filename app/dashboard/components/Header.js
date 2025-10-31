'use client'; 

import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { FiMenu, FiX } from 'react-icons/fi'; // Impor ikon Menu & X

// Terima props baru: toggleMobileMenu, isMobileMenuOpen
export default function Header({ toggleMobileMenu, isMobileMenuOpen }) {
  const { data: session } = useSession(); 

  return (
    <header className="w-full bg-white shadow-md p-4 flex justify-between items-center z-30"> {/* Tambah z-index */}
      {/* Tombol Hamburger/X (Hanya Mobile) */}
      <button 
        onClick={toggleMobileMenu}
        className="text-gray-600 hover:text-gray-800 md:hidden" // Tampil hanya di mobile
        aria-label={isMobileMenuOpen ? "Tutup menu" : "Buka menu"}
      >
        {isMobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
      </button>

      {/* Sapaan (Geser sedikit jika perlu) */}
      <div className="hidden md:block"> {/* Sembunyikan sapaan default di mobile agar tidak terlalu ramai */}
        <h1 className="text-xl font-semibold text-gray-800">
          Selamat datang,{' '}
          <span className="text-indigo-600">
            {session?.user?.username || 'Pengguna'}
          </span>
        </h1>
        {/* <p className="text-sm text-gray-600">Peran Anda: {session?.user?.role}</p> */}
      </div>

       {/* Judul Aplikasi (Muncul di tengah mobile) */}
        <div className="md:hidden text-lg font-bold text-gray-800">
            Setoran TAakhossus
        </div>

      {/* Tombol Logout (Tetap di kanan) */}
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        Logout
      </button>
    </header>
  );
}