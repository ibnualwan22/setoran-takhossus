import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// PUT /api/izin-panjang/[id]
export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  if (!session || !['ADMIN', 'STAF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { tanggalMulai, tanggalSelesai, jenisIzin, keterangan } = body;

    if (!tanggalMulai || !tanggalSelesai || !jenisIzin) {
      return NextResponse.json({ error: 'Field wajib diisi' }, { status: 400 });
    }

    const startDate = new Date(tanggalMulai + 'T00:00:00Z');
    const endDate = new Date(tanggalSelesai + 'T00:00:00Z');

    if (endDate < startDate) {
      return NextResponse.json({ error: 'Tanggal selesai tidak boleh sebelum tanggal mulai' }, { status: 400 });
    }

    const updatedIzin = await prisma.izinJangkaPanjang.update({
      where: { id: parseInt(id) },
      data: {
        tanggalMulai: startDate,
        tanggalSelesai: endDate,
        jenisIzin: jenisIzin,
        keterangan: keterangan || '',
      },
       include: {
         santri: { select: { nama: true } }
      }
    });

    return NextResponse.json(updatedIzin, { status: 200 });
  } catch (error) {
    if (error.code === 'P2025') {
       return NextResponse.json({ error: 'Catatan izin tidak ditemukan' }, { status: 404 });
    }
    console.error('Error updating long-term izin:', error);
    return NextResponse.json({ error: 'Gagal memperbarui izin' }, { status: 500 });
  }
}

// DELETE /api/izin-panjang/[id]
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  if (!session || !['ADMIN', 'STAF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    await prisma.izinJangkaPanjang.delete({
      where: { id: parseInt(id) },
    });
    return NextResponse.json({ message: 'Izin berhasil dihapus' }, { status: 200 });
  } catch (error) {
    if (error.code === 'P2025') {
       return NextResponse.json({ error: 'Catatan izin tidak ditemukan' }, { status: 404 });
    }
    console.error('Error deleting long-term izin:', error);
    return NextResponse.json({ error: 'Gagal menghapus izin' }, { status: 500 });
  }
}