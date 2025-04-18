#!/usr/bin/env node

/**
 * Script para corregir el problema de TypeScript con los parámetros de ruta en Next.js 15
 * Este script busca todos los archivos de ruta API y actualiza la forma en que manejan los parámetros
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Obtener el directorio actual en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio raíz de las rutas API
const API_ROUTES_DIR = path.join(process.cwd(), 'src', 'app', 'api');

// Función para buscar archivos de ruta recursivamente
function findRouteFiles(dir) {
  const files = [];
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      // Si es un directorio, buscar recursivamente
      files.push(...findRouteFiles(itemPath));
    } else if (item === 'route.ts' || item === 'route.js') {
      // Si es un archivo de ruta, agregarlo a la lista
      files.push(itemPath);
    }
  }
  
  return files;
}

// Función para verificar si un archivo de ruta tiene parámetros dinámicos
function hasRouteParams(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  // Buscar patrones como { params }: { params: { id: string } }
  return content.includes('params:') && content.includes('{ params }');
}

// Función para actualizar un archivo de ruta
function updateRouteFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Verificar si ya importa la utilidad
  const hasImport = content.includes('import { handleRouteParams }') || 
                    content.includes('import {handleRouteParams}');
  
  // Agregar la importación si no existe
  if (!hasImport) {
    // Buscar la última importación
    const importRegex = /import.*from.*;\n/g;
    let lastImportMatch;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      lastImportMatch = match;
    }
    
    if (lastImportMatch) {
      const insertPosition = lastImportMatch.index + lastImportMatch[0].length;
      content = content.slice(0, insertPosition) + 
                'import { handleRouteParams } from "@/lib/route-params";\n' + 
                content.slice(insertPosition);
    } else {
      // Si no hay importaciones, agregar al principio
      content = 'import { handleRouteParams } from "@/lib/route-params";\n' + content;
    }
  }
  
  // Buscar y reemplazar el uso de params.id o desestructuración de params
  const paramsRegex = /const\s*{\s*([^}]+)\s*}\s*=\s*params/g;
  const directParamsRegex = /params\.([a-zA-Z0-9_]+)/g;
  
  // Reemplazar desestructuración
  content = content.replace(paramsRegex, (match, paramNames) => {
    return `const routeParams = handleRouteParams(params);\nconst { ${paramNames} } = routeParams`;
  });
  
  // Reemplazar acceso directo a propiedades
  if (!content.includes('routeParams')) {
    content = content.replace(directParamsRegex, (match, paramName) => {
      // Solo agregar la declaración de routeParams si no existe ya
      if (!content.includes('const routeParams = handleRouteParams(params)')) {
        // Buscar la primera línea después de la función que maneja la ruta
        const functionBodyStart = content.indexOf('{', content.indexOf('export async function'));
        if (functionBodyStart !== -1) {
          const insertPosition = content.indexOf('\n', functionBodyStart) + 1;
          content = content.slice(0, insertPosition) + 
                    '  const routeParams = handleRouteParams(params);\n' + 
                    content.slice(insertPosition);
        }
      }
      return `routeParams.${paramName}`;
    });
  }
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Actualizado: ${path.relative(process.cwd(), filePath)}`);
}

// Función principal
function main() {
  console.log('Buscando archivos de ruta API...');
  const routeFiles = findRouteFiles(API_ROUTES_DIR);
  console.log(`Se encontraron ${routeFiles.length} archivos de ruta.`);
  
  let updatedCount = 0;
  
  for (const file of routeFiles) {
    if (hasRouteParams(file)) {
      updateRouteFile(file);
      updatedCount++;
    }
  }
  
  console.log(`\nSe actualizaron ${updatedCount} archivos de ruta.`);
  console.log('\nPara completar la corrección, ejecuta:');
  console.log('npm run build');
}

main();
