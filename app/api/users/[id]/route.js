import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

// === PUT /api/users/[id] - Untuk MENGUPDATE User ===
export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  const { id } = await params; // ID user yang akan di-update
  const userIdToUpdate = parseInt(id);

  // 1. Cek Sesi dan Peran
  if (!session || !['ADMIN', 'STAF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    const { nama, username, role, password } = await req.json();

    // 2. Cek user yang ditarget
    const userToUpdate = await prisma.user.findUnique({
      where: { id: userIdToUpdate },
    });
    if (!userToUpdate) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // 3. Validasi Keamanan Peran
    if (session.user.role === 'STAF' && userToUpdate.role !== 'PENCATAT') {
      return NextResponse.json(
        { error: 'Staf hanya dapat mengedit Pencatat' },
        { status: 403 }
      );
    }

    // 4. Persiapkan data untuk update
    const userDataToUpdate = {
      username,
      role,
    };
    // Jika ada password baru, hash dan tambahkan
    if (password) {
      userDataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const penyimakDataToUpdate = {
      nama,
    };

    // 5. Jalankan update dalam transaksi
    const [updatedUser, updatedPenyimak] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userIdToUpdate },
        data: userDataToUpdate,
      }),
      prisma.penyimak.update({
        where: { userId: userIdToUpdate },
        data: penyimakDataToUpdate,
      }),
    ]);

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// === DELETE /api/users/[id] - Untuk MENGHAPUS User ===
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  const { id } = await params; // ID user yang akan dihapus
  const userIdToDelete = parseInt(id);

  // 1. Cek Sesi dan Peran
  if (!session || !['ADMIN', 'STAF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  try {
    // 2. Cek user yang ditarget
    const userToDelete = await prisma.user.findUnique({
      where: { id: userIdToDelete },
    });
    if (!userToDelete) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // 3. Validasi Keamanan Peran
    if (session.user.role === 'STAF' && userToDelete.role !== 'PENCATAT') {
      return NextResponse.json(
        { error: 'Staf hanya dapat menghapus Pencatat' },
        { status: 403 }
      );
    }
    // Admin tidak bisa menghapus admin lain (untuk keamanan)
    if (userToDelete.role === 'ADMIN') {
        return NextResponse.json(
            { error: 'Tidak dapat menghapus sesama Admin' },
            { status: 403 }
          );
    }

    // 4. Jalankan hapus dalam transaksi
    // Kita harus hapus 'Penyimak' dulu, baru 'User'
    await prisma.$transaction([
      prisma.penyimak.deleteMany({
        where: { userId: userIdToDelete },
      }),
      prisma.user.delete({
        where: { id: userIdToDelete },
      }),
    ]);

    return NextResponse.json(
      { message: 'User berhasil dihapus' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    // Cek jika error karena foreign key constraint (sudah punya setoran)
    if (error.code === 'P2003') {
        return NextResponse.json(
            { error: 'Gagal menghapus: User ini sudah memiliki riwayat setoran/izin.' },
            { status: 409 }
          );
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}