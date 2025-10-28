/*
  Warnings:

  - You are about to drop the column `apiStudentId` on the `Santri` table. All the data in the column will be lost.
  - Made the column `nis` on table `Santri` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "public"."Santri_apiStudentId_key";

-- AlterTable
ALTER TABLE "Santri" DROP COLUMN "apiStudentId",
ALTER COLUMN "nis" SET NOT NULL;
