-- CreateTable
CREATE TABLE "d_users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "d_users_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "c_roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "c_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "r_role_privileges" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "privilegeId" INTEGER NOT NULL,

    CONSTRAINT "r_role_privileges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_privileges" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "c_privileges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "d_users_email_key" ON "d_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "d_users_username_key" ON "d_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "d_profiles_userId_key" ON "d_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "c_roles_name_key" ON "c_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "r_role_privileges_roleId_privilegeId_key" ON "r_role_privileges"("roleId", "privilegeId");

-- CreateIndex
CREATE UNIQUE INDEX "c_privileges_name_key" ON "c_privileges"("name");

-- AddForeignKey
ALTER TABLE "d_users" ADD CONSTRAINT "d_users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "c_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_profiles" ADD CONSTRAINT "d_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r_role_privileges" ADD CONSTRAINT "r_role_privileges_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "c_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r_role_privileges" ADD CONSTRAINT "r_role_privileges_privilegeId_fkey" FOREIGN KEY ("privilegeId") REFERENCES "c_privileges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
