-- AlterTable
ALTER TABLE "_BoardParticipantToTag" ADD CONSTRAINT "_BoardParticipantToTag_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_BoardParticipantToTag_AB_unique";

-- AlterTable
ALTER TABLE "_BoardParticipantToWork" ADD CONSTRAINT "_BoardParticipantToWork_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_BoardParticipantToWork_AB_unique";

-- AlterTable
ALTER TABLE "_GoalToTag" ADD CONSTRAINT "_GoalToTag_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_GoalToTag_AB_unique";

-- AlterTable
ALTER TABLE "_GoalToWork" ADD CONSTRAINT "_GoalToWork_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_GoalToWork_AB_unique";

-- AlterTable
ALTER TABLE "_TagToTally" ADD CONSTRAINT "_TagToTally_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_TagToTally_AB_unique";
