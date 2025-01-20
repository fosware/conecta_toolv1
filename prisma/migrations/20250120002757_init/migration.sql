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
CREATE TABLE "d_specialties" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "num" INTEGER NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d_scopes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "num" INTEGER NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "specialtyId" INTEGER NOT NULL,

    CONSTRAINT "d_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d_subscopes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "num" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "scopeId" INTEGER NOT NULL,

    CONSTRAINT "d_subscopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_certifications" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "c_certifications_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "d_specialties_name_key" ON "d_specialties"("name");

-- CreateIndex
CREATE UNIQUE INDEX "d_specialties_num_key" ON "d_specialties"("num");

-- CreateIndex
CREATE UNIQUE INDEX "d_scopes_name_key" ON "d_scopes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "d_subscopes_name_key" ON "d_subscopes"("name");

-- CreateIndex
CREATE UNIQUE INDEX "c_certifications_name_key" ON "c_certifications"("name");

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
ALTER TABLE "d_specialties" ADD CONSTRAINT "d_specialties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_scopes" ADD CONSTRAINT "d_scopes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_scopes" ADD CONSTRAINT "d_scopes_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "d_specialties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_subscopes" ADD CONSTRAINT "d_subscopes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_subscopes" ADD CONSTRAINT "d_subscopes_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "d_scopes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_certifications" ADD CONSTRAINT "c_certifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_profiles" ADD CONSTRAINT "d_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r_role_privileges" ADD CONSTRAINT "r_role_privileges_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "c_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r_role_privileges" ADD CONSTRAINT "r_role_privileges_privilegeId_fkey" FOREIGN KEY ("privilegeId") REFERENCES "c_privileges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
