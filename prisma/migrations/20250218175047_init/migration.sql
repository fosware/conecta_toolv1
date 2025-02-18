-- CreateTable
CREATE TABLE "v_company_profile" (
    "id" INTEGER NOT NULL,
    "nombre_comercial" TEXT NOT NULL,
    "razon_social" TEXT NOT NULL,
    "logros" TEXT,
    "semblanza" TEXT,
    "contato_ventas" TEXT,
    "maquinas_principales" INTEGER,
    "total_empleados" INTEGER,
    "telefono" TEXT,
    "correo" TEXT,
    "liga_semblanza" TEXT,
    "sitio_web" TEXT,
    "certificaciones" JSONB NOT NULL,
    "especialidades" JSONB NOT NULL,

    CONSTRAINT "v_company_profile_pkey" PRIMARY KEY ("id")
);
