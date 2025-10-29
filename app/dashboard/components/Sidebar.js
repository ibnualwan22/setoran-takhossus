"use client"; 

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiX } from 'react-icons/fi'; // Ikon close
// (Ikon menu lainnya tetap diimpor)
import { 
    FiHome, FiEdit, FiClipboard, FiUsers, FiBookOpen, 
    FiUserCheck, FiCalendar, FiArchive, FiSettings 
} from 'react-icons/fi';

// Komponen NavLink tidak berubah
function NavLink({ href, icon: Icon, children, onClick }) { // Tambah onClick
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <li>
      <Link
        href={href}
        onClick={onClick} // Panggil onClick (untuk menutup menu mobile)
        className={`flex items-center gap-3 px-4 py-2 rounded-md hover:bg-gray-700 ${
            isActive ? 'bg-gray-700 text-white font-semibold' : 'text-gray-300'
        }`}
      >
        <Icon className="w-5 h-5" />
        {children}
      </Link>
    </li>
  );
}

// Terima props baru: isMobile, toggleMobileMenu
export default function Sidebar({ isMobile = false, toggleMobileMenu }) { 
  
  // Jika mobile, tutup menu saat link diklik
  const handleLinkClick = isMobile ? toggleMobileMenu : undefined;

  return (
    // Style berbeda untuk mobile vs desktop
    <aside className={`bg-gray-800 text-white min-h-screen p-4 flex flex-col
     ${isMobile ? 'w-64 fixed top-0 left-0 h-full z-50' : 'w-64'} `}
    >
      <div className="mb-8 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-center text-white">
            Setoran TPA
        </h2>
        {/* Tombol Close (Hanya di mobile) */}
        {isMobile && (
            <button onClick={toggleMobileMenu} className="text-gray-400 hover:text-white">
                <FiX className="w-6 h-6" />
            </button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto"> {/* Tambah overflow-y-auto */}
        <ul className="space-y-2">
          {/* Menu Utama */}
          <NavLink href="/dashboard" icon={FiHome} onClick={handleLinkClick}>Dashboard</NavLink>
          <NavLink href="/dashboard/input-setoran" icon={FiEdit} onClick={handleLinkClick}>Input Setoran</NavLink>
          
          {/* Menu Laporan */}
          <li className="pt-4 mt-4 border-t border-gray-700"><span className="px-4 text-xs font-semibold text-gray-400 uppercase">Laporan</span></li>
          <NavLink href="/dashboard/rekap-harian" icon={FiClipboard} onClick={handleLinkClick}>Rekap Harian</NavLink>
          <NavLink href="/dashboard/laporan-penyimak" icon={FiUserCheck} onClick={handleLinkClick}>Laporan Asuhan</NavLink>
          <NavLink href="/dashboard/riwayat-global" icon={FiArchive} onClick={handleLinkClick}>Riwayat Global</NavLink>
          <NavLink href="/dashboard/rekapitulasi-absen" icon={FiSettings} onClick={handleLinkClick}>Koreksi Data</NavLink>
          
          {/* Menu Admin */}
          <li className="pt-4 mt-4 border-t border-gray-700"><span className="px-4 text-xs font-semibold text-gray-400 uppercase">Manajemen Data</span></li>
          <NavLink href="/dashboard/manage-users" icon={FiUsers} onClick={handleLinkClick}>Pengguna</NavLink>
          <NavLink href="/dashboard/manage-santri" icon={FiUsers} onClick={handleLinkClick}>Santri</NavLink>
          <NavLink href="/dashboard/manage-kitab" icon={FiBookOpen} onClick={handleLinkClick}>Kitab Mukhotim</NavLink>
          <NavLink href="/dashboard/manage-holidays" icon={FiCalendar} onClick={handleLinkClick}>Hari Libur</NavLink>
        </ul>
      </nav>
    </aside>
  );
}