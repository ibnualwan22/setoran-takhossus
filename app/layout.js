import './globals.css';
import { Inter } from 'next/font/google';
import AuthProvider from './AuthProvider'; // <-- 1. IMPORT

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Setoran Takhossus',
  description: 'Aplikasi Setoran Harian Asrama Takhossus',
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