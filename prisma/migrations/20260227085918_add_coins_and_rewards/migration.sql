-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "boardState" TEXT NOT NULL DEFAULT '[]',
    "currentRow" INTEGER NOT NULL DEFAULT 0,
    "gameStatus" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "lastPlayedDate" TEXT NOT NULL,
    "rewardState" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "GameState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GameState" ("boardState", "currentRow", "gameStatus", "id", "lastPlayedDate", "userId") SELECT "boardState", "currentRow", "gameStatus", "id", "lastPlayedDate", "userId" FROM "GameState";
DROP TABLE "GameState";
ALTER TABLE "new_GameState" RENAME TO "GameState";
CREATE UNIQUE INDEX "GameState_userId_key" ON "GameState"("userId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "coins" INTEGER NOT NULL DEFAULT 300
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "password") SELECT "createdAt", "email", "id", "name", "password" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
