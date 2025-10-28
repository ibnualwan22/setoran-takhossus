/*
  Warnings:

  - A unique constraint covering the columns `[nis]` on the table `Santri` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Santri" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "nis" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Santri_nis_key" ON "Santri"("nis");
