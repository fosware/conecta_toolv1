DROP VIEW IF EXISTS v_companies_overview;

CREATE VIEW v_companies_overview AS (
    SELECT 
        c.id,
        c."comercialName" AS nombre_comercial,
        c."companyName" AS razon_social, 
        c."achievementDescription" AS logros,  
        c.profile AS semblanza,  
        c."contactName" AS contato_ventas,
        c."machineCount" AS maquinas_principales, 
        c."employeeCount" AS total_empleados, 
        c.phone AS telefono, 
        c.email AS correo, 
        c."shiftsProfileLink" AS liga_semblanza,
        c.website AS sitio_web,
        -- JSONB de certificaciones
        COALESCE(
            jsonb_agg(
                DISTINCT jsonb_build_object(
                    'certificacion', cc.name,
                    'fecha_vencimiento', rcc."expirationDate"
                )
            ) FILTER (WHERE cc.id IS NOT NULL), '[]'::jsonb
        ) AS certificaciones,
        -- JSONB de especialidades
        COALESCE(
            jsonb_agg(
                DISTINCT jsonb_build_object(
                    'especialidad', cs."name",
                    'alcance', cs2."name",
                    'subalcance', cs3."name",
                    'materials', rcs.materials,
                    'machineCapacity', rcs."machineCapacity"
                )
            ) FILTER (WHERE cs.id IS NOT NULL), '[]'::jsonb
        ) AS especialidades
    FROM public.d_companies c
    LEFT JOIN r_company_certifications rcc ON
        rcc."companyId" = c.id
        AND rcc."isDeleted" = false 
        AND rcc."isActive" = true
        AND rcc."expirationDate" < now()::date
    LEFT JOIN c_certifications cc ON
        cc.id = rcc."certificationId" 
        AND cc."isDeleted" = false 
        AND cc."isActive" = true
    LEFT JOIN r_company_specialties rcs ON
        rcs."companyId" = c.id
        AND rcs."isDeleted" = false 
        AND rcs."isActive" = true
    LEFT JOIN c_specialties cs ON
        cs.id = rcs."specialtyId" 
        AND cs."isDeleted" = false 
        AND cs."isActive"    
    LEFT JOIN c_scopes cs2 ON
        cs2.id = rcs."scopeId" 
        AND cs2."isDeleted" = false 
        AND cs2."isActive"     
    LEFT JOIN c_subscopes cs3 ON
        cs3.id = rcs."subscopeId" 
        AND cs3."isDeleted" = false 
        AND cs3."isActive"    
    WHERE c."isDeleted" = false 
    AND c."isActive" = true
    GROUP BY c.id
);