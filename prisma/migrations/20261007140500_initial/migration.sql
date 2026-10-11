CREATE TABLE "User" ("id" TEXT NOT NULL PRIMARY KEY, "email" TEXT NOT NULL, "name" TEXT NOT NULL, "passwordHash" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "Session" ("tokenHash" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "expiresAt" DATETIME NOT NULL, CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE TABLE "LoginLimit" ("key" TEXT NOT NULL PRIMARY KEY, "count" INTEGER NOT NULL, "expiresAt" DATETIME NOT NULL);
CREATE TABLE "StoredObject" ("key" TEXT NOT NULL PRIMARY KEY, "data" BLOB NOT NULL, "contentType" TEXT, "customMetadata" TEXT, "updatedAt" DATETIME NOT NULL);
