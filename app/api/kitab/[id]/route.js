import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// === PUT /api/kitab/[id] - Untuk MENGUPDATE Kitab ===
export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const kitabIdToUpdate = parseInt(id);

  // 1. Cek Sesi dan Peran
  if (!session || !['ADMIN', 'STAF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { namaKitab } = await req.json();

    // 2. Validasi
    if (!namaKitab) {
      return NextResponse.json(
        { error: 'Nama kitab wajib diisi' },
        { status: 400 }
      );
    }

    // 3. Update data
    const updatedKitab = await prisma.kitab.update({
      where: { id: kitabIdToUpdate },
      data: { namaKitab: namaKitab },
    });

    return NextResponse.json(updatedKitab, { status: 200 });
  } catch (error) {
    // Cek jika error karena duplikat
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Nama kitab tersebut sudah ada' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// === DELETE /api/kitab/[id] - Untuk MENGHAPUS Kitab ===
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const kitabIdToDelete = parseInt(id);

  // 1. Cek Sesi dan Peran
  if (!session || !['ADMIN', 'STAF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    // 2. Hapus data
    await prisma.kitab.delete({
      where: { id: kitabIdToDelete },
    });

    return NextResponse.json(
      { message: 'Kitab berhasil dihapus' },
      { status: 200 }
    );
  } catch (error) {
    // Cek jika error karena datanya dipakai di tabel 'Setoran'
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Gagal menghapus: Kitab ini sudah dipakai di riwayat setoran.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}