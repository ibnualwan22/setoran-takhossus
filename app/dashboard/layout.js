import Sidebar from './components/Sidebar';
import Header from './components/Header';

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar (Statis di kiri) */}
      <Sidebar />

      {/* Area Konten (Utama) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header (Di atas area konten) */}
        <Header />

        {/* Konten Halaman (Bisa di-scroll) */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children} {/* Di sinilah halaman (page.js) akan dimuat */}
        </main>
      </div>
    </div>
  );
}