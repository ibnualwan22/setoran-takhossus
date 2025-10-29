import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// === PUT /api/izin/[id] - Untuk MENGUPDATE Izin ===
export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const izinId = parseInt(id);

  if (!session || !['ADMIN', 'STAF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { jenisIzin, keterangan } = await req.json();

    if (!jenisIzin || !keterangan) {
      return NextResponse.json({ error: 'Jenis Izin dan Keterangan wajib diisi' }, { status: 400 });
    }

    const updatedIzin = await prisma.izin.update({
      where: { id: izinId },
      data: { jenisIzin, keterangan },
       include: { // Kirim data lengkap untuk update UI
          santri: { select: { nama: true } },
          pencatat: { select: { username: true } },
      }
    });

    return NextResponse.json(updatedIzin, { status: 200 });
  } catch (error) {
     if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Izin tidak ditemukan' }, { status: 404 });
    }
    console.error('Error updating izin:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

// === DELETE /api/izin/[id] - Untuk MENGHAPUS Izin ===
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const izinId = parseInt(id);

  if (!session || !['ADMIN', 'STAF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    await prisma.izin.delete({
      where: { id: izinId },
    });
    return NextResponse.json({ message: 'Izin berhasil dihapus' }, { status: 200 });
  } catch (error) {
     if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Izin tidak ditemukan' }, { status: 404 });
    }
    console.error('Error deleting izin:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}