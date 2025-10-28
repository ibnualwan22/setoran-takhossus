import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// POST /api/users - Untuk membuat user baru
export async function POST(req) {
  const session = await getServerSession(authOptions);

  // 1. Cek Sesi dan Peran
  if (!session || !['ADMIN', 'STAF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { nama, username, password, role } = await req.json();

    // 2. Validasi Input
    if (!nama || !username || !password || !role) {
      return NextResponse.json(
        { error: 'Semua field (Nama, Username, Password, Role) wajib diisi' },
        { status: 400 }
      );
    }

    // 3. Validasi Keamanan Peran
    // Seorang STAF hanya boleh membuat PENCATAT
    if (session.user.role === 'STAF' && role !== 'PENCATAT') {
      return NextResponse.json(
        { error: 'Staf hanya dapat membuat pengguna dengan peran Pencatat' },
        { status: 403 }
      );
    }

    // 4. Cek duplikat username
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Username sudah digunakan' },
        { status: 409 }
      );
    }

    // 5. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Buat User dan Penyimak dalam satu transaksi
    // Kita gunakan "nested create" yang elegan
    const newUser = await prisma.user.create({
      data: {
        username: username,
        password: hashedPassword,
        role: role,
        // Langsung buat data Penyimak yang terhubung
        penyimak: {
          create: {
            nama: nama,
          },
        },
      },
      // Pilih data yang ingin dikembalikan (tanpa password)
      select: {
        id: true,
        username: true,
        role: true,
        penyimak: {
          select: {
            id: true,
            nama: true,
          },
        },
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}