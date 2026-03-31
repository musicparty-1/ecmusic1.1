-- CreateTable
CREATE TABLE "catalog_songs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "genre" TEXT DEFAULT 'General'
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_dj_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'DEMO',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'TRIAL',
    "subscriptionId" TEXT,
    "customerId" TEXT,
    "trialEndsAt" DATETIME,
    "planExpiresAt" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_dj_users" ("created_at", "email", "id", "password") SELECT "created_at", "email", "id", "password" FROM "dj_users";
DROP TABLE "dj_users";
ALTER TABLE "new_dj_users" RENAME TO "dj_users";
CREATE UNIQUE INDEX "dj_users_email_key" ON "dj_users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
