'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Impor ikon (contoh, bisa diganti)
import { 
    FiHome, 
    FiEdit, 
    FiClipboard, 
    FiUsers,
    FiUser
} from 'react-icons/fi'; 

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard/input-setoran', icon: FiEdit, label: 'Input' },
    { href: '/dashboard/rekap-harian', icon: FiClipboard, label: 'Rekap' },
    { href: '/dashboard', icon: FiHome, label: 'Home' }, // Tengah
    { href: '/dashboard/laporan-penyimak', icon: FiUsers, label: 'Asuhan' },
    { href: '/dashboard/profile', icon: FiUser, label: 'Profile' },
  ];

  return (
    // Muncul di bawah, HANYA di mobile (md:hidden)
    <nav className="fixed bottom-0 left-0 right-0 md:hidden z-50">
      {/* Background putih dengan border atas */}
      <div className="bg-white border-t border-gray-200 shadow-lg">
        <div className="relative">
          {/* Lengkungan di tengah untuk tombol Home */}
          <div className="absolute left-1/2 transform -translate-x-1/2 -top-8">
            <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
              <Link 
                href="/dashboard"
                className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-md hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                <FiHome className="w-7 h-7 text-white" />
              </Link>
            </div>
          </div>

          {/* Navigation Items */}
          <ul className="flex justify-around items-center px-4 py-3">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href;
              const isHome = item.href === '/dashboard';
              
              // Skip rendering Home di bawah karena sudah di tengah atas
              if (isHome) {
                return <li key={item.href} className="flex-1"></li>;
              }
              
              return (
                <li key={item.href} className="flex-1 text-center">
                  <Link
                    href={item.href}
                    className={`flex flex-col items-center transition-colors ${
                      isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <item.icon className={`w-6 h-6 mb-1 ${isActive ? 'text-indigo-600' : ''}`} />
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}