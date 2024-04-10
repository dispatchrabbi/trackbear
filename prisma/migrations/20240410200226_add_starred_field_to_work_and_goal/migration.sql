-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "starred" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Work" ADD COLUMN     "starred" BOOLEAN NOT NULL DEFAULT false;
