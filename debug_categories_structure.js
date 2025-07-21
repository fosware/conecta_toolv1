import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugCategoriesStructure() {
  try {
    console.log('=== VERIFICANDO ESTRUCTURA DE CATEGORÍAS ===\n');

    // 1. Ver todas las categorías con sus projectId
    console.log('1. Todas las categorías:');
    const allCategories = await prisma.projectCategory.findMany({
      where: {
        isActive: true,
        isDeleted: false
      },
      include: {
        Project: {
          include: {
            ProjectRequestCompany: {
              include: {
                ProjectRequirements: {
                  include: {
                    ProjectRequest: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        projectId: 'asc'
      }
    });

    allCategories.forEach(cat => {
      console.log(`- ${cat.name} (ID: ${cat.id}, ProjectID: ${cat.projectId})`);
      if (cat.Project?.ProjectRequestCompany?.ProjectRequirements?.ProjectRequest) {
        const pr = cat.Project.ProjectRequestCompany.ProjectRequirements.ProjectRequest;
        console.log(`  -> ProjectRequest: "${pr.title}" (ID: ${pr.id})`);
      }
    });

    // 2. Ver qué projectIds están relacionados con ProjectRequest ID 5
    console.log('\n2. Proyectos relacionados con ProjectRequest ID 5:');
    const projectsForRequest5 = await prisma.project.findMany({
      where: {
        isDeleted: false,
        ProjectRequestCompany: {
          ProjectRequirements: {
            projectRequestId: 5
          }
        }
      },
      include: {
        ProjectCategory: {
          where: {
            isActive: true,
            isDeleted: false
          }
        },
        ProjectRequestCompany: {
          include: {
            Company: true,
            ProjectRequirements: true
          }
        }
      }
    });

    projectsForRequest5.forEach(project => {
      console.log(`- Proyecto ID: ${project.id}`);
      console.log(`  Empresa: ${project.ProjectRequestCompany?.Company?.comercialName || 'Sin nombre'}`);
      console.log(`  Categorías: ${project.ProjectCategory?.length || 0}`);
      project.ProjectCategory?.forEach(cat => {
        console.log(`    * ${cat.name}`);
      });
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCategoriesStructure();
