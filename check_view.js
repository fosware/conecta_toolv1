import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkView() {
  try {
    console.log('=== VERIFICACIÓN RÁPIDA ===\n');
    
    // 1. Verificar vista materializada
    const viewExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'project_categories_with_progress'
      );
    `;
    console.log('Vista materializada existe:', viewExists[0].exists);
    
    if (viewExists[0].exists) {
      // 2. Ver contenido
      const viewData = await prisma.$queryRaw`
        SELECT * FROM project_categories_with_progress LIMIT 5;
      `;
      console.log('Registros en vista:', viewData.length);
      
      if (viewData.length > 0) {
        console.log('Primer registro:', viewData[0]);
      }
    }
    
    // 3. Verificar categorías base
    const categories = await prisma.projectCategory.count({
      where: { isDeleted: false }
    });
    console.log('Categorías en tabla base:', categories);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkView();
