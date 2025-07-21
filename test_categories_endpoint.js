// Script para probar el endpoint de categorías
async function testCategoriesEndpoint() {
  try {
    console.log('=== PROBANDO ENDPOINT DE CATEGORÍAS ===\n');

    // Probar con projectId = 2 (que sabemos que existe)
    const projectId = 2;
    const url = `http://localhost:3000/api/project_management/${projectId}/categories`;
    
    console.log(`Consultando: ${url}`);
    
    const response = await fetch(url);
    
    console.log(`Status: ${response.status}`);
    console.log(`Status Text: ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ Respuesta exitosa:');
      console.log(JSON.stringify(data, null, 2));
      
      console.log(`\n📊 Resumen:`);
      console.log(`- Total categorías: ${data.length}`);
      
      if (data.length > 0) {
        console.log(`- Ejemplo de categoría:`);
        console.log(`  - Nombre: ${data[0].name}`);
        console.log(`  - Progreso: ${data[0].progress}%`);
        console.log(`  - Estado: ${data[0].status}`);
        console.log(`  - Actividades: ${data[0].activities?.length || 0}`);
      }
    } else {
      const errorData = await response.text();
      console.log('\n❌ Error en respuesta:');
      console.log(errorData);
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

testCategoriesEndpoint();
