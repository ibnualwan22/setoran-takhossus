import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const prisma = new PrismaClient();

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session || !['ADMIN', 'STAF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Tidak diizinkan' }, { status: 403 });
  }

  console.log('Memulai sinkronisasi (NIS)...');

  try {
    const sigapApiUrl = 'https://sigap.amtsilatipusat.com/api/student?limit=10000';
    
    const response = await fetch(sigapApiUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 0 } 
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Gagal mengambil data dari API SIGAP' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const santriFromApi = data.data || [];

    const filteredSantri = santriFromApi.filter(
      (santri) =>
        santri.activeDormitory === 'TAKHOSSUS' && santri.gender === 'PUTRA'
    );

    console.log(`Data API diterima: ${santriFromApi.length}, Data difilter: ${filteredSantri.length}`);

    const activeNisList = filteredSantri.map((santri) => santri.nis);

    if (activeNisList.length > 0) {
      // 1. NON-AKTIFKAN (SOFT DELETE) SANTRI YANG BOYONG
      // (Logika ini sudah benar)
      await prisma.santri.updateMany({
        where: {
          nis: {
            notIn: activeNisList,
          },
        },
        data: {
          is_active: false,
        },
      });
    } else {
      console.warn('Tidak ada data santri terfilter. Proses soft-delete dilewati.');
    }

    // 2. BUAT BARU / UPDATE SANTRI YANG AKTIF
    const upsertOperations = filteredSantri.map((santri) => {
      return prisma.santri.upsert({
        where: { nis: santri.nis }, 
        update: {
          // Bagian 'update' (jika santri sudah ada)
          nama: santri.name,
          regency: santri.regency || null,
          // === PERBAIKAN: HAPUS BARIS INI ===
          // is_active: true,  <-- Ini adalah penyebab bug-nya.
          // Dengan menghapusnya, kita tidak akan menimpa
          // status 'is_active' yang sudah diatur manual.
        },
        create: {
          // Bagian 'create' (jika santri baru)
          nis: santri.nis,
          nama: santri.name,
          regency: santri.regency || null,
          is_active: true, // Santri baru otomatis aktif (ini benar)
        },
      });
    });

    if (upsertOperations.length > 0) {
      await prisma.$transaction(upsertOperations);
    }

    return NextResponse.json(
      {
        message: 'Sinkronisasi berhasil',
        totalDiambil: santriFromApi.length,
        totalDifilter: filteredSantri.length,
        totalDisimpan: upsertOperations.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error during santri sync:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat sinkronisasi' },
      { status: 500 }
    );
  }
}