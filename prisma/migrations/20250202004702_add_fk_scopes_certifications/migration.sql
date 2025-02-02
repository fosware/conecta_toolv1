-- AddForeignKey
ALTER TABLE "rel_associate_certifications" ADD CONSTRAINT "rel_associate_certifications_certificationId_fkey" FOREIGN KEY ("certificationId") REFERENCES "c_certifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rel_associate_certifications" ADD CONSTRAINT "rel_associate_certifications_associateId_fkey" FOREIGN KEY ("associateId") REFERENCES "d_associates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rel_associate_scopes" ADD CONSTRAINT "rel_associate_scopes_associateId_fkey" FOREIGN KEY ("associateId") REFERENCES "d_associates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rel_associate_scopes" ADD CONSTRAINT "rel_associate_scopes_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "c_specialties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rel_associate_scopes" ADD CONSTRAINT "rel_associate_scopes_scopeId_fkey" FOREIGN KEY ("scopeId") REFERENCES "c_scopes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rel_associate_scopes" ADD CONSTRAINT "rel_associate_scopes_subscopeId_fkey" FOREIGN KEY ("subscopeId") REFERENCES "c_subscopes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
