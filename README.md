# Tooling Cluster

Sistema de gestión y certificación para empresas desarrollado con Next.js 15, Prisma y PostgreSQL. Permite administrar certificaciones, especialidades y perfiles de empresas de manera eficiente y segura.

## 🔧 Tecnologías Principales

- **Frontend**:
  - Next.js 15.1.6
  - React 19.0.0
  - Tailwind CSS 3.4.1
  - NextUI v2.6.11
  - Sonner 1.7.2 (sistema de notificaciones)
  - Zustand 5.0.2 (manejo de estado)
  - Lucide React 0.468.0
  - React Hook Form 7.54.2

- **Backend**:
  - Next.js 15.1.6 (App Router)
  - Prisma ORM 6.1.0
  - PostgreSQL
  - JWT (jose 5.9.6, jsonwebtoken 9.0.2)
  - Zod 3.24.1 (validación)
  - Axios 1.7.9

- **DevOps & Desarrollo**:
  - Docker
  - Docker Compose
  - TypeScript 5.7.3
  - ESLint 8.x
  - Prettier 3.4.2
  - TurboRepo (monorepo)

## 🚀 Requisitos Previos

- Node.js (v18 o superior)
- Docker y Docker Compose
- npm o yarn

## 📦 Instalación

1. Clonar el repositorio:
```bash
git clone [URL_DEL_REPOSITORIO]
cd conecta_toolv1
```

2. Copiar el archivo de variables de entorno:
```bash
cp .env.example .env
```

3. Instalar dependencias:
```bash
npm i --legacy-peer-deps
```

4. Ejecutar el script de configuración:
```bash
./setup.sh
```

> **Nota**: Si el script no es ejecutable, puedes darle permisos con:
> ```bash
> chmod +x setup.sh
> ```

## 🛠️ Comandos Útiles

### Desarrollo

- Iniciar el servidor de desarrollo:
```bash
npm run dev
```

- Limpiar caché y reconstruir:
```bash
rm -rf .next .turbo node_modules/.cache && npm run build && npm run start
```
> **Nota**: Este comando limpia todas las cachés (Next.js, Turborepo y node_modules), útil cuando hay problemas de build o comportamientos inesperados.

### Base de Datos

- Levantar contenedores Docker:
```bash
docker-compose up -d
```

- Detener contenedores:
```bash
docker-compose down
```

- Ver logs de la base de datos:
```bash
docker-compose logs -f db
```

- Reiniciar la base de datos:
```bash
docker-compose restart db
```

### Prisma

- Generar cliente Prisma:
```bash
npx prisma generate
```

- Aplicar migraciones:
```bash
npx prisma migrate deploy
```

- Resetear la base de datos:
```bash
npx prisma migrate reset --force
```

- Cargar datos iniciales (seeds):
```bash
npm run prisma:seed
```

## 🗄️ Estructura del Proyecto

```
conecta_toolv1/
├── prisma/              # Esquemas y migraciones de base de datos
│   ├── schema.prisma    # Definición del modelo de datos
│   ├── migrations/      # Migraciones de la base de datos
│   └── seeds/           # Datos iniciales
├── src/
│   ├── app/             # Rutas y páginas de Next.js
│   ├── components/      # Componentes React reutilizables
│   └── lib/             # Utilidades y configuraciones
├── public/              # Archivos estáticos
└── docker-compose.yml   # Configuración de Docker
```

## 🔧 Configuración

### Variables de Entorno

Asegúrate de configurar las siguientes variables en tu archivo `.env`:

```env
DATABASE_URL="postgresql://admin:password@localhost:5432/conecta_toolv1?schema=public"
JWT_SECRET="tu_secreto_jwt"
```

### Docker

El proyecto utiliza Docker para la base de datos PostgreSQL. La configuración se encuentra en `docker-compose.yml`.

## 🚨 Solución de Problemas

### Problemas Comunes

1. **Error de conexión a la base de datos**
   - Verificar que Docker esté corriendo
   - Comprobar las credenciales en el archivo `.env`
   - Reiniciar el contenedor de la base de datos

2. **Error al cargar las semillas**
   - Asegurarse de que la base de datos está corriendo
   - Verificar que las migraciones se han aplicado
   - Ejecutar `npx prisma migrate reset --force` para un reinicio completo

## 💻 Convenciones de Desarrollo

### Patrones de UI/UX

1. **Actualización de Estado**
   - Implementar actualización optimista para mejor experiencia de usuario
   - Incluir rollback en caso de error
   - Mostrar feedback visual con toast notifications
   - Deshabilitar controles durante operaciones asíncronas

2. **Componentes**
   - Utilizar shadcn/ui para componentes base
   - Iconos de Lucide React
   - Modales de confirmación para acciones destructivas
   - Selects anidados con limpieza de estado dependiente

### Rutas API

1. **Next.js App Router**
   - Usar `await params` en rutas dinámicas
   - Manejar errores HTTP con mensajes descriptivos
   - Implementar validación de datos con Zod
   - Seguir el patrón RESTful para endpoints

2. **Manejo de Estado**
   - Actualización optimista antes de llamadas API
   - Rollback automático en caso de error
   - Mantener consistencia en mensajes de error/éxito
   - Limpiar estado de modales/formularios después de operaciones

### Estilo y Formato

1. **TypeScript**
   - Tipos explícitos para props y estados
   - Interfaces para modelos de datos
   - Evitar `any` y `as`
   - Documentar funciones complejas

2. **CSS/Tailwind**
   - Seguir la guía de estilos de Tailwind
   - Usar variables CSS para temas consistentes
   - Mantener responsividad en todos los componentes
   - Priorizar clases utilitarias sobre CSS personalizado
