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
CREATE TABLE "c_specialties" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "num" INTEGER NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "c_specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_scopes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "num" INTEGER NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "specialtyId" INTEGER NOT NULL,

    CONSTRAINT "c_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "c_subscopes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "num" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "scopeId" INTEGER NOT NULL,

    CONSTRAINT "c_subscopes_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "c_location_states" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,

    CONSTRAINT "c_location_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d_associates" (
    "id" SERIAL NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "externalNumber" TEXT NOT NULL,
    "internalNumber" TEXT,
    "neighborhood" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "stateId" INTEGER NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "machineCount" INTEGER NOT NULL,
    "employeeCount" INTEGER NOT NULL,
    "shifts" TEXT,
    "achievementDescription" TEXT,
    "profile" TEXT,
    "nda" BYTEA,
    "companyLogo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_associates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rel_associate_certifications" (
    "id" SERIAL NOT NULL,
    "associateId" INTEGER NOT NULL,
    "certificationId" INTEGER NOT NULL,
    "certificationFile" BYTEA NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "rel_associate_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rel_associate_scopes" (
    "id" SERIAL NOT NULL,
    "associateId" INTEGER NOT NULL,
    "specialtyId" INTEGER NOT NULL,
    "scopeId" INTEGER NOT NULL,
    "subscopeId" INTEGER NOT NULL,
    "materials" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "rel_associate_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "d_users_email_key" ON "d_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "d_users_username_key" ON "d_users"("username");

-- CreateIndex
CREATE INDEX "d_users_isDeleted_isActive_idx" ON "d_users"("isDeleted", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "c_specialties_name_key" ON "c_specialties"("name");

-- CreateIndex
CREATE UNIQUE INDEX "c_specialties_num_key" ON "c_specialties"("num");

-- CreateIndex
CREATE INDEX "c_specialties_isDeleted_isActive_idx" ON "c_specialties"("isDeleted", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "c_scopes_name_key" ON "c_scopes"("name");

-- CreateIndex
CREATE INDEX "c_scopes_isDeleted_isActive_idx" ON "c_scopes"("isDeleted", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "c_subscopes_name_key" ON "c_subscopes"("name");

-- CreateIndex
CREATE INDEX "c_subscopes_isDeleted_isActive_idx" ON "c_subscopes"("isDeleted", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "c_certifications_name_key" ON "c_certifications"("name");

-- CreateIndex
CREATE INDEX "c_certifications_isDeleted_isActive_idx" ON "c_certifications"("isDeleted", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "d_profiles_userId_key" ON "d_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "c_roles_name_key" ON "c_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "r_role_privileges_roleId_privilegeId_key" ON "r_role_privileges"("roleId", "privilegeId");

-- CreateIndex
CREATE UNIQUE INDEX "c_privileges_name_key" ON "c_privileges"("name");

-- CreateIndex
CREATE UNIQUE INDEX "c_location_states_name_key" ON "c_location_states"("name");

-- CreateIndex
CREATE UNIQUE INDEX "d_associates_companyName_key" ON "d_associates"("companyName");

-- CreateIndex
CREATE UNIQUE INDEX "d_associates_email_key" ON "d_associates"("email");

-- CreateIndex
CREATE INDEX "d_associates_companyName_idx" ON "d_associates"("companyName");

-- CreateIndex
CREATE INDEX "d_associates_isDeleted_isActive_idx" ON "d_associates"("isDeleted", "isActive");

-- CreateIndex
CREATE INDEX "rel_associate_certifications_isDeleted_isActive_idx" ON "rel_associate_certifications"("isDeleted", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "rel_associate_certifications_associateId_certificationId_key" ON "rel_associate_certifications"("associateId", "certificationId");

-- CreateIndex
CREATE INDEX "rel_associate_scopes_isDeleted_isActive_idx" ON "rel_associate_scopes"("isDeleted", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "rel_associate_scopes_associateId_specialtyId_scopeId_subsco_key" ON "rel_associate_scopes"("associateId", "specialtyId", "scopeId", "subscopeId");

-- AddForeignKey
ALTER TABLE "d_users" ADD CONSTRAINT "d_users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "c_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_specialties" ADD CONSTRAINT "c_specialties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_scopes" ADD CONSTRAINT "c_scopes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_scopes" ADD CONSTRAINT "c_scopes_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "c_specialties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_subscopes" ADD CONSTRAINT "c_subscopes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_subscopes" ADD CONSTRAINT "c_subscopes_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "c_scopes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "c_certifications" ADD CONSTRAINT "c_certifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_profiles" ADD CONSTRAINT "d_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r_role_privileges" ADD CONSTRAINT "r_role_privileges_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "c_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "r_role_privileges" ADD CONSTRAINT "r_role_privileges_privilegeId_fkey" FOREIGN KEY ("privilegeId") REFERENCES "c_privileges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_associates" ADD CONSTRAINT "d_associates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_associates" ADD CONSTRAINT "d_associates_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "c_location_states"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rel_associate_certifications" ADD CONSTRAINT "rel_associate_certifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rel_associate_scopes" ADD CONSTRAINT "rel_associate_scopes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
