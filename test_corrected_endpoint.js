// Script para probar el endpoint corregido de categorías
async function testCorrectedEndpoint() {
  try {
    console.log('=== PROBANDO ENDPOINT CORREGIDO ===\n');

    // Probar con projectRequestId = 5 (Carcasa Nylamid)
    const projectRequestId = 5;
    const url = `http://localhost:3000/api/project_management/${projectRequestId}/categories`;
    
    console.log(`Consultando: ${url}`);
    
    const response = await fetch(url);
    
    console.log(`Status: ${response.status}`);
    console.log(`Status Text: ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ Respuesta exitosa:');
      console.log(`📊 Total categorías encontradas: ${data.length}`);
      
      if (data.length > 0) {
        console.log('\n📋 Lista de categorías:');
        data.forEach((cat, index) => {
          console.log(`${index + 1}. "${cat.name}" (Project ID: ${cat.projectId})`);
          console.log(`   - Progreso: ${cat.progress}%`);
          console.log(`   - Estado: ${cat.status}`);
          console.log(`   - Actividades: ${cat.activities?.length || 0}`);
          console.log('');
        });
        
        // Verificar que tenemos las 7 categorías esperadas
        const expectedCategories = [
          'Analisis', 'Diseño', 'Desarrollo', 'Investigación', 
          'Pruebas', 'Puesta a punto', 'Propuestas'
        ];
        
        const foundCategories = data.map(cat => cat.name);
        const missingCategories = expectedCategories.filter(name => 
          !foundCategories.includes(name)
        );
        
        if (missingCategories.length === 0) {
          console.log('🎉 ¡Todas las categorías esperadas están presentes!');
        } else {
          console.log('⚠️ Categorías faltantes:', missingCategories);
        }
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

testCorrectedEndpoint();
