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




--- Rep1--------------------------------------
CREATE OR REPLACE VIEW v_quotation_summary AS
WITH company_quotation_stats AS (
    -- Calcular estadísticas de cotización por empresa
    SELECT 
        c.id AS company_id,
        c."companyName" AS company_name,
        c."comercialName" AS commercial_name,
        COUNT(DISTINCT prc.id) AS invitaciones_para_cotizar,
        COUNT(DISTINCT CASE WHEN prq.id IS NOT NULL THEN prc.id END) AS cotizaciones_recibidas,
        ROUND(COUNT(DISTINCT CASE WHEN prq.id IS NOT NULL THEN prc.id END)::numeric / 
              NULLIF(COUNT(DISTINCT prc.id), 0)::numeric * 100, 2) AS tasa_de_respuesta,
        COUNT(DISTINCT CASE WHEN prq.id IS NOT NULL AND prq."isActive" = true THEN prc.id END) AS cotizaciones_validas,
        ROUND(COUNT(DISTINCT CASE WHEN prq.id IS NOT NULL AND prq."isActive" = true THEN prc.id END)::numeric / 
              NULLIF(COUNT(DISTINCT CASE WHEN prq.id IS NOT NULL THEN prc.id END), 0)::numeric * 100, 2) AS tasa_cotizaciones_validas
    FROM 
        d_companies c
    LEFT JOIN 
        d_project_request_companies prc ON c.id = prc."companyId" AND prc."isDeleted" = false
    LEFT JOIN 
        d_project_request_quotations prq ON prc.id = prq."projectRequestCompanyId" AND prq."isDeleted" = false
    WHERE 
        c."isDeleted" = false
    GROUP BY 
        c.id, c."companyName", c."comercialName"
)
SELECT 
    COALESCE(commercial_name, company_name) AS "Asociado",
    invitaciones_para_cotizar AS "Invitaciones para Cotizar",
    cotizaciones_recibidas AS "Cotizaciones recibidas",
    tasa_de_respuesta AS "Tasa de respuesta",
    cotizaciones_validas AS "Cotizaciones Válidas",
    tasa_cotizaciones_validas AS "Tasa cotizaciones válidas"
FROM 
    company_quotation_stats
ORDER BY 
    "Asociado";

select * from public.v_quotation_summary;
------------------------------------------------

-- REP2
CREATE OR REPLACE VIEW v_quotations_vs_projects AS
WITH company_project_stats AS (
    -- Calcular estadísticas de cotización y proyecto por empresa
    SELECT 
        c.id AS company_id,
        c."companyName" AS company_name,
        c."comercialName" AS commercial_name,
        COUNT(DISTINCT CASE WHEN prq.id IS NOT NULL AND prq."isActive" = true THEN prc.id END) AS cotizaciones_validas,
        COUNT(DISTINCT CASE WHEN p.id IS NOT NULL THEN p.id END) AS proyectos_asignados,
        ROUND(COUNT(DISTINCT CASE WHEN p.id IS NOT NULL THEN p.id END)::numeric / 
              NULLIF(COUNT(DISTINCT CASE WHEN prq.id IS NOT NULL AND prq."isActive" = true THEN prc.id END), 0)::numeric * 100, 2) AS tasa_exito,
        -- Para entregas a tiempo, usamos el estado del proyecto y la fecha estimada
        ROUND(AVG(CASE WHEN p.id IS NOT NULL THEN 
            CASE WHEN p."projectStatusId" = 3 -- Asumiendo que 3 es el estado "Completado"
                 THEN CASE WHEN p."updatedAt" <= qs."estimatedDeliveryDate" THEN 100 ELSE 0 END
                 ELSE NULL
            END
            ELSE NULL END), 2) AS entrega_a_tiempo,
        -- Tiempo de respuesta en días
        ROUND(AVG(CASE WHEN prq.id IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (prq."createdAt" - pr."requestDate"))/86400 
            ELSE NULL END), 0) AS tiempo_respuesta_dias
    FROM 
        d_companies c
    LEFT JOIN 
        d_project_request_companies prc ON c.id = prc."companyId" AND prc."isDeleted" = false
    LEFT JOIN 
        d_project_request_quotations prq ON prc.id = prq."projectRequestCompanyId" AND prq."isDeleted" = false
    LEFT JOIN 
        d_project_requirements preq ON prc."projectRequirementsId" = preq.id AND preq."isDeleted" = false
    LEFT JOIN 
        d_project_requests pr ON preq."projectRequestId" = pr.id AND pr."isDeleted" = false
    LEFT JOIN 
        d_projects p ON prc.id = p."projectRequestCompanyId" AND p."isDeleted" = false
    LEFT JOIN 
        d_quotation_segments qs ON prq.id = qs."projectRequestRequirementQuotationId" AND qs."isDeleted" = false
    WHERE 
        c."isDeleted" = false
    GROUP BY 
        c.id, c."companyName", c."comercialName"
)
SELECT 
    COALESCE(commercial_name, company_name) AS "Asociado",
    cotizaciones_validas AS "Cotizaciones Válidas",
    proyectos_asignados AS "Proy. Asignados",
    tasa_exito AS "Tasa Éxito (%)",
    entrega_a_tiempo AS "Entrega a Tiempo (%)",
    tiempo_respuesta_dias AS "Tiempo Resp. Cotización (días)"
