/*
  Warnings:

  - Made the column `workId` on table `Tally` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Tally" ALTER COLUMN "workId" SET NOT NULL;
