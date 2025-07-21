import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyViewDetailed() {
  try {
    console.log('=== VERIFICACIÓN DETALLADA DE LA VISTA ===\n');

    // 1. Verificar si existe la vista en el esquema
    console.log('1. Verificando existencia de la vista...');
    const viewExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'project_categories_with_progress'
        AND table_type = 'VIEW'
      ) as exists;
    `;
    console.log('Vista existe (information_schema):', viewExists[0]?.exists);

    // 2. Verificar si existe como vista materializada
    console.log('\n2. Verificando como vista materializada...');
    const matViewExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 
        FROM pg_matviews 
        WHERE schemaname = 'public' 
        AND matviewname = 'project_categories_with_progress'
      ) as exists;
    `;
    console.log('Vista materializada existe (pg_matviews):', matViewExists[0]?.exists);

    // 3. Listar todas las vistas materializadas
    console.log('\n3. Listando todas las vistas materializadas...');
    const allMatViews = await prisma.$queryRaw`
      SELECT schemaname, matviewname 
      FROM pg_matviews 
      WHERE schemaname = 'public';
    `;
    console.log('Vistas materializadas encontradas:', allMatViews);

    // 4. Intentar consultar la vista directamente
    console.log('\n4. Intentando consultar la vista...');
    try {
      const viewData = await prisma.$queryRaw`
        SELECT * FROM project_categories_with_progress LIMIT 3;
      `;
      console.log('Datos de la vista (primeros 3 registros):', viewData);
    } catch (error) {
      console.log('Error al consultar la vista:', error.message);
    }

    // 5. Verificar tablas base
    console.log('\n5. Verificando tablas base...');
    const categoriesCount = await prisma.projectCategory.count();
    const activitiesCount = await prisma.projectCategoryActivity.count();
    console.log(`Categorías: ${categoriesCount}, Actividades: ${activitiesCount}`);

  } catch (error) {
    console.error('Error en verificación:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyViewDetailed();
