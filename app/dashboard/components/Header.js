'use client'; // Karena ada tombol logout (client function)

import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react'; // Hook untuk ambil data sesi di client

export default function Header() {
  const { data: session } = useSession(); // Ambil data sesi

  return (
    <header className="w-full bg-white shadow-md p-4 flex justify-between items-center">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">
          Selamat datang,{' '}
          <span className="text-indigo-600">
            {session?.user?.username || 'Pengguna'}
          </span>
        </h1>
        <p className="text-sm text-gray-600">
          Peran Anda: {session?.user?.role}
        </p>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="px-4 py-2 font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        Logout
      </button>
    </header>
  );
}