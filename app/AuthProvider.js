'use client'; // Ini WAJIB, karena SessionProvider butuh context client

import { SessionProvider } from 'next-auth/react';

export default function AuthProvider({ children }) {
  // children di sini adalah seluruh halaman aplikasi Anda
  return <SessionProvider>{children}</SessionProvider>;
}