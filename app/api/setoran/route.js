import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// POST /api/setoran - Untuk membuat setoran baru
export async function POST(req) {
  const session = await getServerSession(authOptions);

  // 1. Cek Sesi
  if (!session) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
  }

  try {
    const pencatatId = session.user.id;
    const body = await req.json();
    const { 
      santriId, 
      kategori, // WAJIB or MUKHOTIM
      kitabId,  // null jika WAJIB
      halamanDari, 
      halamanSampai, 
      barisKe, 
      keterangan 
    } = body;

    // 2. Validasi Input
    if (!santriId || !kategori) {
      return NextResponse.json(
        { error: 'Santri ID dan Kategori wajib diisi' },
        { status: 400 }
      );
    }
    if (kategori === 'MUKHOTIM' && !kitabId) {
      return NextResponse.json(
        { error: 'Kitab Mukhotim wajib dipilih' },
        { status: 400 }
      );
    }
    
    // 3. (SEMUA LOGIKA PENGECEKAN HARI INI DIHAPUS)
    // Kita langsung catat saja.

    // 4. Buat data Setoran
    const newSetoran = await prisma.setoran.create({
      data: {
        santriId: parseInt(santriId),
        pencatatId: parseInt(pencatatId),
        kategori: kategori,
        kitabId: kitabId ? parseInt(kitabId) : null,
        halamanDari,
        halamanSampai,
        barisKe,
        keterangan,
        // 'createdAt' akan otomatis diisi oleh Prisma
      },
    });

    return NextResponse.json(newSetoran, { status: 201 });
  } catch (error) {
    console.error('Error creating setoran:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}