/*
  Warnings:

  - You are about to drop the column `previousEmail` on the `PendingEmailVerification` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PendingEmailVerification" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "newEmail" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PendingEmailVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PendingEmailVerification" ("createdAt", "expiresAt", "newEmail", "updatedAt", "userId", "uuid") SELECT "createdAt", "expiresAt", "newEmail", "updatedAt", "userId", "uuid" FROM "PendingEmailVerification";
DROP TABLE "PendingEmailVerification";
ALTER TABLE "new_PendingEmailVerification" RENAME TO "PendingEmailVerification";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
