const { PrismaClient } = require('@prisma/client');

async function checkViewColumns() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Verificando columnas de la vista materializada...');
    
    // Obtener información de las columnas
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'project_categories_with_progress'
      ORDER BY ordinal_position;
    `;
    
    console.log('Columnas disponibles:', result);
    
    // También obtener una muestra de datos
    console.log('\nMuestra de datos:');
    const sample = await prisma.$queryRaw`
      SELECT * FROM project_categories_with_progress 
      LIMIT 3;
    `;
    
    console.log(sample);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkViewColumns();
