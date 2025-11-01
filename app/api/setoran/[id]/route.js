import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// === PUT /api/setoran/[id] - Untuk MENGUPDATE Setoran ===
export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const setoranId = parseInt(id);

  if (!session || !['ADMIN', 'STAF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const body = await req.json();
    // Ambil field yang boleh diubah
    const { kitabId, halamanDari, halamanSampai, barisKe, keterangan } = body;

    // Validasi sederhana (bisa diperketat)
    // Misalnya, pastikan kitabId hanya ada jika kategori Mukhotim
    const setoranToUpdate = await prisma.setoran.findUnique({ where: { id: setoranId }});
    if (!setoranToUpdate) return NextResponse.json({ error: 'Setoran tidak ditemukan' }, { status: 404 });

    const dataToUpdate = {
        kitabId: setoranToUpdate.kategori === 'MUKHOTIM' ? (kitabId ? parseInt(kitabId) : null) : null,
        halamanDari,
        halamanSampai, // Perhatikan typo 'halamansampai' -> 'halamanSampai'
        barisKe,
        keterangan,
    };

    const updatedSetoran = await prisma.setoran.update({
      where: { id: setoranId },
      data: dataToUpdate,
      include: { // Kirim data lengkap untuk update UI
          santri: { select: { nama: true } },
          pencatat: { select: { username: true } },
          kitab: { select: { namaKitab: true } },
      }
    });

    return NextResponse.json(updatedSetoran, { status: 200 });
  } catch (error) {
    console.error('Error updating setoran:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}

// === DELETE /api/setoran/[id] - Untuk MENGHAPUS Setoran ===
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const setoranId = parseInt(id);

  if (!session || !['ADMIN', 'STAF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    await prisma.setoran.delete({
      where: { id: setoranId },
    });
    return NextResponse.json({ message: 'Setoran berhasil dihapus' }, { status: 200 });
  } catch (error) {
     // Handle jika data tidak ditemukan
     if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Setoran tidak ditemukan' }, { status: 404 });
    }
    console.error('Error deleting setoran:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}