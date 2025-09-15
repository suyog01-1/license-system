/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `License` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."License" DROP COLUMN "updatedAt",
ADD COLUMN     "resellerId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."License" ADD CONSTRAINT "License_resellerId_fkey" FOREIGN KEY ("resellerId") REFERENCES "public"."Reseller"("id") ON DELETE SET NULL ON UPDATE CASCADE;
