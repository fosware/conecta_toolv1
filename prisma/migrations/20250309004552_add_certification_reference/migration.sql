-- AddForeignKey
ALTER TABLE "d_project_request_certifications" ADD CONSTRAINT "d_project_request_certifications_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "c_certifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
