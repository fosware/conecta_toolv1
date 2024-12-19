-- CreateTable
CREATE TABLE "d_users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "image" TEXT,
    "phone" TEXT,
    "roles" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "d_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "c_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "d_users_email_key" ON "d_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "d_users_username_key" ON "d_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "c_roles_name_key" ON "c_roles"("name");
