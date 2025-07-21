import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testStagesFlow() {
  try {
    console.log('=== PROBANDO FLUJO COMPLETO DE ETAPAS ===\n');

    // 1. Verificar etapas creadas
    console.log('1. Verificando etapas creadas:');
    const stages = await prisma.projectStage.findMany({
      where: {
        isActive: true,
        isDeleted: false
      },
      include: {
        project: {
          include: {
            ProjectRequestCompany: {
              include: {
                Company: true
              }
            }
          }
        }
      },
      orderBy: [
        { projectId: 'asc' },
        { order: 'asc' }
      ]
    });

    console.log(`✅ Total etapas encontradas: ${stages.length}`);
    stages.forEach(stage => {
      const companyName = stage.project.ProjectRequestCompany?.Company?.comercialName || 'Sin nombre';
      console.log(`   - "${stage.name}" (Proyecto ${stage.projectId} - ${companyName})`);
    });

    // 2. Verificar categorías disponibles
    console.log('\n2. Verificando categorías disponibles:');
    const categories = await prisma.projectCategory.findMany({
      where: {
        isActive: true,
        isDeleted: false
      },
      orderBy: {
        projectId: 'asc'
      }
    });

    console.log(`✅ Total categorías encontradas: ${categories.length}`);
    categories.forEach(cat => {
      const assignedTo = cat.stageId ? `Etapa ${cat.stageId}` : 'Sin asignar';
      console.log(`   - "${cat.name}" (Proyecto ${cat.projectId}) -> ${assignedTo}`);
    });

    // 3. Asignar algunas categorías a etapas como ejemplo
    console.log('\n3. Asignando categorías a etapas:');
    
    // Asignar "Análisis" y "Diseño" (Proyecto 1) a "Planificación" (Etapa 5)
    const planningStageProject1 = stages.find(s => s.projectId === 1 && s.name === 'Planificación');
    const analysisCategory = categories.find(c => c.name === 'Analisis' && c.projectId === 1);
    const designCategory = categories.find(c => c.name === 'Diseño' && c.projectId === 1);

    if (planningStageProject1 && analysisCategory) {
      await prisma.projectCategory.update({
        where: { id: analysisCategory.id },
        data: { stageId: planningStageProject1.id }
      });
      console.log(`   ✅ "${analysisCategory.name}" asignada a "${planningStageProject1.name}"`);
    }

    if (planningStageProject1 && designCategory) {
      await prisma.projectCategory.update({
        where: { id: designCategory.id },
        data: { stageId: planningStageProject1.id }
      });
      console.log(`   ✅ "${designCategory.name}" asignada a "${planningStageProject1.name}"`);
    }

    // Asignar algunas categorías del Proyecto 2 a "Desarrollo"
    const developmentStageProject2 = stages.find(s => s.projectId === 2 && s.name === 'Desarrollo');
    const developmentCategory = categories.find(c => c.name === 'Desarrollo' && c.projectId === 2);
    const researchCategory = categories.find(c => c.name === 'Investigación' && c.projectId === 2);

    if (developmentStageProject2 && developmentCategory) {
      await prisma.projectCategory.update({
        where: { id: developmentCategory.id },
        data: { stageId: developmentStageProject2.id }
      });
      console.log(`   ✅ "${developmentCategory.name}" asignada a "${developmentStageProject2.name}"`);
    }

    if (developmentStageProject2 && researchCategory) {
      await prisma.projectCategory.update({
        where: { id: researchCategory.id },
        data: { stageId: developmentStageProject2.id }
      });
      console.log(`   ✅ "${researchCategory.name}" asignada a "${developmentStageProject2.name}"`);
    }

    // 4. Verificar asignaciones
    console.log('\n4. Verificando asignaciones finales:');
    const updatedCategories = await prisma.projectCategory.findMany({
      where: {
        isActive: true,
        isDeleted: false
      },
      include: {
        ProjectStage: true
      },
      orderBy: {
        projectId: 'asc'
      }
    });

    updatedCategories.forEach(cat => {
      const assignedTo = cat.ProjectStage ? `"${cat.ProjectStage.name}"` : 'Sin asignar';
      console.log(`   - "${cat.name}" (Proyecto ${cat.projectId}) -> ${assignedTo}`);
    });

    console.log('\n🎉 ¡Flujo de etapas funcionando correctamente!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testStagesFlow();
