import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// DELETE /api/holidays/[id] - Menghapus hari libur
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const holidayId = parseInt(id);

  if (!session || !['ADMIN', 'STAF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    await prisma.hariLibur.delete({
      where: { id: holidayId },
    });
    return NextResponse.json({ message: 'Hari libur berhasil dihapus' }, { status: 200 });
  } catch (error) {
     if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Hari libur tidak ditemukan' }, { status: 404 });
    }
    console.error('Error deleting holiday:', error);
    return NextResponse.json({ error: 'Gagal menghapus hari libur' }, { status: 500 });
  }
}