import './globals.css';
import { Inter } from 'next/font/google';
import AuthProvider from './AuthProvider'; // <-- 1. IMPORT

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Setoran Takhossus',
  description: 'Aplikasi Setoran Harian Asrama Takhossus',
  manifest: '/manifest.json', // Link otomatis ke manifest yang digenerate Next.js
};

// TAMBAHKAN INI:
export const viewport = {
  themeColor: "#4f46e5", // Warna bar notifikasi di HP Android
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Mencegah zoom cubit (opsional, biar rasa native app)
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider> {/* <-- 2. BUNGKUS DI SINI */}
          {children}
        </AuthProvider> {/* <-- 3. TUTUP DI SINI */}
      </body>
    </html>
  );
}