-- Agregar campo stageId a ProjectCategory para asignar categorías a etapas
ALTER TABLE c_project_categories 
ADD COLUMN stage_id INTEGER NULL;

-- Agregar foreign key constraint
ALTER TABLE c_project_categories 
ADD CONSTRAINT fk_project_category_stage 
FOREIGN KEY (stage_id) REFERENCES d_project_stages(id);

-- Agregar índice para optimización
CREATE INDEX idx_project_categories_stage_id ON c_project_categories(stage_id);

-- Comentario para documentar el cambio
COMMENT ON COLUMN c_project_categories.stage_id IS 'ID de la etapa a la que pertenece esta categoría (opcional)';
