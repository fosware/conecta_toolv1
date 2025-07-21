import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugStagesEndpoint() {
  try {
    console.log('=== DEBUGGEANDO ENDPOINT DE ETAPAS ===\n');

    // 1. Verificar que el ProjectRequest existe
    console.log('1. Verificando ProjectRequest ID 5:');
    const projectRequest = await prisma.projectRequest.findFirst({
      where: {
        id: 5,
        isActive: true,
        isDeleted: false
      }
    });

    if (projectRequest) {
      console.log(`✅ ProjectRequest encontrado: "${projectRequest.title}"`);
    } else {
      console.log('❌ ProjectRequest no encontrado');
      return;
    }

    // 2. Verificar proyectos relacionados
    console.log('\n2. Verificando proyectos relacionados:');
    const relatedProjects = await prisma.project.findMany({
      where: {
        isDeleted: false,
        ProjectRequestCompany: {
          ProjectRequirements: {
            projectRequestId: 5
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

    console.log(`✅ Proyectos relacionados encontrados: ${relatedProjects.length}`);
    relatedProjects.forEach(project => {
      const companyName = project.ProjectRequestCompany?.Company?.comercialName || 'Sin nombre';
      console.log(`   - Proyecto ID: ${project.id} - ${companyName}`);
    });

    const projectIds = relatedProjects.map(p => p.id);

    // 3. Verificar etapas existentes
    console.log('\n3. Verificando etapas existentes:');
    const stages = await prisma.projectStage.findMany({
      where: {
        projectId: {
          in: projectIds
        },
        isDeleted: false
      },
      orderBy: {
        order: 'asc'
      }
    });

    console.log(`✅ Etapas encontradas: ${stages.length}`);
    stages.forEach(stage => {
      console.log(`   - "${stage.name}" (Proyecto ${stage.projectId}, Orden: ${stage.order})`);
    });

    // 4. Probar la lógica del endpoint manualmente
    console.log('\n4. Simulando lógica del endpoint:');
    
    // Simular detección de ID
    const inputId = 5;
    console.log(`Input ID: ${inputId}`);

    // Intentar como Project ID
    let project = await prisma.project.findFirst({
      where: {
        id: inputId,
        isDeleted: false
      }
    });

    let finalProjectIds = [];
    
    if (project) {
      console.log(`✅ Encontrado como Project ID directo`);
      finalProjectIds = [project.id];
    } else {
      console.log(`❌ No encontrado como Project ID, intentando como ProjectRequest ID`);
      
      const relatedProjects = await prisma.project.findMany({
        where: {
          isDeleted: false,
          ProjectRequestCompany: {
            ProjectRequirements: {
              projectRequestId: inputId
            }
          }
        }
      });
      
      if (relatedProjects.length > 0) {
        console.log(`✅ Encontrado como ProjectRequest ID con ${relatedProjects.length} proyectos`);
        finalProjectIds = relatedProjects.map(p => p.id);
      } else {
        console.log(`❌ No encontrado como ProjectRequest ID`);
      }
    }

    console.log(`Final Project IDs: [${finalProjectIds.join(', ')}]`);

    // 5. Verificar vista materializada
    console.log('\n5. Verificando vista materializada:');
    if (finalProjectIds.length > 0) {
      const categoriesData = await prisma.$queryRaw`
        SELECT 
          id,
          name,
          description,
          "projectId",
          progress,
          status
        FROM project_categories_with_progress 
        WHERE "projectId" = ANY(${finalProjectIds}) 
          AND "isDeleted" = false
        ORDER BY name
      `;
      
      console.log(`✅ Categorías en vista: ${categoriesData.length}`);
      categoriesData.forEach(cat => {
        console.log(`   - "${cat.name}" (Proyecto ${cat.projectId})`);
      });
    }

    console.log('\n🔍 Diagnóstico completo terminado');

  } catch (error) {
    console.error('❌ Error en debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugStagesEndpoint();
