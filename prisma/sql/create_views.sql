DROP VIEW IF EXISTS v_companies_overview;

CREATE OR REPLACE VIEW v_companies_overview AS (
SELECT 
    c.id,
    c."comercialName" as nombre_comercial,
    c."companyName" as razon_social, 
    c."companyLogo" AS logo_empresa,
    c."achievementDescription" as logros,  
    c.profile as semblanza,  
    c."contactName" as contato_ventas,
    c."machineCount" as maquinas_principales, 
    c."employeeCount" as total_empleados, 
    c.phone as telefono, c.email as correo, 
    c."shiftsProfileLink" as liga_semblanza,
    c.website as sitio_web,
    -- certificaciones_jsonb    
    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                        'certificacion', COALESCE(cc."name",''),                   
                        'fecha_vencimiento', COALESCE(rcc."expirationDate"::text,'')
                    )
        ) FILTER (WHERE cc.id IS NOT NULL), '[]'::jsonb
    ) AS certificaciones,
    -- especialidades_jsonb   
    COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                        'especialidad', COALESCE(cs."name",''),                   
                        'alcance', COALESCE(cs2."name",''),
                        'subalcance', COALESCE(cs3."name",''),
                        'materiales', COALESCE(rcs.materials,''),
                        'capacidades_maquinas', COALESCE(rcs."machineCapacity",'')
                        
                    )
        ) FILTER (WHERE cs.id IS NOT NULL), '[]'::jsonb
    ) AS especialidades	
    FROM public.d_companies c
    LEFT OUTER JOIN r_company_certifications rcc ON
        rcc."companyId" = c.id
    AND rcc."isDeleted" = false AND rcc."isActive" = true
    --AND rcc."expirationDate" >= now()::date
    LEFT OUTER JOIN c_certifications cc ON
        cc.id = rcc."certificationId" 
    AND cc."isDeleted" = false AND cc."isActive" = true
    LEFT OUTER JOIN r_company_specialties rcs ON
        rcs."companyId" = c.id
    AND rcs."isDeleted" = false AND rcs."isActive" = true
    LEFT OUTER JOIN c_specialties cs on
        cs.id = rcs."specialtyId" 
    AND cs."isDeleted" = false AND cs."isActive"	
    LEFT OUTER JOIN c_scopes cs2 ON
        cs2.id = rcs."scopeId" 
    AND cs2."isDeleted" = false AND cs2."isActive" 	
    LEFT OUTER JOIN c_subscopes cs3 ON
        cs3.id = rcs."subscopeId" 
    AND cs3."isDeleted" = false AND cs3."isActive"	
    WHERE c."isDeleted" = false AND c."isActive" = true
    GROUP BY c.id 
);
