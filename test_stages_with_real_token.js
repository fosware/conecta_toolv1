// Script para probar el endpoint con token real desde cookies del navegador
async function testWithRealToken() {
  try {
    console.log('=== PROBANDO ENDPOINT CON TOKEN REAL ===\n');

    const projectRequestId = 5;
    const url = `http://localhost:3000/api/project_management/${projectRequestId}/stages`;
    
    // Token real que deberías obtener del navegador (cookies o localStorage)
    // Reemplaza este token con uno válido de tu sesión
    const realToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczNzQxMzMzNywiZXhwIjoxNzM3NDE2OTM3fQ.dummy"; // Reemplazar con token real
    
    console.log(`Consultando: ${url}`);
    console.log(`Token usado: ${realToken.substring(0, 50)}...`);
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${realToken}`
    };
    
    console.log('Enviando petición con token real...');
    
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
      
      // Intentar obtener más detalles del error
      try {
        const errorData = JSON.parse(responseText);
        console.log('Detalles del error:', errorData);
      } catch (e) {
        console.log('Error no es JSON válido');
      }
    }
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

console.log('NOTA: Reemplaza el token dummy con un token real de tu sesión del navegador');
console.log('Puedes obtenerlo de las cookies o localStorage en las herramientas de desarrollador\n');

testWithRealToken();
