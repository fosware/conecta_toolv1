
select * from v_quotations_vs_projects;

DROP VIEW v_quotations_vs_projects;

CREATE OR REPLACE VIEW v_quotations_vs_projects AS
WITH company_project_stats AS (
    -- Calcular estadísticas de cotización y proyecto por empresa
    SELECT 
        c.id AS company_id,
        c."companyName" AS company_name,
        c."comercialName" AS commercial_name,
        TO_CHAR(prq."createdAt", 'DD/MM/YYYY') AS quotation_date,
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
            ELSE NULL END), 0) AS tiempo_respuesta_dias,
        -- NUEVAS COLUMNAS: Fechas basadas en actividades
        TO_CHAR(MIN(pca."dateTentativeStart"), 'DD/MM/YYYY') AS fecha_inicio_proyecto,
        TO_CHAR(MAX(pca."dateTentativeEnd"), 'DD/MM/YYYY') AS fecha_fin_proyecto
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
    -- NUEVOS JOINS para obtener fechas de actividades
    LEFT JOIN 
        c_project_categories pc ON p.id = pc."projectId" AND pc."isDeleted" = false
    LEFT JOIN 
        d_project_category_activities pca ON pc.id = pca."projectCategoryId" AND pca."isDeleted" = false
        AND pca."dateTentativeStart" IS NOT NULL AND pca."dateTentativeEnd" IS NOT NULL
    WHERE 
        c."isDeleted" = false
    GROUP BY 
        c.id, c."companyName", c."comercialName", quotation_date
    -- FILTRO: Solo mostrar registros que tengan fechas de actividades
    HAVING 
        MIN(pca."dateTentativeStart") IS NOT NULL AND MAX(pca."dateTentativeEnd") IS NOT NULL
)
SELECT 
    COALESCE(commercial_name, company_name) AS "Asociado",
    quotation_date AS "Fecha de Cotización",
    fecha_inicio_proyecto AS "Fecha de Inicio",
    fecha_fin_proyecto AS "Fecha de Término",
    cotizaciones_validas AS "Cotizaciones Válidas",
    proyectos_asignados AS "Proy. Asignados",
    tasa_exito AS "Tasa Éxito (%)",
    entrega_a_tiempo AS "Entrega a Tiempo (%)",
    tiempo_respuesta_dias AS "Tiempo Resp. Cotización (días)"
FROM 
    company_project_stats
ORDER BY 
    "Asociado", "Fecha de Cotización";

----------------------------------------------------
select  * from v_projects_costs_summary;

DROP VIEW v_projects_costs_summary;

CREATE OR REPLACE VIEW v_projects_costs_summary AS
WITH project_costs AS (
    -- Calcular costos y precios por proyecto y empresa
    SELECT 
        c.id AS company_id,
        c."companyName" AS company_name,
        c."comercialName" AS commercial_name,
        TO_CHAR(prq."createdAt", 'DD/MM/YYYY') AS quotation_date,
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
        END AS ganancia_porcentaje,
        -- NUEVAS COLUMNAS: Fechas basadas en actividades
        TO_CHAR(MIN(pca."dateTentativeStart"), 'DD/MM/YYYY') AS fecha_inicio_proyecto,
        TO_CHAR(MAX(pca."dateTentativeEnd"), 'DD/MM/YYYY') AS fecha_fin_proyecto
    FROM 
        d_companies c
    LEFT JOIN 
        d_project_request_companies prc ON c.id = prc."companyId" AND prc."isDeleted" = false
    LEFT JOIN 
        d_project_request_quotations prq ON prc.id = prq."projectRequestCompanyId" AND prq."isDeleted" = false
    LEFT JOIN 
        d_projects p ON prc.id = p."projectRequestCompanyId" AND p."isDeleted" = false
    -- NUEVOS JOINS para obtener fechas de actividades
    LEFT JOIN 
        c_project_categories pc ON p.id = pc."projectId" AND pc."isDeleted" = false
    LEFT JOIN 
        d_project_category_activities pca ON pc.id = pca."projectCategoryId" AND pca."isDeleted" = false
        AND pca."dateTentativeStart" IS NOT NULL AND pca."dateTentativeEnd" IS NOT NULL
    WHERE 
        c."isDeleted" = false
    GROUP BY 
        c.id, c."companyName", c."comercialName", quotation_date
    -- FILTRO: Solo mostrar registros que tengan fechas de actividades
    HAVING 
        MIN(pca."dateTentativeStart") IS NOT NULL AND MAX(pca."dateTentativeEnd") IS NOT NULL
)
SELECT 
    COALESCE(commercial_name, company_name) AS "Asociado",
    quotation_date AS "Fecha de Cotización",
    fecha_inicio_proyecto AS "Fecha de Inicio",
    fecha_fin_proyecto AS "Fecha de Término",
    cotizados AS "Cotizados",
    aceptados AS "Aceptados",
    costos_indirectos AS "Costos Indirectos",
    costos_directos AS "Costos Directos",
    costos_operativos AS "Costos Operativos",
    precio_final AS "Precio final",
    ganancia_porcentaje || '%' AS "Ganancia"
FROM 
    project_costs
ORDER BY 
    "Asociado", "Fecha de Cotización";
