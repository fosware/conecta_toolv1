-- CreateTable
CREATE TABLE "d_profiles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "first_lastname" TEXT NOT NULL,
    "second_lastname" TEXT,
    "phone" TEXT,
    "image_profile" TEXT,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "d_profiles_userId_key" ON "d_profiles"("userId");

-- AddForeignKey
ALTER TABLE "d_profiles" ADD CONSTRAINT "d_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
