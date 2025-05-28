import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Promisify
const readFileAsync = (path, options) => fs.promises.readFile(path, options);
const writeFileAsync = (path, data, options) => fs.promises.writeFile(path, data, options);

// Archivos a corregir
const filesToFix = [
  'src/app/api/clients/[id]/areas/[areaId]/route.ts',
  'src/app/api/clients/[id]/areas/route.ts'
];

// Función para actualizar un archivo
async function updateFile(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    const content = await readFileAsync(fullPath, 'utf8');
    
    // Buscar patrones donde handleRouteParams se usa sin await
    const pattern = /const routeParams = handleRouteParams\(.*?\);/g;
    
    if (pattern.test(content)) {
      // Reemplazar con la versión con await
      const updatedContent = content.replace(
        /const routeParams = handleRouteParams\((.*?)\);/g,
        'const routeParams = await handleRouteParams($1);'
      );
      
      // Guardar el archivo actualizado
      await writeFileAsync(fullPath, updatedContent, 'utf8');
      console.log(`✅ Actualizado: ${fullPath}`);
      return true;
    } else {
      console.log(`⏭️ Sin cambios: ${fullPath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error al procesar ${filePath}:`, error);
    return false;
  }
}

// Procesar todos los archivos
async function processAllFiles() {
  let updatedCount = 0;
  
  for (const file of filesToFix) {
    const updated = await updateFile(file);
    if (updated) updatedCount++;
  }
  
  console.log(`✅ Proceso completado. Se actualizaron ${updatedCount} archivos.`);
}

// Ejecutar el script
processAllFiles().catch(error => {
  console.error('Error en el proceso:', error);
  process.exit(1);
});
