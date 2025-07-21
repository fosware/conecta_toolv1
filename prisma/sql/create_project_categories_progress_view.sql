-- =====================================================
-- PROJECT MANAGEMENT - VISTA MATERIALIZADA DE CATEGORÍAS CON PROGRESO
-- =====================================================
-- Descripción: Vista materializada que pre-calcula el progreso y estado 
-- de las categorías de proyecto basado en sus actividades.
-- Optimizada para el módulo Project Management.
-- =====================================================

-- Eliminar vista existente si existe
DROP MATERIALIZED VIEW IF EXISTS project_categories_with_progress CASCADE;

-- Crear vista materializada con progreso calculado
CREATE MATERIALIZED VIEW project_categories_with_progress AS
SELECT 
  -- Campos base de la categoría
  pc.id,
  pc.name,
  pc.description,
  pc."projectId",
  pc."isActive",
  pc."isDeleted",
  pc."createdAt",
  pc."updatedAt",
  pc."userId",
  pc."stageId",
  
  -- Métricas de actividades (calculadas)
  COALESCE(stats.total_active_activities, 0) as total_active_activities,
  COALESCE(stats.completed_activities, 0) as completed_activities,
  COALESCE(stats.in_progress_activities, 0) as in_progress_activities,
  COALESCE(stats.pending_activities, 0) as pending_activities,
  COALESCE(stats.cancelled_activities, 0) as cancelled_activities,
  
  -- Progreso calculado (igual que en módulo Projects)
  -- Solo actividades completadas / actividades activas (no canceladas)
  COALESCE(stats.progress, 0) as progress,
  
  -- Status calculado (igual que en módulo Projects)
  COALESCE(stats.status, 'pending') as status,
  
  -- Timestamp para invalidación de cache
  GREATEST(
    pc."updatedAt", 
    COALESCE(stats.last_activity_update, pc."updatedAt")
  ) as last_updated,
  
  -- Metadatos adicionales para Project Management
  CASE 
    WHEN COALESCE(stats.total_active_activities, 0) = 0 THEN 'Sin actividades'
    WHEN stats.progress = 100 THEN 'Completado'
    WHEN stats.progress > 0 THEN 'En progreso (' || stats.progress || '%)'
    ELSE 'Por iniciar'
  END as progress_text,
  
  -- Indicador de si tiene actividades
  CASE WHEN COALESCE(stats.total_active_activities, 0) > 0 THEN true ELSE false END as has_activities

FROM c_project_categories pc
LEFT JOIN (
  SELECT 
    pca."projectCategoryId",
    
    -- Contadores por estado (excluyendo eliminadas) - CORREGIDO
    COUNT(pca.id) FILTER (
      WHERE pca."isDeleted" = false AND COALESCE(pca."projectCategoryActivityStatusId", 1) != 4
    ) as total_active_activities,
    
    COUNT(pca.id) FILTER (
      WHERE pca."isDeleted" = false AND pca."projectCategoryActivityStatusId" = 3
    ) as completed_activities,
    
    COUNT(pca.id) FILTER (
      WHERE pca."isDeleted" = false AND pca."projectCategoryActivityStatusId" = 2
    ) as in_progress_activities,
    
    COUNT(pca.id) FILTER (
      WHERE pca."isDeleted" = false AND COALESCE(pca."projectCategoryActivityStatusId", 1) = 1
    ) as pending_activities,
    
    COUNT(pca.id) FILTER (
      WHERE pca."isDeleted" = false AND pca."projectCategoryActivityStatusId" = 4
    ) as cancelled_activities,
    
    -- Cálculo de progreso - CORREGIDO
    CASE 
      WHEN COUNT(pca.id) FILTER (
        WHERE pca."isDeleted" = false AND COALESCE(pca."projectCategoryActivityStatusId", 1) != 4
      ) = 0 THEN 0
      ELSE ROUND(
        (COUNT(pca.id) FILTER (
          WHERE pca."isDeleted" = false AND pca."projectCategoryActivityStatusId" = 3
        ) * 100.0) / 
        NULLIF(COUNT(pca.id) FILTER (
          WHERE pca."isDeleted" = false AND COALESCE(pca."projectCategoryActivityStatusId", 1) != 4
        ), 0)
      )
    END as progress,
    
    -- Cálculo de status - CORREGIDO
    CASE 
      WHEN COUNT(pca.id) FILTER (
        WHERE pca."isDeleted" = false AND COALESCE(pca."projectCategoryActivityStatusId", 1) != 4
      ) = 0 THEN 'pending'
      
      WHEN COUNT(pca.id) FILTER (
        WHERE pca."isDeleted" = false AND pca."projectCategoryActivityStatusId" = 3
      ) = COUNT(pca.id) FILTER (
        WHERE pca."isDeleted" = false AND COALESCE(pca."projectCategoryActivityStatusId", 1) != 4
      ) THEN 'completed'
      
      WHEN COUNT(pca.id) FILTER (
        WHERE pca."isDeleted" = false AND pca."projectCategoryActivityStatusId" IN (2, 3)
      ) > 0 THEN 'in-progress'
      
      ELSE 'pending'
    END as status,
    
    -- Última actualización de actividades
    MAX(pca."updatedAt") as last_activity_update
    
  FROM d_project_category_activities pca
  WHERE pca."isDeleted" = false
  GROUP BY pca."projectCategoryId"
  
) stats ON pc.id = stats."projectCategoryId"

-- Solo categorías no eliminadas
WHERE pc."isDeleted" = false;

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índice único principal (requerido para REFRESH CONCURRENTLY)
CREATE UNIQUE INDEX idx_project_categories_progress_id 
ON project_categories_with_progress (id);

-- Índice para consultas por proyecto
CREATE INDEX idx_project_categories_progress_project 
ON project_categories_with_progress ("projectId", "isDeleted");

-- Índice para filtros por estado y progreso
CREATE INDEX idx_project_categories_progress_status 
ON project_categories_with_progress (status, progress);

-- Índice para ordenamiento por última actualización
CREATE INDEX idx_project_categories_progress_updated 
ON project_categories_with_progress (last_updated DESC);

-- Índice compuesto para Project Management
CREATE INDEX idx_project_categories_progress_pm 
ON project_categories_with_progress ("projectId", status, progress, "isActive");

-- =====================================================
-- COMENTARIOS Y METADATOS
-- =====================================================

COMMENT ON MATERIALIZED VIEW project_categories_with_progress IS 
'Vista materializada que pre-calcula el progreso y estado de las categorías de proyecto basado en sus actividades. Optimizada para el módulo Project Management. Se actualiza automáticamente cuando cambian las actividades.';

COMMENT ON COLUMN project_categories_with_progress.progress IS 
'Progreso calculado como (actividades_completadas / actividades_activas) * 100. Excluye actividades canceladas y eliminadas.';

COMMENT ON COLUMN project_categories_with_progress.status IS 
'Estado calculado: pending (sin progreso), in-progress (progreso parcial), completed (100% completado).';

COMMENT ON COLUMN project_categories_with_progress.last_updated IS 
'Timestamp de la última actualización de la categoría o sus actividades. Útil para invalidación de cache.';

-- =====================================================
-- REFRESH INICIAL
-- =====================================================

-- Realizar el primer refresh para poblar la vista
REFRESH MATERIALIZED VIEW project_categories_with_progress;

-- Verificar que la vista se creó correctamente
SELECT 
  'project_categories_with_progress' as view_name,
  COUNT(*) as total_categories,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_categories,
  COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress_categories,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_categories,
  ROUND(AVG(progress), 2) as avg_progress
FROM project_categories_with_progress;
