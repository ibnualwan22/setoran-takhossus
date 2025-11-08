import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getWIBDate } from '@/utils/wibUtils'; // Impor helper tanggal kita

const prisma = new PrismaClient();

// GET /api/izin-panjang
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'STAF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const izinList = await prisma.izinJangkaPanjang.findMany({
      orderBy: { tanggalMulai: 'desc' },
      include: {
        santri: { select: { nama: true } }, // Ambil nama santri
      },
    });
    return NextResponse.json(izinList, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
  }
}

// POST /api/izin-panjang
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'STAF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { santriId, tanggalMulai, tanggalSelesai, jenisIzin, keterangan } = body;

    if (!santriId || !tanggalMulai || !tanggalSelesai || !jenisIzin) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
    }

    // Konversi string YYYY-MM-DD ke Date object UTC 00:00
    // (Penting untuk tipe @db.Date)
    const startDate = new Date(tanggalMulai + 'T00:00:00Z');
    const endDate = new Date(tanggalSelesai + 'T00:00:00Z');

    if (endDate < startDate) {
      return NextResponse.json({ error: 'Tanggal selesai tidak boleh sebelum tanggal mulai' }, { status: 400 });
    }

    const newIzin = await prisma.izinJangkaPanjang.create({
      data: {
        santriId: parseInt(santriId),
        tanggalMulai: startDate,
        tanggalSelesai: endDate,
        jenisIzin: jenisIzin,
        keterangan: keterangan || '',
      },
      include: {
         santri: { select: { nama: true } } // Kirim balik data lengkap
      }
    });

    return NextResponse.json(newIzin, { status: 201 });
  } catch (error) {
    console.error('Error creating long-term izin:', error);
    return NextResponse.json({ error: 'Gagal menambah izin' }, { status: 500 });
  }
}