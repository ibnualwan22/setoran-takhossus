"use client"; // Layout ini sekarang perlu state, jadi harus Client Component

import { useState } from 'react'; // Impor useState
import { Toaster } from 'react-hot-toast'; 

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import BottomNav from './components/BottomNav';

export default function DashboardLayout({ children }) {
  // State untuk mengontrol menu mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden"> {/* Tambah overflow-hidden */}
      <Toaster position="top-center" reverseOrder={false} />

      {/* Sidebar Desktop (Tetap sama, tersembunyi di mobile) */}
      <div className="hidden md:flex md:flex-shrink-0"> {/* Pastikan flex-shrink-0 */}
        <Sidebar />
      </div>
      
      {/* Sidebar Mobile (Overlay) */}
      {/* Muncul jika isMobileMenuOpen true, HANYA di mobile */}
      {isMobileMenuOpen && (
         <div className="fixed inset-0 z-40 md:hidden">
            {/* Backdrop (untuk menutup saat diklik di luar) */}
            <div 
                className="absolute inset-0 bg-gray-600 opacity-75" 
                onClick={toggleMobileMenu} // Tutup menu saat backdrop diklik
            ></div>
            {/* Konten Sidebar Mobile */}
            <div className="relative z-50 h-full"> 
                {/* Kita render Sidebar lagi di sini khusus mobile */}
                <Sidebar isMobile={true} toggleMobileMenu={toggleMobileMenu} /> 
            </div>
         </div>
      )}


      {/* Area Konten */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header (Kirim state & fungsi toggle) */}
        <Header 
            toggleMobileMenu={toggleMobileMenu} 
            isMobileMenuOpen={isMobileMenuOpen} // Kirim status buka/tutup
        />

        {/* Konten Halaman */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6 pb-20 md:pb-6">
          {children} 
        </main>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}