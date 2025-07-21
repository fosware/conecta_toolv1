const { PrismaClient } = require('@prisma/client');

async function checkTableNames() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Verificando nombres de tablas...');
    
    // Obtener todas las tablas que contienen "category" o "categories"
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%categor%' OR table_name LIKE '%stage%')
      ORDER BY table_name;
    `;
    
    console.log('Tablas encontradas:', tables);
    
    // También verificar si podemos acceder directamente con Prisma
    console.log('\nProbando acceso con Prisma...');
    
    try {
      const categories = await prisma.projectCategory.findFirst();
      console.log('✅ prisma.projectCategory funciona');
      console.log('Muestra:', categories);
    } catch (error) {
      console.log('❌ prisma.projectCategory error:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTableNames();
