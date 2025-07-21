import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createViewDirect() {
  try {
    console.log('Creando vista materializada directamente...');
    
    // Eliminar vista si existe
    await prisma.$executeRaw`DROP MATERIALIZED VIEW IF EXISTS project_categories_with_progress CASCADE;`;
    
    // Crear vista materializada
    await prisma.$executeRaw`
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
        
        -- Métricas de actividades (calculadas)
        COALESCE(stats.total_active_activities, 0) as total_active_activities,
        COALESCE(stats.completed_activities, 0) as completed_activities,
        COALESCE(stats.in_progress_activities, 0) as in_progress_activities,
        COALESCE(stats.pending_activities, 0) as pending_activities,
        COALESCE(stats.cancelled_activities, 0) as cancelled_activities,
        
        -- Progreso calculado
        COALESCE(stats.progress, 0) as progress,
        
        -- Status calculado
        COALESCE(stats.status, 'pending') as status
        
      FROM c_project_categories pc
      LEFT JOIN (
        SELECT 
          pca."projectCategoryId",
          COUNT(*) FILTER (WHERE pca."isDeleted" = false AND pca."isActive" = true) as total_active_activities,
          COUNT(*) FILTER (WHERE pca."isDeleted" = false AND pca."isActive" = true AND status.name = 'Completado') as completed_activities,
          COUNT(*) FILTER (WHERE pca."isDeleted" = false AND pca."isActive" = true AND status.name = 'En Progreso') as in_progress_activities,
          COUNT(*) FILTER (WHERE pca."isDeleted" = false AND pca."isActive" = true AND status.name = 'Pendiente') as pending_activities,
          COUNT(*) FILTER (WHERE pca."isDeleted" = false AND pca."isActive" = true AND status.name = 'Cancelado') as cancelled_activities,
          
          -- Progreso: actividades completadas / actividades activas * 100
          CASE 
            WHEN COUNT(*) FILTER (WHERE pca."isDeleted" = false AND pca."isActive" = true) = 0 THEN 0
            ELSE ROUND(
              (COUNT(*) FILTER (WHERE pca."isDeleted" = false AND pca."isActive" = true AND status.name = 'Completado')::DECIMAL / 
               COUNT(*) FILTER (WHERE pca."isDeleted" = false AND pca."isActive" = true)::DECIMAL) * 100, 0
            )
          END as progress,
          
          -- Status basado en progreso
          CASE 
            WHEN COUNT(*) FILTER (WHERE pca."isDeleted" = false AND pca."isActive" = true) = 0 THEN 'pending'
            WHEN COUNT(*) FILTER (WHERE pca."isDeleted" = false AND pca."isActive" = true AND status.name = 'Completado') = 
                 COUNT(*) FILTER (WHERE pca."isDeleted" = false AND pca."isActive" = true) THEN 'completed'
            WHEN COUNT(*) FILTER (WHERE pca."isDeleted" = false AND pca."isActive" = true AND status.name IN ('Completado', 'En Progreso')) > 0 THEN 'in-progress'
            ELSE 'pending'
          END as status
          
        FROM d_project_category_activities pca
        LEFT JOIN c_project_category_activity_status status ON pca."projectCategoryActivityStatusId" = status.id
        GROUP BY pca."projectCategoryId"
      ) stats ON pc.id = stats."projectCategoryId"
      WHERE pc."isDeleted" = false;
    `;
    
    // Crear índices
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_project_categories_progress_id 
      ON project_categories_with_progress (id);
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_project_categories_progress_project_id 
      ON project_categories_with_progress ("projectId");
    `;
    
    console.log('✅ Vista materializada creada exitosamente');
    
    // Verificar contenido
    const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM project_categories_with_progress;`;
    console.log('Registros en vista:', count[0].count);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createViewDirect();
