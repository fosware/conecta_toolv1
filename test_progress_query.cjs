const { PrismaClient } = require('@prisma/client');

async function testProgressQuery() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Probando consulta de progreso...');
    
    const stageId = 9; // La etapa que estás usando
    
    // Probar la consulta corregida
    const categoriesWithProgress = await prisma.$queryRaw`
      SELECT progress 
      FROM project_categories_with_progress 
      WHERE id IN (
        SELECT id FROM c_project_categories 
        WHERE "stageId" = ${stageId} AND "isDeleted" = false
      )
    `;
    
    console.log('Categorías con progreso para etapa', stageId, ':', categoriesWithProgress);
    
    // También mostrar qué categorías están asignadas a esa etapa
    const assignedCategories = await prisma.$queryRaw`
      SELECT id, name, "stageId" 
      FROM c_project_categories 
      WHERE "stageId" = ${stageId} AND "isDeleted" = false
    `;
    
    console.log('Categorías asignadas a etapa', stageId, ':', assignedCategories);
    
    if (categoriesWithProgress.length > 0) {
      const totalProgress = categoriesWithProgress.reduce((sum, cat) => sum + (cat.progress || 0), 0);
      const averageProgress = Math.round(totalProgress / categoriesWithProgress.length);
      console.log('Progreso promedio calculado:', averageProgress + '%');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Código:', error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testProgressQuery();
