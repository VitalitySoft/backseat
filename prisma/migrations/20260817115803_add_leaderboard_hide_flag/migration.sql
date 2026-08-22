-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RiderProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "vehicleMake" TEXT NOT NULL,
    "vehicleModel" TEXT NOT NULL,
    "vehiclePlate" TEXT NOT NULL,
    "seatsAvailable" INTEGER NOT NULL DEFAULT 1,
    "isVehicleVerified" BOOLEAN NOT NULL DEFAULT false,
    "isSharingActive" BOOLEAN NOT NULL DEFAULT false,
    "hiddenFromLeaderboard" BOOLEAN NOT NULL DEFAULT false,
    "charityCode" TEXT NOT NULL,
    "bio" TEXT,
    "memberSince" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RiderProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_RiderProfile" ("bio", "charityCode", "id", "isSharingActive", "isVehicleVerified", "memberSince", "seatsAvailable", "userId", "vehicleMake", "vehicleModel", "vehiclePlate", "vehicleType") SELECT "bio", "charityCode", "id", "isSharingActive", "isVehicleVerified", "memberSince", "seatsAvailable", "userId", "vehicleMake", "vehicleModel", "vehiclePlate", "vehicleType" FROM "RiderProfile";
DROP TABLE "RiderProfile";
ALTER TABLE "new_RiderProfile" RENAME TO "RiderProfile";
CREATE UNIQUE INDEX "RiderProfile_userId_key" ON "RiderProfile"("userId");
CREATE UNIQUE INDEX "RiderProfile_charityCode_key" ON "RiderProfile"("charityCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
