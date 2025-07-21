const { PrismaClient } = require('@prisma/client');

async function checkCategoryColumns() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Verificando columnas de c_project_categories...');
    
    // Obtener información de las columnas
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'c_project_categories'
      ORDER BY ordinal_position;
    `;
    
    console.log('Columnas de c_project_categories:', columns);
    
    // También obtener una muestra con todas las columnas
    console.log('\nMuestra de datos:');
    const sample = await prisma.$queryRaw`
      SELECT * FROM c_project_categories 
      WHERE id = 7
      LIMIT 1;
    `;
    
    console.log('Categoría ID 7:', sample);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategoryColumns();
