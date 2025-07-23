-- =====================================================
-- PROJECT MANAGEMENT - FUNCIONES UTILITARIAS
-- =====================================================
-- Descripción: Funciones auxiliares para mantenimiento,
-- debugging y operaciones avanzadas del módulo Project Management.
-- =====================================================

-- =====================================================
-- FUNCIÓN PARA OBTENER ESTADÍSTICAS COMPLETAS
-- =====================================================

CREATE OR REPLACE FUNCTION get_project_management_stats(p_project_id INTEGER DEFAULT NULL)
RETURNS TABLE (
  project_id INTEGER,
  project_name TEXT,
  total_stages INTEGER,
  total_categories INTEGER,
  completed_categories INTEGER,
  in_progress_categories INTEGER,
  pending_categories INTEGER,
  overall_progress NUMERIC,
  last_activity TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as project_id,
    COALESCE(pr.title, 'Sin título') as project_name,
    COALESCE(stage_stats.total_stages, 0) as total_stages,
    COALESCE(cat_stats.total_categories, 0) as total_categories,
    COALESCE(cat_stats.completed_categories, 0) as completed_categories,
    COALESCE(cat_stats.in_progress_categories, 0) as in_progress_categories,
    COALESCE(cat_stats.pending_categories, 0) as pending_categories,
    COALESCE(cat_stats.overall_progress, 0) as overall_progress,
    GREATEST(
      COALESCE(stage_stats.last_stage_update, p."updatedAt"),
      COALESCE(cat_stats.last_category_update, p."updatedAt"),
      p."updatedAt"
    ) as last_activity
  FROM d_projects p
  LEFT JOIN d_project_requests pr ON p."projectRequestId" = pr.id
  LEFT JOIN (
    -- Estadísticas de etapas
    SELECT 
      ps."projectId",
      COUNT(*) as total_stages,
      MAX(ps."updatedAt") as last_stage_update
    FROM d_project_stages ps
    WHERE ps."isDeleted" = false
    GROUP BY ps."projectId"
  ) stage_stats ON p.id = stage_stats."projectId"
  LEFT JOIN (
    -- Estadísticas de categorías desde la vista materializada
    SELECT 
      pcwp."projectId",
      COUNT(*) as total_categories,
      COUNT(*) FILTER (WHERE pcwp.status = 'completed') as completed_categories,
      COUNT(*) FILTER (WHERE pcwp.status = 'in-progress') as in_progress_categories,
      COUNT(*) FILTER (WHERE pcwp.status = 'pending') as pending_categories,
      ROUND(AVG(pcwp.progress), 2) as overall_progress,
      MAX(pcwp.last_updated) as last_category_update
    FROM project_categories_with_progress pcwp
    WHERE pcwp."isDeleted" = false
    GROUP BY pcwp."projectId"
  ) cat_stats ON p.id = cat_stats."projectId"
  WHERE p."isDeleted" = false
    AND (p_project_id IS NULL OR p.id = p_project_id)
  ORDER BY p.id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN PARA LIMPIAR DATOS HUÉRFANOS
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_project_management_orphans()
RETURNS TABLE (
  cleanup_type TEXT,
  records_affected INTEGER,
  details TEXT
) AS $$
DECLARE
  orphan_stages INTEGER;
  orphan_activities INTEGER;
  orphan_categories INTEGER;
BEGIN
  -- Limpiar etapas huérfanas (proyectos eliminados)
  UPDATE d_project_stages 
  SET "isDeleted" = true, "dateDeleted" = NOW()
  WHERE "projectId" NOT IN (SELECT id FROM d_projects WHERE "isDeleted" = false)
    AND "isDeleted" = false;
  
  GET DIAGNOSTICS orphan_stages = ROW_COUNT;
  
  -- Limpiar categorías huérfanas (proyectos eliminados)
  UPDATE c_project_categories 
  SET "isDeleted" = true, "dateDeleted" = NOW()
  WHERE "projectId" NOT IN (SELECT id FROM d_projects WHERE "isDeleted" = false)
    AND "isDeleted" = false;
  
  GET DIAGNOSTICS orphan_categories = ROW_COUNT;
  
  -- Limpiar actividades huérfanas (categorías eliminadas)
  UPDATE d_project_category_activities 
  SET "isDeleted" = true, "dateDeleted" = NOW()
  WHERE "projectCategoryId" NOT IN (
    SELECT id FROM c_project_categories WHERE "isDeleted" = false
  ) AND "isDeleted" = false;
  
  GET DIAGNOSTICS orphan_activities = ROW_COUNT;
  
  -- Retornar resultados
  RETURN QUERY VALUES 
    ('orphan_stages', orphan_stages, 'Etapas de proyectos eliminados'),
    ('orphan_categories', orphan_categories, 'Categorías de proyectos eliminados'),
    ('orphan_activities', orphan_activities, 'Actividades de categorías eliminadas');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN PARA RECALCULAR PROGRESO DE ETAPAS
-- =====================================================

CREATE OR REPLACE FUNCTION recalculate_stages_progress(p_project_id INTEGER DEFAULT NULL)
RETURNS TABLE (
  stage_id INTEGER,
  stage_name VARCHAR,
  old_progress INTEGER,
  new_progress INTEGER,
  categories_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH stage_progress AS (
    SELECT 
      ps.id,
      ps.name,
      ps.progress as current_progress,
      -- Por ahora mantenemos el progreso actual
      -- En el futuro, esto se calculará basado en categorías asignadas
      ps.progress as calculated_progress,
      0 as assigned_categories
    FROM d_project_stages ps
    WHERE ps."isDeleted" = false
      AND (p_project_id IS NULL OR ps."projectId" = p_project_id)
  )
  SELECT 
    sp.id as stage_id,
    sp.name as stage_name,
    sp.current_progress as old_progress,
    sp.calculated_progress as new_progress,
    sp.assigned_categories as categories_count
  FROM stage_progress sp
  WHERE sp.current_progress != sp.calculated_progress;
  
  -- Actualizar progreso si hay diferencias
  -- (Por ahora comentado hasta implementar la lógica de categorías asignadas)
  /*
  UPDATE d_project_stages ps
  SET progress = sp.calculated_progress,
      "updatedAt" = NOW()
  FROM stage_progress sp
  WHERE ps.id = sp.id
    AND ps.progress != sp.calculated_progress;
  */
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN PARA VALIDAR INTEGRIDAD DE DATOS
-- =====================================================

CREATE OR REPLACE FUNCTION validate_project_management_integrity()
RETURNS TABLE (
  check_type TEXT,
  status TEXT,
  issues_found INTEGER,
  description TEXT
) AS $$
DECLARE
  duplicate_orders INTEGER;
  missing_orders INTEGER;
  invalid_progress INTEGER;
  invalid_status INTEGER;
BEGIN
  -- Verificar órdenes duplicados en etapas
  SELECT COUNT(*) INTO duplicate_orders
  FROM (
    SELECT "projectId", "order", COUNT(*)
    FROM d_project_stages 
    WHERE "isDeleted" = false
    GROUP BY "projectId", "order"
    HAVING COUNT(*) > 1
  ) duplicates;
  
  -- Verificar órdenes faltantes en secuencias
  SELECT COUNT(*) INTO missing_orders
  FROM (
    SELECT ps."projectId"
    FROM d_project_stages ps
    WHERE ps."isDeleted" = false
    GROUP BY ps."projectId"
    HAVING MAX(ps."order") != COUNT(*)
  ) missing;
  
  -- Verificar progreso inválido
  SELECT COUNT(*) INTO invalid_progress
  FROM d_project_stages
  WHERE "isDeleted" = false
    AND (progress < 0 OR progress > 100);
  
  -- Verificar estados inválidos
  SELECT COUNT(*) INTO invalid_status
  FROM d_project_stages
  WHERE "isDeleted" = false
    AND status NOT IN ('pending', 'in-progress', 'completed');
  
  -- Retornar resultados
  RETURN QUERY VALUES 
    ('duplicate_orders', 
     CASE WHEN duplicate_orders = 0 THEN 'OK' ELSE 'ERROR' END,
     duplicate_orders,
     'Etapas con orden duplicado en el mismo proyecto'),
    ('missing_orders', 
     CASE WHEN missing_orders = 0 THEN 'OK' ELSE 'WARNING' END,
     missing_orders,
     'Proyectos con secuencias de orden incompletas'),
    ('invalid_progress', 
     CASE WHEN invalid_progress = 0 THEN 'OK' ELSE 'ERROR' END,
     invalid_progress,
     'Etapas con progreso fuera del rango 0-100'),
    ('invalid_status', 
     CASE WHEN invalid_status = 0 THEN 'OK' ELSE 'ERROR' END,
     invalid_status,
     'Etapas con estado inválido');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN PARA REPARAR ÓRDENES DE ETAPAS
-- =====================================================

CREATE OR REPLACE FUNCTION repair_stage_orders(p_project_id INTEGER DEFAULT NULL)
RETURNS TABLE (
  project_id INTEGER,
  stages_reordered INTEGER,
  message TEXT
) AS $$
DECLARE
  proj_record RECORD;
  stage_record RECORD;
  new_order INTEGER;
  reordered_count INTEGER;
BEGIN
  -- Procesar cada proyecto
  FOR proj_record IN 
    SELECT DISTINCT ps."projectId"
    FROM d_project_stages ps
    WHERE ps."isDeleted" = false
      AND (p_project_id IS NULL OR ps."projectId" = p_project_id)
  LOOP
    new_order := 1;
    reordered_count := 0;
    
    -- Reordenar etapas del proyecto actual
    FOR stage_record IN
      SELECT id, "order"
      FROM d_project_stages
      WHERE "projectId" = proj_record."projectId"
        AND "isDeleted" = false
      ORDER BY "order", id
    LOOP
      IF stage_record."order" != new_order THEN
        UPDATE d_project_stages
        SET "order" = new_order, "updatedAt" = NOW()
        WHERE id = stage_record.id;
        
        reordered_count := reordered_count + 1;
      END IF;
      
      new_order := new_order + 1;
    END LOOP;
    
    RETURN QUERY SELECT 
      proj_record."projectId",
      reordered_count,
      CASE 
        WHEN reordered_count = 0 THEN 'Sin cambios necesarios'
        ELSE reordered_count || ' etapas reordenadas'
      END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN PARA BACKUP DE CONFIGURACIÓN
-- =====================================================

CREATE OR REPLACE FUNCTION backup_project_management_config(p_project_id INTEGER)
RETURNS JSONB AS $$
DECLARE
  backup_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'project_id', p_project_id,
    'backup_timestamp', NOW(),
    'stages', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ps.id,
          'name', ps.name,
          'description', ps.description,
          'order', ps."order",
          'progress', ps.progress,
          'status', ps.status,
          'created_at', ps."createdAt",
          'updated_at', ps."updatedAt"
        ) ORDER BY ps."order"
      )
      FROM d_project_stages ps
      WHERE ps."projectId" = p_project_id AND ps."isDeleted" = false
    ),
    'categories_summary', (
      SELECT jsonb_build_object(
        'total', COUNT(*),
        'completed', COUNT(*) FILTER (WHERE status = 'completed'),
        'in_progress', COUNT(*) FILTER (WHERE status = 'in-progress'),
        'pending', COUNT(*) FILTER (WHERE status = 'pending'),
        'avg_progress', ROUND(AVG(progress), 2)
      )
      FROM project_categories_with_progress
      WHERE "projectId" = p_project_id AND "isDeleted" = false
    )
  ) INTO backup_data;
  
  RETURN backup_data;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN PARA MONITOREO DE RENDIMIENTO
