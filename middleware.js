// middleware.js
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  // `withAuth` akan otomatis memproses & melindungi
  function middleware(req) {
    // Di sini kita bisa menambahkan logika tambahan jika perlu
    // Contoh: Cek role
    // const { token } = req.nextauth;
    // if (req.nextUrl.pathname.startsWith('/admin') && token?.role !== 'ADMIN') {
    //   return new NextResponse('Anda bukan Admin!');
    // }
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // !!token (double bang) mengubah nilai menjadi boolean
        // Jika token ada (sudah login), `authorized` akan true
        return !!token;
      },
    },
    pages: {
      signIn: '/login', // Halaman login kita
    },
  }
);

// 2. Konfigurasi Matcher (Halaman mana yang dilindungi)
export const config = {
  matcher: [
    /*
     * Cocokkan semua path KECUALI:
     * - /api/ (API routes)
     * - /api/auth/ (NextAuth routes)
     * - /_next/static (file statis)
     * - /_next/image (optimasi gambar)
     * - /favicon.ico (favicon)
     * - /login (halaman login itu sendiri)
     */
    '/((?!api|api/auth|_next/static|_next/image|favicon.ico|login).*)',
  ],
};