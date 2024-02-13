-- CreateTable
CREATE TABLE "Banner" (
    "uuid" TEXT NOT NULL PRIMARY KEY,
    "enabled" BOOLEAN NOT NULL,
    "showUntil" DATETIME NOT NULL,
    "message" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'info',
    "icon" TEXT NOT NULL DEFAULT 'campaign',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
