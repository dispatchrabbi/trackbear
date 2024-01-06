-- Populate UserAuth
INSERT OR IGNORE INTO "UserAuth" (`userId`, `password`, `salt`, `createdAt`, `updatedAt`)
    SELECT `id`, `password`, `salt`, strftime("%s"), strftime("%s") FROM "User" WHERE true
;
