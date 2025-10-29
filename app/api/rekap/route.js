import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getWIBDate } from '@/utils/wibUtils'; // Kita akan buat file helper ini

const prisma = new PrismaClient();

// GET /api/rekap?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&santriId=...&type=...
export async function GET(req) {
  const session = await getServerSession(authOptions);

  // 1. Cek Sesi dan Peran (Hanya Admin/Staf)
  if (!session || !['ADMIN', 'STAF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const santriIdParam = searchParams.get('santriId');
    const typeParam = searchParams.get('type'); // 'SEMUA', 'WAJIB', 'MUKHOTIM', 'IZIN'

    // 2. Validasi & Siapkan Filter Tanggal
    if (!startDateParam || !endDateParam) {
      return NextResponse.json({ error: 'Parameter startDate dan endDate wajib ada' }, { status: 400 });
    }
    // Konversi YYYY-MM-DD ke objek Date WIB
    const startDate = getWIBDate(startDateParam); // Jam 00:00 WIB
    const endDate = getWIBDate(endDateParam, true); // Jam 23:59:59 WIB

    // 3. Siapkan Filter Lainnya
    const santriId = santriIdParam ? parseInt(santriIdParam) : null;
    const type = typeParam || 'SEMUA';

    // 4. Ambil Data (Setoran dan/atau Izin)
    let setoranData = [];
    let izinData = [];

    const includeRelations = {
      santri: { select: { nama: true } },
      pencatat: { select: { username: true } }, // Siapa yang input
      kitab: { select: { namaKitab: true } }, // Untuk Mukhotim
    };

    const commonWhere = {
      createdAt: { gte: startDate, lte: endDate },
      ...(santriId && { santriId: santriId }), // Tambahkan jika santriId ada
    };

    if (type === 'SEMUA' || type === 'WAJIB' || type === 'MUKHOTIM') {
      let setoranWhere = { ...commonWhere };
      if (type === 'WAJIB') setoranWhere.kategori = 'WAJIB';
      if (type === 'MUKHOTIM') setoranWhere.kategori = 'MUKHOTIM';

      setoranData = await prisma.setoran.findMany({
        where: setoranWhere,
        include: includeRelations,
        orderBy: { createdAt: 'desc' },
      });
    }

    if (type === 'SEMUA' || type === 'IZIN') {
      izinData = await prisma.izin.findMany({
        where: commonWhere,
        include: {
          santri: { select: { nama: true } },
          pencatat: { select: { username: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // 5. Gabungkan dan Format Data
    const combinedData = [
      ...setoranData.map(s => ({ ...s, dataType: s.kategori })), // Tambah 'dataType'
      ...izinData.map(i => ({ ...i, dataType: 'IZIN' })),
    ].sort((a, b) => b.createdAt - a.createdAt); // Urutkan lagi berdasarkan waktu

    return NextResponse.json(combinedData, { status: 200 });

  } catch (error) {
    console.error('Error fetching rekap data:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}