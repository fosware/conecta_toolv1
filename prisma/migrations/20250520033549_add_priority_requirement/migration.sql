-- AlterTable
ALTER TABLE "d_project_request_companies" ADD COLUMN     "projectId" INTEGER;

-- AlterTable
ALTER TABLE "d_project_requirements" ADD COLUMN     "priority" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "d_project_status" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_project_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d_proyects" (
    "id" SERIAL NOT NULL,
    "id_company" TEXT NOT NULL,
    "id_project_request" TEXT,
    "project_status" BOOLEAN NOT NULL DEFAULT true,
    "project_observations" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_proyects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d_project_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_project_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d_project_category_activity_status" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_project_category_activity_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d_project_category_activities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectCategoryId" INTEGER NOT NULL,
    "dateTentativeStart" TIMESTAMP(3),
    "dateTentativeEnd" TIMESTAMP(3),
    "observations" TEXT,
    "activityStatusId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "dateDeleted" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "projectStatusId" INTEGER,

    CONSTRAINT "d_project_category_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "d_project_logs" (
    "id" SERIAL NOT NULL,
    "projectCategoryId" INTEGER NOT NULL,
    "dateTimeMessage" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "d_project_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "d_project_status_name_key" ON "d_project_status"("name");

-- CreateIndex
CREATE UNIQUE INDEX "d_proyects_id_company_key" ON "d_proyects"("id_company");

-- CreateIndex
CREATE UNIQUE INDEX "d_project_categories_name_key" ON "d_project_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "d_project_category_activity_status_name_key" ON "d_project_category_activity_status"("name");

-- CreateIndex
CREATE UNIQUE INDEX "d_project_category_activities_name_key" ON "d_project_category_activities"("name");

-- AddForeignKey
ALTER TABLE "d_project_request_companies" ADD CONSTRAINT "d_project_request_companies_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "d_proyects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_status" ADD CONSTRAINT "d_project_status_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_proyects" ADD CONSTRAINT "d_proyects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_categories" ADD CONSTRAINT "d_project_categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_category_activity_status" ADD CONSTRAINT "d_project_category_activity_status_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_category_activities" ADD CONSTRAINT "d_project_category_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_category_activities" ADD CONSTRAINT "d_project_category_activities_activityStatusId_fkey" FOREIGN KEY ("activityStatusId") REFERENCES "d_project_category_activity_status"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_category_activities" ADD CONSTRAINT "d_project_category_activities_projectCategoryId_fkey" FOREIGN KEY ("projectCategoryId") REFERENCES "d_project_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_category_activities" ADD CONSTRAINT "d_project_category_activities_projectStatusId_fkey" FOREIGN KEY ("projectStatusId") REFERENCES "d_project_status"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_logs" ADD CONSTRAINT "d_project_logs_projectCategoryId_fkey" FOREIGN KEY ("projectCategoryId") REFERENCES "d_project_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "d_project_logs" ADD CONSTRAINT "d_project_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "d_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
