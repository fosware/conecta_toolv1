const { PrismaClient } = require('@prisma/client');

async function testCategoryUpdate() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Probando actualización de categoría...');
    
    // Primero, obtener una categoría existente
    const category = await prisma.projectCategory.findFirst({
      where: { isDeleted: false }
    });
    
    if (!category) {
      console.log('No se encontraron categorías');
      return;
    }
    
    console.log('Categoría encontrada:', {
      id: category.id,
      name: category.name,
      stageId: category.stageId || 'null'
    });
    
    // Intentar actualizar el stageId
    console.log('Intentando actualizar stageId a 1...');
    
    const updatedCategory = await prisma.projectCategory.update({
      where: { id: category.id },
      data: {
        stageId: 1,
        updatedAt: new Date()
      }
    });
    
    console.log('Categoría actualizada exitosamente:', {
      id: updatedCategory.id,
      name: updatedCategory.name,
      stageId: updatedCategory.stageId
    });
    
    // Verificar que se guardó
    const verifyCategory = await prisma.projectCategory.findUnique({
      where: { id: category.id }
    });
    
    console.log('Verificación:', {
      id: verifyCategory.id,
      stageId: verifyCategory.stageId
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Código de error:', error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testCategoryUpdate();
