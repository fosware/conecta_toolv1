import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanTestStages() {
  try {
    console.log('=== LIMPIANDO ETAPAS DE PRUEBA ===\n');

    // 1. Desasignar todas las categorías de las etapas
    console.log('1. Desasignando categorías de etapas...');
    const updatedCategories = await prisma.projectCategory.updateMany({
      where: {
        stageId: {
          not: null
        }
      },
      data: {
        stageId: null
      }
    });
    console.log(`✅ ${updatedCategories.count} categorías desasignadas`);

    // 2. Eliminar todas las etapas de prueba
    console.log('\n2. Eliminando etapas de prueba...');
    const deletedStages = await prisma.projectStage.deleteMany({
      where: {
        // Eliminar todas las etapas ya que fueron creadas para prueba
      }
    });
    console.log(`✅ ${deletedStages.count} etapas eliminadas`);

    // 3. Verificar limpieza
    console.log('\n3. Verificando limpieza...');
    const remainingStages = await prisma.projectStage.count();
    const categoriesWithStages = await prisma.projectCategory.count({
      where: {
        stageId: {
          not: null
        }
      }
    });

    console.log(`📊 Etapas restantes: ${remainingStages}`);
    console.log(`📊 Categorías asignadas: ${categoriesWithStages}`);

    if (remainingStages === 0 && categoriesWithStages === 0) {
      console.log('\n🎉 ¡Limpieza completada exitosamente!');
      console.log('Ahora puedes crear etapas manualmente desde la interfaz.');
    } else {
      console.log('\n⚠️ Aún quedan algunos datos por limpiar.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestStages();
