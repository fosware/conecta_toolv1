const { PrismaClient } = require('@prisma/client');

async function checkStages() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Verificando etapas existentes...');
    
    const stages = await prisma.projectStage.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        name: true,
        projectId: true,
        isDeleted: true
      }
    });
    
    console.log('Etapas encontradas:', stages);
    
    if (stages.length === 0) {
      console.log('No hay etapas en la base de datos');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkStages();
