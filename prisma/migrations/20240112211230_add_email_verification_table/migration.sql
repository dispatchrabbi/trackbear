-- CreateTable
CREATE TABLE "PendingEmailVerification" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "previousEmail" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PendingEmailVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Update" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Update_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Update" ("createdAt", "date", "id", "projectId", "updatedAt", "value") SELECT "createdAt", "date", "id", "projectId", "updatedAt", "value" FROM "Update";
DROP TABLE "Update";
ALTER TABLE "new_Update" RENAME TO "Update";
CREATE TABLE "new_Leaderboard" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "goal" INTEGER,
    "startDate" TEXT,
    "endDate" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Leaderboard_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Leaderboard" ("createdAt", "endDate", "goal", "id", "ownerId", "startDate", "state", "title", "type", "updatedAt", "uuid") SELECT "createdAt", "endDate", "goal", "id", "ownerId", "startDate", "state", "title", "type", "updatedAt", "uuid" FROM "Leaderboard";
DROP TABLE "Leaderboard";
ALTER TABLE "new_Leaderboard" RENAME TO "Leaderboard";
CREATE UNIQUE INDEX "Leaderboard_uuid_key" ON "Leaderboard"("uuid");
CREATE TABLE "new_Project" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "goal" INTEGER,
    "startDate" TEXT,
    "endDate" TEXT,
    "visibility" TEXT NOT NULL,
    "starred" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("createdAt", "endDate", "goal", "id", "ownerId", "starred", "startDate", "state", "title", "type", "updatedAt", "uuid", "visibility") SELECT "createdAt", "endDate", "goal", "id", "ownerId", "starred", "startDate", "state", "title", "type", "updatedAt", "uuid", "visibility" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_uuid_key" ON "Project"("uuid");
CREATE TABLE "new_UserAuth" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "password" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserAuth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserAuth" ("createdAt", "id", "password", "salt", "updatedAt", "userId") SELECT "createdAt", "id", "password", "salt", "updatedAt", "userId" FROM "UserAuth";
DROP TABLE "UserAuth";
ALTER TABLE "new_UserAuth" RENAME TO "UserAuth";
CREATE UNIQUE INDEX "UserAuth_userId_key" ON "UserAuth"("userId");
CREATE TABLE "new_PasswordResetLink" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PasswordResetLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PasswordResetLink" ("createdAt", "expiresAt", "state", "updatedAt", "userId", "uuid") SELECT "createdAt", "expiresAt", "state", "updatedAt", "userId", "uuid" FROM "PasswordResetLink";
DROP TABLE "PasswordResetLink";
ALTER TABLE "new_PasswordResetLink" RENAME TO "PasswordResetLink";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