-- =====================================================

CREATE OR REPLACE FUNCTION monitor_project_management_performance()
RETURNS TABLE (
  metric_name TEXT,
  metric_value NUMERIC,
  unit TEXT,
  status TEXT
) AS $$
DECLARE
  view_size BIGINT;
  avg_refresh_time NUMERIC;
  total_projects INTEGER;
  total_stages INTEGER;
  total_categories INTEGER;
BEGIN
  -- Tamaño de la vista materializada
  SELECT pg_total_relation_size('project_categories_with_progress') INTO view_size;
  
  -- Tiempo promedio de refresh (si existe log)
  SELECT AVG(execution_time_ms) INTO avg_refresh_time
  FROM refresh_log 
  WHERE view_name = 'project_categories_with_progress'
    AND executed_at > NOW() - INTERVAL '24 hours'
    AND refresh_type != 'failed';
  
  -- Contadores generales
  SELECT COUNT(*) INTO total_projects FROM d_projects WHERE "isDeleted" = false;
  SELECT COUNT(*) INTO total_stages FROM d_project_stages WHERE "isDeleted" = false;
  SELECT COUNT(*) INTO total_categories FROM project_categories_with_progress WHERE "isDeleted" = false;
  
  -- Retornar métricas
  RETURN QUERY VALUES 
    ('materialized_view_size', view_size::NUMERIC, 'bytes', 
     CASE WHEN view_size < 100*1024*1024 THEN 'OK' ELSE 'WARNING' END),
    ('avg_refresh_time', COALESCE(avg_refresh_time, 0), 'milliseconds',
     CASE WHEN COALESCE(avg_refresh_time, 0) < 1000 THEN 'OK' ELSE 'WARNING' END),
    ('total_projects', total_projects::NUMERIC, 'count', 'INFO'),
    ('total_stages', total_stages::NUMERIC, 'count', 'INFO'),
    ('total_categories', total_categories::NUMERIC, 'count', 'INFO'),
    ('categories_per_project', 
     CASE WHEN total_projects > 0 THEN ROUND(total_categories::NUMERIC / total_projects, 2) ELSE 0 END,
     'average', 'INFO');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON FUNCTION get_project_management_stats IS 
