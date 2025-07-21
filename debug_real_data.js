import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugRealData() {
  try {
    console.log('=== VERIFICANDO DATOS REALES ===\n');

    // 1. Verificar ProjectRequest "Carcasa Nylamid"
    const projectRequest = await prisma.projectRequest.findFirst({
      where: {
        title: 'Carcasa Nylamid',
        isActive: true,
        isDeleted: false
      },
      include: {
        ProjectRequirements: {
          include: {
            ProjectRequestCompany: {
              include: {
                Company: true,
                Project: {
                  where: {
                    isDeleted: false
                  },
                  include: {
                    ProjectCategory: {
                      where: {
                        isActive: true,
                        isDeleted: false
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!projectRequest) {
      console.log('❌ No se encontró el ProjectRequest "Carcasa Nylamid"');
      return;
    }

    console.log(`✅ ProjectRequest encontrado: "${projectRequest.title}" (ID: ${projectRequest.id})`);
    console.log(`📋 Requerimientos: ${projectRequest.ProjectRequirements?.length || 0}\n`);

    // 2. Mostrar detalles de cada requerimiento
    projectRequest.ProjectRequirements?.forEach((req, index) => {
      console.log(`--- REQUERIMIENTO ${index + 1} ---`);
      console.log(`ID: ${req.id}`);
      console.log(`Descripción: "${req.description || 'Sin descripción'}"`);
      console.log(`Empresas asignadas: ${req.ProjectRequestCompany?.length || 0}`);
      
      req.ProjectRequestCompany?.forEach((company, compIndex) => {
        console.log(`  📊 Empresa ${compIndex + 1}:`);
        console.log(`     - Nombre: ${company.Company?.comercialName || company.Company?.companyName || 'Sin nombre'}`);
        console.log(`     - Proyectos: ${company.Project?.length || 0}`);
        
        company.Project?.forEach((project, projIndex) => {
          console.log(`       🎯 Proyecto ${projIndex + 1} (ID: ${project.id}):`);
          console.log(`          - Categorías: ${project.ProjectCategory?.length || 0}`);
          
          project.ProjectCategory?.forEach((category, catIndex) => {
            console.log(`            📂 Categoría ${catIndex + 1}: "${category.name}"`);
          });
        });
      });
      console.log('');
    });

    // 3. Verificar todas las categorías en la vista materializada
    console.log('--- VISTA MATERIALIZADA ---');
    const allCategories = await prisma.$queryRaw`
      SELECT 
        id, name, description, "projectId", progress, status
      FROM project_categories_with_progress
      WHERE "isActive" = true AND "isDeleted" = false
      ORDER BY "projectId", name;
    `;
    
    console.log(`✅ Total categorías en vista: ${allCategories.length}`);
    allCategories.forEach((cat, index) => {
      console.log(`${index + 1}. "${cat.name}" (Project ID: ${cat.projectId}) - Progreso: ${cat.progress}%`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugRealData();
