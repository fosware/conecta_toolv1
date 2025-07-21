-- =====================================================
-- PROJECT MANAGEMENT - TABLA DE ETAPAS (STAGES)
-- =====================================================
-- Descripción: Tabla para las etapas del módulo Project Management.
-- Soporta drag & drop, progreso y estados secuenciales.
-- Compatible con la estructura existente sin romper nada.
-- =====================================================

-- =====================================================
-- VERIFICAR TABLA ProjectStage
-- =====================================================

-- NOTA IMPORTANTE: 
-- La tabla d_project_stages YA ESTÁ DEFINIDA en el schema de Prisma.
-- Este script solo verifica que exista y agrega funcionalidades adicionales.
-- Para crear la tabla, ejecuta: npx prisma db push

-- Verificar que la tabla existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'd_project_stages' AND table_schema = 'public'
  ) THEN
    RAISE EXCEPTION 'La tabla d_project_stages no existe. Ejecuta "npx prisma db push" primero.';
  END IF;
  
  RAISE NOTICE 'Tabla d_project_stages encontrada correctamente.';
END $$;

-- Verificar estructura de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'd_project_stages' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índice principal para consultas por proyecto
CREATE INDEX IF NOT EXISTS idx_project_stages_project_order 
ON d_project_stages ("projectId", "order") 
WHERE "isDeleted" = false;

-- Índice para consultas por estado y progreso
CREATE INDEX IF NOT EXISTS idx_project_stages_status_progress 
ON d_project_stages (status, progress) 
WHERE "isDeleted" = false;

-- Índice para soft delete y activos
CREATE INDEX IF NOT EXISTS idx_project_stages_active 
ON d_project_stages ("isDeleted", "isActive");

-- Índice para auditoría y ordenamiento temporal
CREATE INDEX IF NOT EXISTS idx_project_stages_timestamps 
ON d_project_stages ("updatedAt" DESC, "createdAt" DESC);

-- =====================================================
-- TRIGGER PARA UPDATED_AT AUTOMÁTICO
-- =====================================================

CREATE OR REPLACE FUNCTION update_project_stage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_project_stage_timestamp ON d_project_stages;

CREATE TRIGGER trigger_update_project_stage_timestamp
  BEFORE UPDATE ON d_project_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_project_stage_timestamp();

-- =====================================================
-- FUNCIÓN PARA REORDENAR ETAPAS (DRAG & DROP)
-- =====================================================

CREATE OR REPLACE FUNCTION reorder_project_stages(
  p_project_id INTEGER,
  p_stage_id INTEGER,
  p_new_order INTEGER,
  p_user_id INTEGER
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  affected_stages INTEGER
) AS $$
DECLARE
  current_order INTEGER;
  max_order INTEGER;
  affected_count INTEGER := 0;
BEGIN
  -- Verificar que la etapa existe y pertenece al proyecto
  SELECT "order" INTO current_order
  FROM d_project_stages 
  WHERE id = p_stage_id AND "projectId" = p_project_id AND "isDeleted" = false;
  
  IF current_order IS NULL THEN
    RETURN QUERY SELECT false, 'Etapa no encontrada o no pertenece al proyecto', 0;
    RETURN;
  END IF;
  
  -- Obtener el orden máximo para el proyecto
  SELECT COALESCE(MAX("order"), 0) INTO max_order
  FROM d_project_stages 
  WHERE "projectId" = p_project_id AND "isDeleted" = false;
  
  -- Validar que el nuevo orden esté en rango válido
  IF p_new_order < 1 OR p_new_order > max_order THEN
    RETURN QUERY SELECT false, 'Orden fuera de rango válido', 0;
    RETURN;
  END IF;
  
  -- Si el orden no cambió, no hacer nada
  IF current_order = p_new_order THEN
    RETURN QUERY SELECT true, 'Sin cambios necesarios', 0;
    RETURN;
  END IF;
  
  -- Reordenar etapas
  BEGIN
    IF current_order < p_new_order THEN
      -- Mover hacia abajo: decrementar orden de etapas intermedias
      UPDATE d_project_stages 
      SET "order" = "order" - 1, "updatedAt" = NOW(), "userId" = p_user_id
      WHERE "projectId" = p_project_id 
        AND "order" > current_order 
        AND "order" <= p_new_order
        AND "isDeleted" = false;
        
      GET DIAGNOSTICS affected_count = ROW_COUNT;
      
    ELSE
      -- Mover hacia arriba: incrementar orden de etapas intermedias
      UPDATE d_project_stages 
      SET "order" = "order" + 1, "updatedAt" = NOW(), "userId" = p_user_id
      WHERE "projectId" = p_project_id 
        AND "order" >= p_new_order 
        AND "order" < current_order
        AND "isDeleted" = false;
        
      GET DIAGNOSTICS affected_count = ROW_COUNT;
    END IF;
    
    -- Actualizar la etapa movida
    UPDATE d_project_stages 
    SET "order" = p_new_order, "updatedAt" = NOW(), "userId" = p_user_id
    WHERE id = p_stage_id;
    
    affected_count := affected_count + 1;
    
    RETURN QUERY SELECT true, 'Etapas reordenadas exitosamente', affected_count;
    
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, ('Error al reordenar: ' || SQLERRM), 0;
  END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN PARA OBTENER ETAPAS CON CATEGORÍAS
