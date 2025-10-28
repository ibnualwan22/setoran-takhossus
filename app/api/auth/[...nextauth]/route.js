import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const authOptions = {
  // 1. Menggunakan session strategy JWT (JSON Web Token)
  session: {
    strategy: 'jwt',
  },

  // 2. Menentukan Provider (Cara Login)
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      // 3. Logika otorisasi (saat tombol login ditekan)
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null; // Jika username/password tidak diisi
        }

        // Cari user di database
        const user = await prisma.user.findUnique({
          where: {
            username: credentials.username,
          },
        });

        // Jika user tidak ditemukan
        if (!user) {
          return null;
        }

        // Cek kecocokan password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        // Jika password salah
        if (!isPasswordValid) {
          return null;
        }

        // Jika berhasil, kembalikan data user (TANPA PASSWORD)
        // Data ini akan diteruskan ke callback 'jwt'
        return {
          id: user.id,
          username: user.username,
          role: user.role,
        };
      },
    }),
  ],

  // 4. Callbacks (Mengatur apa yang disimpan di token)
  callbacks: {
    // Callback 'jwt' dipanggil setelah 'authorize'
    async jwt({ token, user }) {
      // Jika 'user' ada (artinya baru login), tambahkan data user ke token
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    
    // Callback 'session' dipanggil untuk membuat data session
    async session({ session, token }) {
      // Ambil data dari token dan masukkan ke session.user
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.role = token.role;
      }
      return session;
    },
  },

  // 5. Menentukan halaman custom login
  pages: {
    signIn: '/login', // Kita akan buat halaman ini di /app/login/page.jsx
  },
};

// 6. Ekspor handler
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };