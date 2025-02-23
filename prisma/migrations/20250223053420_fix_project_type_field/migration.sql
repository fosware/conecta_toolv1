-- AddForeignKey
ALTER TABLE "d_projects" ADD CONSTRAINT "d_projects_clientAreaId_fkey" FOREIGN KEY ("clientAreaId") REFERENCES "c_client_areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
