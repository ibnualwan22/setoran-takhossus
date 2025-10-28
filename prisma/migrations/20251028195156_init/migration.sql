-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAF', 'PENCATAT');

-- CreateEnum
CREATE TYPE "KategoriKitab" AS ENUM ('MUKHOTIM');

-- CreateEnum
CREATE TYPE "KategoriSetoran" AS ENUM ('WAJIB', 'MUKHOTIM');

-- CreateEnum
CREATE TYPE "JenisIzin" AS ENUM ('SAKIT', 'PULANG', 'LAINNYA');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PENCATAT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Penyimak" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Penyimak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Santri" (
    "id" SERIAL NOT NULL,
    "apiStudentId" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "regency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "penyimakId" INTEGER,

    CONSTRAINT "Santri_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kitab" (
    "id" SERIAL NOT NULL,
    "namaKitab" TEXT NOT NULL,
    "kategori" "KategoriKitab" NOT NULL DEFAULT 'MUKHOTIM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Kitab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setoran" (
    "id" SERIAL NOT NULL,
    "kategori" "KategoriSetoran" NOT NULL,
    "halamanDari" TEXT,
    "halamanSampai" TEXT,
    "barisKe" TEXT,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "santriId" INTEGER NOT NULL,
    "pencatatId" INTEGER NOT NULL,
    "kitabId" INTEGER,

    CONSTRAINT "Setoran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Izin" (
    "id" SERIAL NOT NULL,
    "jenisIzin" "JenisIzin" NOT NULL,
    "keterangan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "santriId" INTEGER NOT NULL,
    "pencatatId" INTEGER NOT NULL,

    CONSTRAINT "Izin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HariLibur" (
    "id" SERIAL NOT NULL,
    "tanggal" DATE NOT NULL,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HariLibur_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Penyimak_userId_key" ON "Penyimak"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Santri_apiStudentId_key" ON "Santri"("apiStudentId");

-- CreateIndex
CREATE UNIQUE INDEX "Kitab_namaKitab_key" ON "Kitab"("namaKitab");

-- CreateIndex
CREATE UNIQUE INDEX "HariLibur_tanggal_key" ON "HariLibur"("tanggal");

-- AddForeignKey
ALTER TABLE "Penyimak" ADD CONSTRAINT "Penyimak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Santri" ADD CONSTRAINT "Santri_penyimakId_fkey" FOREIGN KEY ("penyimakId") REFERENCES "Penyimak"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setoran" ADD CONSTRAINT "Setoran_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "Santri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setoran" ADD CONSTRAINT "Setoran_pencatatId_fkey" FOREIGN KEY ("pencatatId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Setoran" ADD CONSTRAINT "Setoran_kitabId_fkey" FOREIGN KEY ("kitabId") REFERENCES "Kitab"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Izin" ADD CONSTRAINT "Izin_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "Santri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Izin" ADD CONSTRAINT "Izin_pencatatId_fkey" FOREIGN KEY ("pencatatId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
