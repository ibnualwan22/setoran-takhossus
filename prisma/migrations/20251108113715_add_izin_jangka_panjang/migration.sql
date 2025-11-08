-- CreateTable
CREATE TABLE "IzinJangkaPanjang" (
    "id" SERIAL NOT NULL,
    "santriId" INTEGER NOT NULL,
    "tanggalMulai" DATE NOT NULL,
    "tanggalSelesai" DATE NOT NULL,
    "jenisIzin" "JenisIzin" NOT NULL,
    "keterangan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IzinJangkaPanjang_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IzinJangkaPanjang" ADD CONSTRAINT "IzinJangkaPanjang_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "Santri"("id") ON DELETE CASCADE ON UPDATE CASCADE;