-- =====================================================

CREATE OR REPLACE FUNCTION get_project_stages_with_categories(p_project_id INTEGER)
RETURNS TABLE (
  stage_id INTEGER,
  stage_name VARCHAR,
  stage_description VARCHAR,
  stage_order INTEGER,
  stage_progress INTEGER,
  stage_status VARCHAR,
  stage_created_at TIMESTAMP,
  stage_updated_at TIMESTAMP,
  categories_count INTEGER,
  categories_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.id as stage_id,
    ps.name as stage_name,
    ps.description as stage_description,
    ps."order" as stage_order,
    ps.progress as stage_progress,
    ps.status as stage_status,
    ps."createdAt" as stage_created_at,
    ps."updatedAt" as stage_updated_at,
    
    -- Contar categorías asignadas a esta etapa (cuando implementemos la relación)
    0 as categories_count,
    
    -- JSON con datos de categorías (placeholder para futura implementación)
    '[]'::JSONB as categories_data
    
  FROM d_project_stages ps
  WHERE ps."projectId" = p_project_id 
    AND ps."isDeleted" = false
  ORDER BY ps."order" ASC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN PARA CALCULAR PROGRESO DE ETAPA
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_stage_progress(p_stage_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  calculated_progress INTEGER := 0;
BEGIN
  -- Por ahora retornamos el progreso almacenado
  -- En el futuro, esto se calculará basado en las categorías asignadas
  SELECT progress INTO calculated_progress
  FROM d_project_stages 
  WHERE id = p_stage_id AND "isDeleted" = false;
  
  RETURN COALESCE(calculated_progress, 0);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN PARA SOFT DELETE CON REORDENAMIENTO
-- =====================================================

CREATE OR REPLACE FUNCTION delete_project_stage(
  p_stage_id INTEGER,
  p_user_id INTEGER
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  reordered_stages INTEGER
) AS $$
DECLARE
  stage_project_id INTEGER;
  stage_order INTEGER;
  affected_count INTEGER := 0;
BEGIN
  -- Obtener información de la etapa a eliminar
  SELECT "projectId", "order" INTO stage_project_id, stage_order
  FROM d_project_stages 
  WHERE id = p_stage_id AND "isDeleted" = false;
  
  IF stage_project_id IS NULL THEN
    RETURN QUERY SELECT false, 'Etapa no encontrada', 0;
    RETURN;
  END IF;
  
  BEGIN
    -- Soft delete de la etapa
    UPDATE d_project_stages 
    SET "isDeleted" = true, 
        "dateDeleted" = NOW(), 
        "updatedAt" = NOW(),
        "userId" = p_user_id
    WHERE id = p_stage_id;
    
    -- Reordenar etapas posteriores (decrementar su orden)
    UPDATE d_project_stages 
    SET "order" = "order" - 1, 
        "updatedAt" = NOW(),
        "userId" = p_user_id
    WHERE "projectId" = stage_project_id 
      AND "order" > stage_order 
      AND "isDeleted" = false;
      
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    RETURN QUERY SELECT true, 'Etapa eliminada y etapas reordenadas', affected_count;
    
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT false, ('Error al eliminar: ' || SQLERRM), 0;
  END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DATOS DE PRUEBA (OPCIONAL)
-- =====================================================

-- Insertar etapas de ejemplo para proyectos existentes
-- NOTA: Solo ejecutar si quieres datos de prueba

/*
INSERT INTO d_project_stages (name, description, "projectId", "order", progress, status, "userId")
SELECT 
  stage_name,
  stage_desc,
  p.id,
  stage_order,
  0,
  'pending',
  1
FROM d_projects p
CROSS JOIN (
  VALUES 
    ('Inicio', 'Etapa inicial del proyecto', 1),
    ('Desarrollo', 'Etapa de desarrollo', 2),
    ('Testing', 'Pruebas y validación', 3),
    ('Entrega', 'Entrega final', 4)
) AS stages(stage_name, stage_desc, stage_order)
WHERE p."isDeleted" = false
  AND NOT EXISTS (
    SELECT 1 FROM d_project_stages ps 
    WHERE ps."projectId" = p.id AND ps."isDeleted" = false
  )
LIMIT 20; -- Limitar a 20 proyectos para no saturar
*/

-- =====================================================
-- COMENTARIOS Y METADATOS
-- =====================================================

COMMENT ON TABLE d_project_stages IS 
'Tabla de etapas para el módulo Project Management. Soporta drag & drop mediante el campo order, progreso calculado y estados secuenciales.';

COMMENT ON COLUMN d_project_stages."order" IS 
'Orden secuencial de la etapa dentro del proyecto. Único por proyecto, usado para drag & drop.';

COMMENT ON COLUMN d_project_stages.progress IS 
'Progreso de la etapa (0-100%). Se puede calcular automáticamente basado en categorías asignadas.';

COMMENT ON COLUMN d_project_stages.status IS 
'Estado de la etapa: pending (por iniciar), in-progress (en progreso), completed (completada).';

COMMENT ON FUNCTION reorder_project_stages IS 
'Función para reordenar etapas cuando se hace drag & drop. Mantiene la integridad del orden secuencial.';

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que la tabla se creó correctamente
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'd_project_stages'
ORDER BY ordinal_position;
