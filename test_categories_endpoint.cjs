const { PrismaClient } = require('@prisma/client');

async function testCategoriesEndpoint() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Probando consulta corregida del endpoint...');
    
    const projectIds = [1, 2]; // IDs de proyectos que estás usando
    
    // Simular la consulta del endpoint corregido
    const categories = await prisma.$queryRaw`
      SELECT 
        c.id,
        c.name,
        c.description,
        c."projectId",
        c."stageId",
        COALESCE(v.progress, 0) as progress,
        COALESCE(v.status, 'pending') as status,
        COALESCE(v.total_active_activities, 0) as total_active_activities,
        COALESCE(v.completed_activities, 0) as completed_activities,
        COALESCE(v.in_progress_activities, 0) as in_progress_activities,
        COALESCE(v.pending_activities, 0) as pending_activities,
        COALESCE(v.cancelled_activities, 0) as cancelled_activities
      FROM c_project_categories c
      LEFT JOIN project_categories_with_progress v ON c.id = v.id
      WHERE c."projectId" = ANY(${projectIds})
        AND c."isActive" = true
        AND c."isDeleted" = false
      ORDER BY c."projectId", c.name;
    `;
    
    console.log('Total categorías:', categories.length);
    console.log('Categorías con stageId:', categories.filter(cat => cat.stageId).length);
    console.log('Detalle de categorías con stageId:');
    categories.filter(cat => cat.stageId).forEach(cat => {
      console.log(`  - ID: ${cat.id}, Nombre: ${cat.name}, StageId: ${cat.stageId}`);
    });
    
    console.log('\nTodas las categorías:');
    categories.forEach(cat => {
      console.log(`  - ID: ${cat.id}, Nombre: ${cat.name}, StageId: ${cat.stageId || 'null'}, Progress: ${cat.progress}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCategoriesEndpoint();
