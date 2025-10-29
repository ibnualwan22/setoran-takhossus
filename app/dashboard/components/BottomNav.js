'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Impor ikon (contoh, bisa diganti)
import { 
    FiHome, 
    FiEdit, 
    FiClipboard, 
    FiUsers 
} from 'react-icons/fi'; 

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard/input-setoran', icon: FiEdit, label: 'Input' },
    { href: '/dashboard', icon: FiHome, label: 'Home' }, // Tengah
    { href: '/dashboard/rekap-harian', icon: FiClipboard, label: 'Rekap' },
    { href: '/dashboard/laporan-penyimak', icon: FiUsers, label: 'Asuhan' },
  ];

  return (
    // Muncul di bawah, HANYA di mobile (md:hidden)
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-2 border-t border-gray-700 md:hidden z-50">
      <ul className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href} className="flex-1 text-center">
              <Link
                href={item.href}
                className={`flex flex-col items-center p-1 rounded-md text-xs ${
                  isActive ? 'text-indigo-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 mb-1 ${isActive ? 'text-indigo-400' : ''}`} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}