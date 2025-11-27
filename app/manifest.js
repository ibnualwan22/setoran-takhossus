export default function manifest() {
  return {
    name: 'Setoran Takhossus',
    short_name: 'SetoranApp',
    description: 'Aplikasi Pencatatan Setoran Takhossus',
    start_url: '/dashboard', // Halaman pertama saat aplikasi dibuka
    display: 'standalone', // Tampilan seperti aplikasi native (tanpa browser bar)
    background_color: '#ffffff',
    theme_color: '#4f46e5', // Sesuaikan dengan warna primary (Indigo)
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}