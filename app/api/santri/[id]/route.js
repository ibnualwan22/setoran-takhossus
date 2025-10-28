import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// === PUT /api/santri/[id] - (UPDATE Penyimak ATAU Status Aktif) ===
export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const santriIdToUpdate = parseInt(id);

  if (!session || !['ADMIN', 'STAF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { penyimakId, is_active } = body;

    // Siapkan data untuk di-update
    const dataToUpdate = {};

    // 1. Cek apakah permintaan ini untuk update 'penyimakId'
    // 'penyimakId' bisa undefined (jika hanya update status)
    // 'penyimakId' bisa null (jika di-set "Belum di-assign")
    if (body.hasOwnProperty('penyimakId')) {
      dataToUpdate.penyimakId = penyimakId ? parseInt(penyimakId) : null;
    }

    // 2. Cek apakah permintaan ini untuk update 'is_active'
    if (body.hasOwnProperty('is_active')) {
      dataToUpdate.is_active = is_active;
    }

    // 3. Jika tidak ada data, return error
    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada data untuk diupdate' },
        { status: 400 }
      );
    }

    // 4. Update data santri
    const updatedSantri = await prisma.santri.update({
      where: { id: santriIdToUpdate },
      data: dataToUpdate,
      include: {
        penyimak: true, // Kirim balik data penyimak yang baru
      },
    });

    return NextResponse.json(updatedSantri, { status: 200 });
  } catch (error) {
    console.error('Error updating santri:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}