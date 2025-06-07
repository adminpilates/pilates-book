/*
  Warnings:

  - You are about to drop the column `first_name` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `bookings` table. All the data in the column will be lost.
  - Added the required column `full_name` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "full_name" TEXT;

UPDATE "bookings"
SET "full_name" = "first_name" || ' ' || "last_name";

ALTER TABLE "bookings" DROP COLUMN "first_name";
ALTER TABLE "bookings" DROP COLUMN "last_name";
