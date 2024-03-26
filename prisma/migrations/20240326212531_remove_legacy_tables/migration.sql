/*
  Warnings:

  - You are about to drop the `Leaderboard` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Update` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_LeaderboardToProject` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Leaderboard" DROP CONSTRAINT "Leaderboard_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Update" DROP CONSTRAINT "Update_projectId_fkey";

-- DropForeignKey
ALTER TABLE "_LeaderboardToProject" DROP CONSTRAINT "_LeaderboardToProject_A_fkey";

-- DropForeignKey
ALTER TABLE "_LeaderboardToProject" DROP CONSTRAINT "_LeaderboardToProject_B_fkey";

-- DropTable
DROP TABLE "Leaderboard";

-- DropTable
DROP TABLE "Project";

-- DropTable
DROP TABLE "Update";

-- DropTable
DROP TABLE "_LeaderboardToProject";
