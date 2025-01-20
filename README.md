# Conecta Tool v1

Sistema de gestión y certificación desarrollado con Next.js 15, Prisma y PostgreSQL.

## 🔧 Tecnologías Principales

- **Frontend**:
  - Next.js 15.1.0
  - React 19.0.0
  - Tailwind CSS
  - NextUI v2.6.11
  - Sonner 1.7.2 (notificaciones)
  - Framer Motion 11.18.0
  - Zustand 5.0.2 (manejo de estado)

- **Backend**:
  - Next.js 15.1.0 (App Router)
  - Prisma ORM 6.1.0
  - PostgreSQL
  - JWT (jose 5.9.6)
  - Zod 3.24.1 (validación)

- **DevOps**:
  - Docker
  - Docker Compose
  - TurboRepo (desarrollo)

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

3. Ejecutar el script de configuración:
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
├── prisma/                 # Esquemas y migraciones de base de datos
│   ├── schema.prisma      # Definición del modelo de datos
│   ├── migrations/        # Migraciones de la base de datos
│   └── seeds/            # Datos iniciales
├── src/
│   ├── app/              # Rutas y páginas de Next.js
│   ├── components/       # Componentes React reutilizables
│   └── lib/             # Utilidades y configuraciones
├── public/              # Archivos estáticos
└── docker-compose.yml   # Configuración de Docker
```

## 🔧 Configuración

### Variables de Entorno

Asegúrate de configurar las siguientes variables en tu archivo `.env`:

```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/conecta_toolv1?schema=public"
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

## 📝 Contribuir

1. Crear una rama para tu feature
2. Hacer commit de tus cambios
3. Empujar los cambios a tu rama
4. Crear un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia [TU_LICENCIA].
