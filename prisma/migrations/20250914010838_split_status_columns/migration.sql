/*
  Warnings:

  - You are about to drop the column `status` on the `License` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."License" DROP COLUMN "status",
ADD COLUMN     "expired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "revoked" BOOLEAN NOT NULL DEFAULT false;
