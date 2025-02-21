/*
  Warnings:

  - You are about to drop the `v_company_profile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "v_company_profile";

-- CreateTable
CREATE TABLE "c_proyect_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "c_proyect_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_clients" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "cat_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d_projects" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "proyectTypeId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "drawRequest" BYTEA,
    "specialRequest" BOOLEAN,
    "descriptionSpecialRequest" TEXT,
    "generalDescription" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d_quotes" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "c_proyect_types_isDeleted_isActive_idx" ON "c_proyect_types"("isDeleted", "isActive");

-- CreateIndex
CREATE INDEX "cat_clients_isDeleted_isActive_idx" ON "cat_clients"("isDeleted", "isActive");

-- CreateIndex
CREATE INDEX "d_projects_isDeleted_isActive_idx" ON "d_projects"("isDeleted", "isActive");

-- CreateIndex
CREATE INDEX "d_quotes_isDeleted_isActive_idx" ON "d_quotes"("isDeleted", "isActive");

-- AddForeignKey
ALTER TABLE "c_proyect_types" ADD CONSTRAINT "c_proyect_types_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cat_clients" ADD CONSTRAINT "cat_clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_projects" ADD CONSTRAINT "d_projects_proyectTypeId_fkey" FOREIGN KEY ("proyectTypeId") REFERENCES "c_proyect_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_projects" ADD CONSTRAINT "d_projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "cat_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_projects" ADD CONSTRAINT "d_projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_quotes" ADD CONSTRAINT "d_quotes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_quotes" ADD CONSTRAINT "d_quotes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "d_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_quotes" ADD CONSTRAINT "d_quotes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "d_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
