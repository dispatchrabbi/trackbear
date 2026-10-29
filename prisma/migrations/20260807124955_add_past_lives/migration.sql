-- AlterTable
ALTER TABLE "User" ADD COLUMN     "futureLifeId" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_futureLifeId_fkey" FOREIGN KEY ("futureLifeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
