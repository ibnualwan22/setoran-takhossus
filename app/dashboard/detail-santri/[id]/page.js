import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

const prisma = new PrismaClient();

// (Fungsi helper formatTgl dan getDetailDescription tidak berubah)
function formatTgl(isoString) {
  if (!isoString) return 'N/A';
  return new Date(isoString).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta'
  });
}

function getDetailDescription(item) {
  if (item.type === 'IZIN') {
    return `${item.jenisIzin}: ${item.keterangan}`;
  }
  const kitab = item.kitab?.namaKitab || 'Fathul Muin';
  const halaman = (item.halamanDari || item.halamanSampai) 
    ? `(Hal: ${item.halamanDari || ''} - ${item.halamanSampai || ''})` 
    : '';
  const baris = item.barisKe ? `Baris: ${item.barisKe}` : '';
  const ket = item.keterangan ? `Ket: ${item.keterangan}` : '';
  return [kitab, halaman, baris, ket].filter(Boolean).join(', ');
}


// === KOMPONEN UTAMA (SERVER COMPONENT) ===
export default async function DetailSantriPage({ params }) {
  
  // 1. Dapatkan session user
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;

  // 2. Resolve params (untuk Next.js 15)
  const resolvedParams = await params;
  const santriId = parseInt(resolvedParams.id);

  if (isNaN(santriId)) {
    notFound();
  }

  // 3. Ambil data santri DAN semua riwayatnya
  const santri = await prisma.santri.findUnique({
    where: { id: santriId },
    include: {
      penyimak: true,
      setoran: {
        include: { 
          kitab: true, 
          pencatat: { select: { username: true }} 
        },
        orderBy: { createdAt: 'desc' }
      },
      izin: {
        include: { 
          pencatat: { select: { username: true }} 
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  // Jika santri tidak ditemukan
  if (!santri) {
    notFound();
  }

  // 4. PROTEKSI AKSES: Jika user adalah PENCATAT, pastikan santri ini adalah asuhannya
  if (userRole === 'PENCATAT') {
    const penyimak = await prisma.penyimak.findUnique({
      where: { userId: session.user.id },
    });
    
    // Jika penyimak tidak ditemukan atau santri bukan asuhannya
    if (!penyimak || santri.penyimakId !== penyimak.id) {
      // Redirect ke halaman laporan atau tampilkan 403
      redirect('/dashboard/laporan-penyimak');
    }
  }

  // 5. Gabungkan 'setoran' dan 'izin' menjadi 1 array riwayat
  const allSetoran = santri.setoran.map(s => ({
    ...s,
    type: s.kategori, // WAJIB atau MUKHOTIM
  }));
  const allIzin = santri.izin.map(i => ({
    ...i,
    type: 'IZIN',
  }));

  // Gabungkan dan urutkan berdasarkan tanggal terbaru
  const combinedHistory = [...allSetoran, ...allIzin]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      
      {/* Tombol Kembali */}
      <div className="mb-4">
        <Link href="/dashboard/laporan-penyimak"
          className="text-indigo-600 hover:text-indigo-900"
        >
          &larr; Kembali ke Laporan Penyimak
        </Link>
      </div>

      {/* 1. Kartu Profil Santri */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h1 className="text-3xl font-bold text-gray-900">{santri.nama}</h1>
        <div className="mt-2 text-lg text-gray-700">
          <p>Penyimak: <span className="font-medium">{santri.penyimak?.nama || 'Belum di-assign'}</span></p>
          <p>Asal: <span className="font-medium">{santri.regency || 'N/A'}</span></p>
          <p>Status: {santri.is_active 
            ? <span className="font-medium text-green-600">Aktif</span> 
            : <span className="font-medium text-red-600">Nonaktif</span>}
          </p>
        </div>
      </div>

      {/* 2. Tabel Riwayat Lengkap */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Riwayat Lengkap</h2>
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tanggal & Waktu</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipe Catatan</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Detail</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pencatat</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {combinedHistory.map((item) => (
              <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{formatTgl(item.createdAt)}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                  {item.type === 'WAJIB' && <span className="text-green-700">Setoran Wajib</span>}
                  {item.type === 'MUKHOTIM' && <span className="text-blue-700">Setoran Mukhotim</span>}
                  {item.type === 'IZIN' && <span className="text-yellow-700">Izin</span>}
                </td>
                <td className="px-4 py-2 text-sm text-gray-800">{getDetailDescription(item)}</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{item.pencatat?.username || 'N/A'}</td>
              </tr>
            ))}
            {combinedHistory.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-500">
                  Belum ada riwayat setoran atau izin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}