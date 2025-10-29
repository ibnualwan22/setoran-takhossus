import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getWIBDate } from '@/utils/wibUtils'; // Impor helper kita
import { Prisma } from '@prisma/client'

const prisma = new PrismaClient();

// GET /api/holidays - Mendapatkan semua hari libur
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'STAF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const holidays = await prisma.hariLibur.findMany({
      orderBy: { tanggal: 'asc' }, // Urutkan tanggal
    });
    return NextResponse.json(holidays, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
  }
}

// POST /api/holidays - Menambah hari libur baru
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'STAF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { tanggal, keterangan } = await req.json(); // tanggal is YYYY-MM-DD

    if (!tanggal) {
      return NextResponse.json({ error: 'Tanggal wajib diisi' }, { status: 400 });
    }

    // === PERBAIKAN: Buat Date object UTC 00:00 ===
    // Langsung dari string YYYY-MM-DD
    const dateUTC = new Date(tanggal + 'T00:00:00Z'); 
    // Pastikan tidak ada pergeseran karena timezone lokal server
    dateUTC.setUTCHours(0, 0, 0, 0);

    // Cek duplikat
    const existing = await prisma.hariLibur.findUnique({
      // Prisma akan membandingkan bagian tanggal saja untuk tipe @db.Date
      where: { tanggal: dateUTC }, 
    });
    if (existing) {
      return NextResponse.json({ error: 'Tanggal libur sudah ada' }, { status: 409 });
    }

    const newHoliday = await prisma.hariLibur.create({
      data: {
        tanggal: dateUTC, // Simpan sebagai Date (UTC 00:00)
        keterangan: keterangan || null,
      },
    });

    return NextResponse.json(newHoliday, { status: 201 });
  } catch (error) {
    console.error('Error creating holiday:', error);
    // Periksa apakah error karena format tanggal salah saat create
     if (error instanceof Prisma.PrismaClientValidationError) {
         return NextResponse.json({ error: 'Format tanggal tidak valid.' }, { status: 400 });
     }
    return NextResponse.json({ error: 'Gagal menambah hari libur' }, { status: 500 });
  }
}