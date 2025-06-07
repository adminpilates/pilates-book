/*
  Warnings:

  - Made the column `full_name` on table `bookings` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "bookings" ALTER COLUMN "full_name" SET NOT NULL;
