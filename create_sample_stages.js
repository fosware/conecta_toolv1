import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleStages() {
  try {
    console.log('=== CREANDO ETAPAS DE EJEMPLO ===\n');

    // Obtener los projectIds para "Carcasa Nylamid"
    const projects = await prisma.project.findMany({
      where: {
        isDeleted: false,
        ProjectRequestCompany: {
          ProjectRequirements: {
            projectRequestId: 5 // Carcasa Nylamid
          }
        }
      },
      include: {
        ProjectRequestCompany: {
          include: {
            Company: true
          }
        }
      }
    });

    console.log(`Proyectos encontrados: ${projects.length}`);

    // Crear etapas para cada proyecto
    for (const project of projects) {
      const companyName = project.ProjectRequestCompany?.Company?.comercialName || 'Sin nombre';
      console.log(`\nCreando etapas para proyecto ${project.id} - ${companyName}:`);

      // Etapas comunes para ambos proyectos
      const stages = [
        {
          name: 'Planificación',
          description: 'Definición de alcance y planificación inicial',
          order: 1,
          status: 'completed'
        },
        {
          name: 'Desarrollo',
          description: 'Ejecución de las actividades principales',
          order: 2,
          status: 'in-progress'
        },
        {
          name: 'Validación',
          description: 'Pruebas y validación de resultados',
          order: 3,
          status: 'pending'
        },
        {
          name: 'Entrega',
          description: 'Entrega final y documentación',
          order: 4,
          status: 'pending'
        }
      ];

      for (const stageData of stages) {
        const stage = await prisma.projectStage.create({
          data: {
            ...stageData,
            projectId: project.id,
            userId: 1 // Usuario admin
          }
        });
        
        console.log(`  ✅ Etapa creada: "${stage.name}" (ID: ${stage.id})`);
      }
    }

    console.log('\n🎉 ¡Etapas de ejemplo creadas exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleStages();
