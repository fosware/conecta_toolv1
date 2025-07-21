-- =====================================================
-- PROJECT MANAGEMENT - TRIGGERS PARA REFRESH AUTOMÁTICO
-- =====================================================
-- Descripción: Triggers y funciones para actualizar automáticamente
-- la vista materializada cuando cambian las actividades o categorías.
-- Versión simplificada sin dependencias problemáticas.
-- =====================================================

-- Limpiar funciones y triggers existentes
DROP TRIGGER IF EXISTS trigger_refresh_categories_on_activity_change ON d_project_category_activities;
DROP TRIGGER IF EXISTS trigger_refresh_categories_on_category_change ON c_project_categories;
DROP TRIGGER IF EXISTS trigger_refresh_categories_on_status_change ON c_project_category_activity_status;
DROP FUNCTION IF EXISTS refresh_project_categories_progress() CASCADE;
DROP FUNCTION IF EXISTS refresh_materialized_view_concurrently() CASCADE;
DROP FUNCTION IF EXISTS manual_refresh_project_categories() CASCADE;

-- =====================================================
-- FUNCIÓN SIMPLE DE REFRESH PARA TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION refresh_project_categories_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Refresh simple de la vista materializada
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY project_categories_with_progress;
  EXCEPTION WHEN OTHERS THEN
    -- Si falla el concurrent, usar refresh normal
    REFRESH MATERIALIZED VIEW project_categories_with_progress;
  END;
  
  -- Retornar el registro apropiado para el trigger
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN PARA REFRESH MANUAL DE LA VISTA MATERIALIZADA
-- =====================================================
CREATE OR REPLACE FUNCTION refresh_project_categories_view()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY project_categories_with_progress;
EXCEPTION
  WHEN OTHERS THEN
    -- Si falla el refresh concurrente, intentar refresh normal
    REFRESH MATERIALIZED VIEW project_categories_with_progress;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN PARA ACTUALIZAR PROGRESO DE TODAS LAS ETAPAS
-- =====================================================
CREATE OR REPLACE FUNCTION update_all_stages_progress()
RETURNS void AS $$
DECLARE
  stage_record RECORD;
  categories_with_progress RECORD;
  total_progress INTEGER;
  category_count INTEGER;
  average_progress INTEGER;
  new_status TEXT;
BEGIN
  -- Actualizar progreso para todas las etapas
  FOR stage_record IN
    SELECT id, name FROM d_project_stages WHERE "isDeleted" = false
  LOOP
    total_progress := 0;
    category_count := 0;
    
    -- Obtener progreso de categorías para esta etapa
    FOR categories_with_progress IN
      SELECT progress FROM project_categories_with_progress 
      WHERE id IN (
        SELECT id FROM c_project_categories 
        WHERE "stageId" = stage_record.id AND "isDeleted" = false
      )
    LOOP
      total_progress := total_progress + COALESCE(categories_with_progress.progress, 0);
      category_count := category_count + 1;
    END LOOP;
    
    -- Calcular progreso promedio
    IF category_count = 0 THEN
      average_progress := 0;
      new_status := 'pending';
    ELSE
      average_progress := ROUND(total_progress::NUMERIC / category_count);
      
      IF average_progress = 0 THEN
        new_status := 'pending';
      ELSIF average_progress = 100 THEN
        new_status := 'completed';
      ELSE
        new_status := 'in-progress';
      END IF;
    END IF;
    
    -- Actualizar etapa
    UPDATE d_project_stages 
    SET progress = average_progress, status = new_status
    WHERE id = stage_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN PARA REFRESH MANUAL
-- =====================================================

CREATE OR REPLACE FUNCTION refresh_project_categories_view()
RETURNS void AS $$
BEGIN
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY project_categories_with_progress;
  EXCEPTION WHEN OTHERS THEN
    REFRESH MATERIALIZED VIEW project_categories_with_progress;
  END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS SIMPLIFICADOS
-- =====================================================

-- Trigger para cambios en actividades
CREATE TRIGGER trigger_refresh_categories_on_activity_change
  AFTER INSERT OR UPDATE OR DELETE ON d_project_category_activities
  FOR EACH ROW
  EXECUTE FUNCTION refresh_project_categories_progress();

-- Trigger para cambios en categorías
CREATE TRIGGER trigger_refresh_categories_on_category_change
  AFTER INSERT OR UPDATE OR DELETE ON c_project_categories
  FOR EACH ROW
  EXECUTE FUNCTION refresh_project_categories_progress();

-- =====================================================
-- REFRESH INICIAL
-- =====================================================

-- Refrescar la vista una vez para asegurar datos actualizados
SELECT refresh_project_categories_view();

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Mostrar información de la vista actualizada
SELECT 
  'project_categories_with_progress' as view_name,
  COUNT(*) as total_categories,
  COUNT(*) FILTER (WHERE progress > 0) as categories_with_progress,
  AVG(progress) as avg_progress
FROM project_categories_with_progress 
WHERE "isDeleted" = false;

-- Mostrar triggers creados
SELECT 
  trigger_name, 
  event_object_table, 
  action_timing, 
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_name LIKE '%refresh_categories%'
ORDER BY event_object_table, trigger_name;
