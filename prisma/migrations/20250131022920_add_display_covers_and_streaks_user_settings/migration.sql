-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "displayCovers" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "displayStreaks" BOOLEAN NOT NULL DEFAULT true;
