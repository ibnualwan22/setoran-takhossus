import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET /api/kitab - Untuk mendapatkan semua kitab
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
  }

  try {
    const kitab = await prisma.kitab.findMany({
      orderBy: { namaKitab: 'asc' }, // Urutkan berdasarkan abjad
    });
    return NextResponse.json(kitab, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// POST /api/kitab - Untuk membuat kitab baru
export async function POST(req) {
  const session = await getServerSession(authOptions);

  // 1. Cek Sesi dan Peran (Hanya Admin/Staf)
  if (!session || !['ADMIN', 'STAF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { namaKitab } = await req.json();

    // 2. Validasi Input
    if (!namaKitab) {
      return NextResponse.json(
        { error: 'Nama kitab wajib diisi' },
        { status: 400 }
      );
    }

    // 3. Cek duplikat (case-insensitive)
    const existingKitab = await prisma.kitab.findFirst({
      where: {
        namaKitab: {
          equals: namaKitab,
          mode: 'insensitive', // Tidak peduli huruf besar/kecil
        },
      },
    });
    if (existingKitab) {
      return NextResponse.json(
        { error: 'Nama kitab sudah ada' },
        { status: 409 }
      );
    }

    // 4. Buat kitab baru
    const newKitab = await prisma.kitab.create({
      data: {
        namaKitab: namaKitab,
        kategori: 'MUKHOTIM', // Sesuai skema kita
      },
    });

    return NextResponse.json(newKitab, { status: 201 });
  } catch (error) {
    console.error('Error creating kitab:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}