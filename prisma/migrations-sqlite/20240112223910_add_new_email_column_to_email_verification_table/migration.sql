/*
  Warnings:

  - Added the required column `newEmail` to the `PendingEmailVerification` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PendingEmailVerification" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "previousEmail" TEXT,
    "newEmail" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PendingEmailVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PendingEmailVerification" ("createdAt", "expiresAt", "previousEmail", "newEmail", "updatedAt", "userId", "uuid")
  SELECT p."createdAt", p."expiresAt", p."previousEmail", u."email", p."updatedAt", p."userId", p."uuid"
    FROM "PendingEmailVerification" as p
    INNER JOIN "User" as u on p.userId = u.id;

DROP TABLE "PendingEmailVerification";
ALTER TABLE "new_PendingEmailVerification" RENAME TO "PendingEmailVerification";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
