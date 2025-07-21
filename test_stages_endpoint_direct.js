// Script para probar el endpoint de etapas directamente
async function testStagesEndpointDirect() {
  try {
    console.log('=== PROBANDO ENDPOINT /stages DIRECTAMENTE ===\n');

    const projectRequestId = 5;
    const url = `http://localhost:3000/api/project_management/${projectRequestId}/stages`;
    
    console.log(`Consultando: ${url}`);
    
    // Crear headers básicos (sin token para ver si es problema de auth)
    const headers = {
      'Content-Type': 'application/json'
    };
    
    console.log('Enviando petición sin token...');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Status Text: ${response.statusText}`);
    
    const responseText = await response.text();
    console.log(`Response: ${responseText}`);
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('\n✅ Respuesta JSON válida:');
        console.log(JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('\n⚠️ Respuesta no es JSON válido');
      }
    } else {
      console.log('\n❌ Error en respuesta');
      
      // Si es error de auth, intentar con token dummy
      if (response.status === 401) {
        console.log('\n🔐 Intentando con token dummy...');
        const responseWithToken = await fetch(url, {
          method: 'GET',
          headers: {
            ...headers,
            'Authorization': 'Bearer dummy-token'
          }
        });
        
        const tokenResponseText = await responseWithToken.text();
        console.log(`Status con token: ${responseWithToken.status}`);
        console.log(`Response con token: ${tokenResponseText}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

testStagesEndpointDirect();