'Función para obtener estadísticas completas de uno o todos los proyectos del módulo Project Management.';

COMMENT ON FUNCTION cleanup_project_management_orphans IS 
'Función de mantenimiento para limpiar registros huérfanos (etapas, categorías y actividades sin proyecto padre).';

COMMENT ON FUNCTION validate_project_management_integrity IS 
'Función para validar la integridad de los datos del módulo Project Management y detectar inconsistencias.';

COMMENT ON FUNCTION repair_stage_orders IS 
'Función para reparar secuencias de orden rotas en las etapas de proyecto.';

COMMENT ON FUNCTION monitor_project_management_performance IS 
'Función para monitorear el rendimiento del módulo Project Management y detectar problemas de performance.';

-- =====================================================
-- EJEMPLO DE USO
-- =====================================================

-- Obtener estadísticas de todos los proyectos
-- SELECT * FROM get_project_management_stats();

-- Obtener estadísticas de un proyecto específico
-- SELECT * FROM get_project_management_stats(1);

-- Validar integridad de datos
-- SELECT * FROM validate_project_management_integrity();

-- Monitorear rendimiento
-- SELECT * FROM monitor_project_management_performance();

-- Limpiar datos huérfanos
-- SELECT * FROM cleanup_project_management_orphans();

-- Reparar órdenes de etapas
-- SELECT * FROM repair_stage_orders();

-- INDICES PARA categorias
DROP INDEX IF EXISTS unique_active_category_per_project;

-- Crear índice único parcial que solo aplica a categorías activas
CREATE UNIQUE INDEX unique_active_category_per_project 
ON c_project_categories ("projectId", name) 
WHERE "isActive" = true AND "isDeleted" = false;
