-- Vista para Dashboard KPI con filtrado por fechas
-- Esta vista proporciona métricas clave para el dashboard ejecutivo

-- Eliminar vistas si ya existen
DROP VIEW IF EXISTS v_kpi_dashboard CASCADE;
DROP VIEW IF EXISTS v_reincidencia_empresas CASCADE;

-- Vista principal para el dashboard KPI
CREATE OR REPLACE VIEW v_kpi_dashboard AS
SELECT
    -- Información de fechas para filtrado
    TO_CHAR(prq."createdAt", 'YYYY-MM-DD') AS fecha,
    EXTRACT(YEAR FROM prq."createdAt") AS anio,
    EXTRACT(MONTH FROM prq."createdAt") AS mes,
    EXTRACT(QUARTER FROM prq."createdAt") AS trimestre,
    
    -- KPIs principales
    c.id AS company_id,
    COALESCE(c."comercialName", c."companyName") AS company_name,
    pr.title AS proyecto_titulo,
    
    -- Datos para cálculos de KPIs
    prq."createdAt"::date AS cotizacion_fecha,
    pr."requestDate"::date AS solicitud_fecha,
    prq.price AS monto_cotizado,
    p.id IS NOT NULL AS proyecto_asignado,
    
    -- Determinar si la entrega fue a tiempo
    CASE 
        WHEN p."projectStatusId" = 3 AND p."updatedAt" <= qs."estimatedDeliveryDate" THEN true
        WHEN p."projectStatusId" = 3 AND p."updatedAt" > qs."estimatedDeliveryDate" THEN false
        ELSE NULL
    END AS entrega_a_tiempo,
    
    -- Calcular tiempo de respuesta en días
    EXTRACT(EPOCH FROM (prq."createdAt" - pr."requestDate"))/86400 AS tiempo_respuesta_dias,
    
    -- Fechas para análisis de tiempos
    qs."estimatedDeliveryDate"::date AS fecha_entrega_comprometida,
    CASE 
        WHEN p."projectStatusId" = 3 THEN p."updatedAt"
        ELSE NULL
    END AS fecha_entrega_real,
    
    -- Cálculo de desviación en días (positivo = retraso, negativo = anticipado)
    CASE 
        WHEN p."projectStatusId" = 3 AND qs."estimatedDeliveryDate" IS NOT NULL THEN
            EXTRACT(EPOCH FROM (p."updatedAt" - qs."estimatedDeliveryDate"))/86400
        ELSE NULL
    END AS desviacion_dias,
    
    -- Datos adicionales para filtrado
    p."projectStatusId" AS project_status,
    p."createdAt"::date AS project_created_date,
    p."updatedAt"::date AS project_updated_date
FROM 
    d_project_requests pr
JOIN 
    d_project_requirements preq ON pr.id = preq."projectRequestId" AND preq."isDeleted" = false
JOIN 
    d_project_request_companies prc ON preq.id = prc."projectRequirementsId" AND prc."isDeleted" = false
JOIN 
    d_companies c ON prc."companyId" = c.id AND c."isDeleted" = false
LEFT JOIN 
    d_project_request_quotations prq ON prc.id = prq."projectRequestCompanyId" AND prq."isDeleted" = false
LEFT JOIN 
    d_projects p ON prc.id = p."projectRequestCompanyId" AND p."isDeleted" = false
LEFT JOIN 
    d_quotation_segments qs ON prq.id = qs."projectRequestRequirementQuotationId" AND qs."isDeleted" = false
WHERE 
    pr."isDeleted" = false
ORDER BY 
    prq."createdAt" DESC;

-- Vista complementaria para índice de reincidencia
CREATE OR REPLACE VIEW v_reincidencia_empresas AS
SELECT
    c.id AS company_id,
    COALESCE(c."comercialName", c."companyName") AS company_name,
    COUNT(DISTINCT p.id) AS total_projects,
    COUNT(DISTINCT pr.title) AS unique_projects,
    COUNT(DISTINCT p.id) - COUNT(DISTINCT pr.title) AS recurring_projects,
    CASE 
        WHEN COUNT(DISTINCT p.id) > 0 THEN 
            ROUND((COUNT(DISTINCT p.id) - COUNT(DISTINCT pr.title))::numeric / COUNT(DISTINCT p.id)::numeric * 100, 2)
        ELSE 0
    END AS porcentaje_reincidencia
FROM 
    d_companies c
JOIN 
    d_project_request_companies prc ON c.id = prc."companyId" AND prc."isDeleted" = false
JOIN 
    d_project_requirements preq ON prc."projectRequirementsId" = preq.id AND preq."isDeleted" = false
JOIN 
    d_project_requests pr ON preq."projectRequestId" = pr.id AND pr."isDeleted" = false
JOIN 
    d_projects p ON prc.id = p."projectRequestCompanyId" AND p."isDeleted" = false
WHERE 
    c."isDeleted" = false
GROUP BY 
    c.id, c."comercialName", c."companyName"
ORDER BY 
    porcentaje_reincidencia DESC;

-- Comentario para uso:
-- Esta vista proporciona datos base para el dashboard KPI.
-- Para filtrar por rango de fechas, use WHERE fecha BETWEEN 'YYYY-MM-DD' AND 'YYYY-MM-DD'
-- Para filtrar por año, mes o trimestre específico, use las columnas anio, mes, trimestre