FROM 
    company_project_stats
ORDER BY 
    "Tasa Éxito (%)" DESC, "Cotizaciones Válidas" DESC;

select * from public.v_quotations_vs_projects;

-------------------------

--- Rep 3----

CREATE OR REPLACE VIEW v_projects_costs_summary AS
WITH project_costs AS (
    -- Calcular costos y precios por proyecto y empresa
    SELECT 
        c.id AS company_id,
        c."companyName" AS company_name,
        c."comercialName" AS commercial_name,
        COUNT(DISTINCT CASE WHEN prq.id IS NOT NULL THEN prc.id END) AS cotizados,
        COUNT(DISTINCT CASE WHEN p.id IS NOT NULL THEN p.id END) AS aceptados,
        SUM(COALESCE(prq."indirectCost", 0)) AS costos_indirectos,
        SUM(COALESCE(prq."directCost", 0)) AS costos_directos,
        SUM(COALESCE(prq."materialCost", 0)) AS costos_operativos,
        SUM(COALESCE(prq."price", 0)) AS precio_final,
        CASE 
            WHEN SUM(COALESCE(prq."price", 0)) > 0 
            THEN ROUND(
                ((SUM(COALESCE(prq."price", 0)) - 
                  (SUM(COALESCE(prq."indirectCost", 0)) + SUM(COALESCE(prq."directCost", 0)) + SUM(COALESCE(prq."materialCost", 0)))) / 
                 SUM(COALESCE(prq."price", 0)) * 100)::numeric, 2)
            ELSE 0
        END AS ganancia_porcentaje
    FROM 
        d_companies c
    LEFT JOIN 
        d_project_request_companies prc ON c.id = prc."companyId" AND prc."isDeleted" = false
    LEFT JOIN 
        d_project_request_quotations prq ON prc.id = prq."projectRequestCompanyId" AND prq."isDeleted" = false
    LEFT JOIN 
        d_projects p ON prc.id = p."projectRequestCompanyId" AND p."isDeleted" = false
    WHERE 
        c."isDeleted" = false
    GROUP BY 
        c.id, c."companyName", c."comercialName"
)
SELECT 
    COALESCE(commercial_name, company_name) AS "Cotizados",
    aceptados AS "Aceptados",
    costos_indirectos AS "Costos Indirectos",
    costos_directos AS "Costos Directos",
    costos_operativos AS "Costos Operativos",
    precio_final AS "Precio final",
    ganancia_porcentaje || '%' AS "Ganancia"
FROM 
    project_costs
ORDER BY 
    ganancia_porcentaje DESC;
select * from v_projects_costs_summary;

--- Rep 4
--DROP VIEW v_project_details
CREATE OR REPLACE VIEW v_project_details AS
SELECT 
    COALESCE(c."comercialName", c."companyName") AS "Asociado",
    pr."title" AS "Proyecto",
    MIN(prq."createdAt"::date) AS "Fecha Cotización",
    SUM(prq."price") AS "Monto Cotizado",
    -- Si cualquiera de los requerimientos tiene un proyecto asignado, consideramos que el proyecto está asignado
    CASE WHEN SUM(CASE WHEN p.id IS NOT NULL THEN 1 ELSE 0 END) > 0 THEN 'Sí' ELSE 'No' END AS "Proyecto Asignado (Sí/No)",
    MIN(qs."estimatedDeliveryDate"::date) AS "Fecha Entrega Comprometida",
    -- Para la fecha de entrega real, usamos la fecha de actualización del proyecto cuando su estado es "Completado"
    MIN(CASE 
        WHEN p."projectStatusId" = 3 THEN p."updatedAt"::date
        ELSE NULL
    END) AS "Fecha Entrega Real"
FROM 
    d_companies c
JOIN 
    d_project_request_companies prc ON c.id = prc."companyId" AND prc."isDeleted" = false
JOIN 
    d_project_request_quotations prq ON prc.id = prq."projectRequestCompanyId" AND prq."isDeleted" = false
JOIN 
    d_project_requirements preq ON prc."projectRequirementsId" = preq.id AND preq."isDeleted" = false
JOIN 
    d_project_requests pr ON preq."projectRequestId" = pr.id AND pr."isDeleted" = false
LEFT JOIN 
    d_projects p ON prc.id = p."projectRequestCompanyId" AND p."isDeleted" = false
LEFT JOIN 
    d_quotation_segments qs ON prq.id = qs."projectRequestRequirementQuotationId" AND qs."isDeleted" = false
WHERE 
    c."isDeleted" = false
GROUP BY
    c."comercialName", c."companyName", pr."title"
ORDER BY 
    "Asociado", "Proyecto";

select * from v_project_details;