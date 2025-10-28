import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// POST /api/izin - Untuk membuat izin baru
export async function POST(req) {
  const session = await getServerSession(authOptions);

  // 1. Cek Sesi
  if (!session) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 401 });
  }

  try {
    const pencatatId = session.user.id;
    const { santriId, jenisIzin, keterangan } = await req.json();

    // 2. Validasi Input
    if (!santriId || !jenisIzin || !keterangan) {
      return NextResponse.json(
        { error: 'Santri, Jenis Izin, dan Keterangan wajib diisi' },
        { status: 400 }
      );
    }
    
    // 3. (SEMUA LOGIKA PENGECEKAN HARI INI DIHAPUS)
    // Kita langsung catat saja.

    // 4. Buat data Izin
    const newIzin = await prisma.izin.create({
      data: {
        santriId: parseInt(santriId),
        pencatatId: parseInt(pencatatId),
        jenisIzin: jenisIzin, // SAKIT, PULANG, LAINNYA
        keterangan: keterangan,
      },
    });

    return NextResponse.json(newIzin, { status: 201 });
  } catch (error) {
    console.error('Error creating izin:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}