import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// PUT /api/profile/change-password
export async function PUT(req) {
  const session = await getServerSession(authOptions);

  // 1. Cek Sesi (Harus login)
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const { oldPassword, newPassword } = await req.json();

    // 2. Validasi Input
    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Password lama dan baru wajib diisi' }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 });
    }

    // 3. Ambil data user dari DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    // 4. Validasi Password Lama
    const isPasswordValid = await bcrypt.compare(
      oldPassword,
      user.password
    );
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Password lama Anda salah' }, { status: 403 });
    }

    // 5. Hash dan Simpan Password Baru
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
      },
    });

    return NextResponse.json({ message: 'Password berhasil diperbarui' }, { status: 200 });
  
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}