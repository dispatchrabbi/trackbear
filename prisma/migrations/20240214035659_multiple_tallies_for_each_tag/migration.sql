/*
  Warnings:

  - You are about to drop the column `tallyId` on the `Tag` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_tallyId_fkey";

-- AlterTable
ALTER TABLE "Tag" DROP COLUMN "tallyId";

-- CreateTable
CREATE TABLE "_TagToTally" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_TagToTally_AB_unique" ON "_TagToTally"("A", "B");

-- CreateIndex
CREATE INDEX "_TagToTally_B_index" ON "_TagToTally"("B");

-- AddForeignKey
ALTER TABLE "_TagToTally" ADD CONSTRAINT "_TagToTally_A_fkey" FOREIGN KEY ("A") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TagToTally" ADD CONSTRAINT "_TagToTally_B_fkey" FOREIGN KEY ("B") REFERENCES "Tally"("id") ON DELETE CASCADE ON UPDATE CASCADE;
