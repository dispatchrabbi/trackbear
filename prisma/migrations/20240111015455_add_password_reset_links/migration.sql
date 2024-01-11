-- CreateTable
CREATE TABLE "PasswordResetLink" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PasswordResetLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
