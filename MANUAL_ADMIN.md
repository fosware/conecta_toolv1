# Manual de Usuario – Administrador

¡Bienvenido a Conecta Tool! Esta guía está diseñada para ayudarte a navegar y aprovechar al máximo todas las funcionalidades que la plataforma tiene para ofrecer.

[Ir al Inicio](#manual-de-usuario--administrador)

---

### **Índice General**

1.  [Introducción](#1-introducción)
2.  [Módulo de Configuración (Catálogos)](#2-módulo-de-configuración-catálogos)
3.  [Módulo de Empresas (Asociados)](#3-módulo-de-empresas-asociados)
4.  [Módulo de Solicitudes de Proyecto](#4-módulo-de-solicitudes-de-proyecto)
5.  [Módulo de Gestión de Proyectos](#5-módulo-de-gestión-de-proyectos-project-management)
6.  [Módulo de Reportes](#6-módulo-de-reportes)

---

## **1. Introducción**

### **1.1. ¡Bienvenido a Conecta Tool!**

Conecta Tool es una plataforma integral diseñada para la gestión y certificación de empresas, optimizando la conexión entre clientes y asociados calificados. Como administrador, tienes acceso completo a todas las herramientas para configurar, supervisar y gestionar cada aspecto del sistema.

### **1.2. ¿Qué es Conecta Tool?**

Es un ecosistema digital que permite:
*   **Centralizar la información**: Administra empresas, certificaciones, especialidades y proyectos desde un solo lugar.
*   **Optimizar procesos**: Automatiza la búsqueda de proveedores calificados para nuevas solicitudes de proyecto.
*   **Garantizar la calidad**: Supervisa el cumplimiento de certificaciones y el avance de los proyectos en tiempo real.
*   **Facilitar la colaboración**: Conecta a clientes, asociados y administradores en un flujo de trabajo transparente.

### **1.3. Navegación Principal y Dashboard**

Al iniciar sesión, serás recibido por el **Dashboard**, tu centro de operaciones. Aquí encontrarás un resumen visual del estado general de la plataforma.

El menú de navegación lateral te da acceso rápido a los módulos principales:

*   **Dashboard**: Tu página de inicio con métricas clave.
*   **Usuarios**: Para gestionar las cuentas de usuario y sus roles.
*   **Clientes**: Administra la cartera de clientes y sus áreas de contacto.
*   **Empresas**: El corazón de la gestión de asociados, donde puedes crear, editar y calificar perfiles.
*   **Catálogos**:
    *   **Certificaciones**: Define las certificaciones que el sistema reconocerá.
    *   **Especialidades**: Configura las áreas de expertise, junto con sus alcances y sub-alcances.
*   **Solicitudes de Proyecto**: Inicia y gestiona nuevas oportunidades de negocio.
*   **Gestión de Proyectos**: Supervisa el ciclo de vida de los proyectos activos.
*   **Reportes**: Genera informes detallados sobre las empresas registradas.

[Volver al Índice](#índice-general)

---

## **2. Módulo de Configuración (Catálogos)**

El corazón de Conecta Tool reside en sus catálogos. Mantener esta información actualizada y bien estructurada es clave para que el sistema funcione de manera eficiente. Desde aquí, alimentarás la base de datos con la que los demás módulos operan.

### **2.1. Gestión de Usuarios y Roles**

En la sección **Usuarios**, puedes gestionar todas las cuentas que acceden a la plataforma.

*   **Cómo crear un usuario**:
    1.  Haz clic en el botón `Agregar Usuario`.
    2.  Completa el formulario con los siguientes datos:
        *   `Nombre de Usuario`: Identificador único para iniciar sesión.
        *   `Correo Electrónico`: Email del usuario.
        *   `Contraseña`: Asigna una contraseña segura.
        *   `Rol`: Define los permisos del usuario (`Admin`, `Asociado`, `Staff`).
    3.  Guarda los cambios. El usuario ya podrá acceder a la plataforma.

*   **Acciones disponibles**: En la tabla de usuarios, puedes `editar` la información de un usuario o `desactivarlo` para revocar su acceso sin eliminar su historial.

### **2.2. Gestión de Clientes y Áreas**

Este módulo te permite administrar tu cartera de clientes y sus puntos de contacto.

*   **Paso 1: Crear un Cliente**:
    1.  Ve a la sección `Clientes` y haz clic en `Agregar Cliente`.
    2.  Rellena la información fiscal de la empresa cliente:
        *   `Nombre`: Razón social.
        *   `Dirección registrada` y `RFC`.

*   **Paso 2: Gestionar Áreas de Cliente**:
    1.  Una vez creado el cliente, haz clic en el icono de `Áreas` en la tabla.
    2.  Dentro del modal, podrás añadir las diferentes áreas o departamentos del cliente (ej. Compras, Ingeniería).
    3.  Para cada área, especifica:
        *   `Nombre del Área`.
        *   `Nombre del Contacto`, `Email` y `Teléfono`.

> **Nota**: Esta estructura es fundamental, ya que las **solicitudes de proyecto** se asocian directamente a un área de cliente, no solo al cliente.

### **2.3. Gestión de Certificaciones**

Las certificaciones son cruciales para calificar a las empresas. En el catálogo `Catálogos > Certificaciones`, puedes:

*   **Crear una certificación**: Simplemente haz clic en `Agregar` y proporciona el `Nombre` (ej. ISO 9001:2015) y una `Descripción` opcional.
*   **Editar y eliminar**: Gestiona las certificaciones existentes directamente desde la tabla.

Estas certificaciones aparecerán como opciones al calificar a una empresa o al definir los requisitos de un proyecto.

### **2.4. Gestión de Especialidades, Alcances y Sub-Alcances**

Este es uno de los catálogos más potentes y detallados. Te permite crear una estructura jerárquica para clasificar las capacidades técnicas de los asociados.

*   **Nivel 1: Especialidades**: Ve a `Catálogos > Especialidades`. Aquí creas la categoría más alta (ej. *Maquinados*, *Inyección de Plástico*, *Diseño y Desarrollo*).
*   **Nivel 2: Alcances**: Dentro de la pantalla de especialidades, puedes seleccionar una y gestionar sus `Alcances`. Un alcance es un subnivel de la especialidad (ej. para *Maquinados*, un alcance podría ser *Torno CNC* o *Fresado*).
*   **Nivel 3: Sub-Alcances**: De manera similar, dentro de un alcance, puedes definir `Sub-Alcances` para el máximo nivel de detalle (ej. para *Torno CNC*, un sub-alcance podría ser *Torno de 5 ejes*).

> **Consejo**: Una estructura bien definida aquí es la clave para que el sistema encuentre al asociado ideal para cada requerimiento de proyecto de forma automática.

### **2.5. Otros Catálogos**

Adicionalmente, puedes gestionar otros catálogos de soporte desde el menú de configuración, como los **estados de la república** (usados en los perfiles de empresa) y los **tipos de proyecto**.

[Volver al Índice](#índice-general)

---

## **3. Módulo de Empresas (Asociados)**

Este módulo es el núcleo de la gestión de proveedores. Aquí puedes registrar, calificar y mantener actualizada la información de todas las empresas asociadas para que el sistema pueda encontrar al candidato perfecto para cada proyecto.

### **3.1. Flujo de Gestión de Empresas**

El proceso para dar de alta y calificar a una empresa es un flujo integral:

1.  **Crear el Perfil Básico**: Desde la tabla principal, haz clic en `Agregar Empresa`. Esto abre un formulario para registrar la información esencial de la empresa.
2.  **Completar la Información**: Llena todos los campos, desde datos de contacto hasta su capacidad productiva. Un perfil completo es crucial.
3.  **Asignar Certificaciones**: Una vez creada la empresa, usa el icono de **certificaciones** (🏆) en la tabla. Aquí adjuntas las certificaciones que posee la empresa, sus fechas de vencimiento y los documentos de respaldo.
4.  **Asignar Especialidades**: Con el icono de **especialidades** (🛠️), defines las capacidades técnicas de la empresa, navegando por la jerarquía de especialidad, alcance y sub-alcance.
5.  **Vincular Usuarios**: Finalmente, con el icono de **usuarios** (👤), asignas las cuentas de usuario (previamente creadas con rol `Asociado`) que podrán gestionar este perfil.

### **3.2. Crear y Editar Empresas: El Formulario a Detalle**

El formulario para `Crear/Editar Empresa` es exhaustivo para asegurar que no falte información clave. Se divide en:

*   **Datos de Identificación**:
    *   `Logo de la empresa`: La imagen corporativa.
    *   `Nombre comercial` y `Razón social`.
    *   `Contacto Principal de Ventas`, `Correo Electrónico` y `Teléfono`.
*   **Dirección Fiscal Completa**:
    *   Calle, número (exterior e interior), colonia, código postal, ciudad y estado.
*   **Perfil Operativo y Comercial**:
    *   `Página web`.
    *   `Número de máquinas principales` y `Número de Empleados`.
    *   `Turnos` de operación.
    *   `NDA`: Campo para subir el Acuerdo de Confidencialidad (NDA) firmado. Si ya existe uno, podrás descargarlo desde aquí.
*   **Descripción Cualitativa**:
    *   `Logros` y `Semblanza`: Campos de texto libre para destacar los hitos, la historia y las fortalezas de la empresa.
    *   `Logros y semblanza liga`: Un enlace a un documento externo si la información es muy extensa.

> **¡Importante!** Todos los campos marcados con un asterisco `(*)` son obligatorios para guardar el perfil.

### **3.3. Asignar Certificaciones y Especialidades (Calificación)**

Una vez guardada la empresa, el siguiente paso es calificarla. En la tabla de empresas, cada fila tiene iconos de acción rápida:

*   **Para Certificaciones (🏆)**:
    1.  Al hacer clic, se abre un modal.
    2.  Selecciona una certificación del catálogo y haz clic en `Agregar`.
    3.  En la nueva fila, puedes subir el `archivo del certificado`, establecer la `fecha de expiración` y marcar si es un `compromiso` (es decir, una certificación en proceso).

*   **Para Especialidades (🛠️)**:
    1.  El modal te permite navegar por la jerarquía que ya definiste en los catálogos.
    2.  Selecciona la `Especialidad`, luego el `Alcance` y finalmente el `Sub-Alcance`.
    3.  Haz clic en `Agregar` para vincular esa capacidad técnica a la empresa.

### **3.4. Vincular Usuarios a Empresas**

Para que un asociado pueda autogestionar su perfil y recibir notificaciones de proyectos, su cuenta de usuario debe estar vinculada a la empresa.

1.  Haz clic en el icono de **usuarios** (👤) en la tabla de empresas.
2.  Se abrirá un modal que te permitirá buscar usuarios existentes (que ya deben haber sido creados en el módulo de `Usuarios` con el rol `Asociado`).
3.  Selecciona el usuario y asígnale un rol dentro de la empresa (ej. `Admin`, `Contacto`).

Este paso es fundamental para descentralizar la gestión y dar autonomía a los asociados.

[Volver al Índice](#índice-general)

---

## **4. Módulo de Solicitudes de Proyecto**

Este módulo es donde comienza la magia. Aquí se registran las nuevas necesidades de los clientes y se inicia el proceso para encontrar a los proveedores ideales. La estructura es de dos niveles: la **Solicitud** (el proyecto general) y los **Requerimientos** (las piezas o servicios específicos).

### **4.1. Flujo General: De Solicitud a Proyecto**

El proceso está diseñado para guiarte paso a paso:

1.  **Crear la Solicitud**: Es el contenedor principal. Se le asigna un título, un cliente y un contacto.
2.  **Añadir Requerimientos**: Dentro de la solicitud, creas uno o más requerimientos. Cada uno es un entregable específico.
3.  **Definir Criterios Técnicos por Requerimiento**: A cada requerimiento le asignas las **certificaciones** y **especialidades** que debe cumplir el proveedor.
4.  **Encontrar Candidatos**: Con los criterios definidos, el sistema te muestra una lista de asociados 100% compatibles para que los invites a cotizar.
5.  **Gestionar Cotizaciones y Documentos**: Supervisas las cotizaciones recibidas y la documentación técnica (planos, especificaciones), asegurando el acceso solo a empresas con NDA firmado.

### **4.2. Crear y Administrar Solicitudes (Paso a Paso)**

1.  En el módulo **Solicitudes de Proyecto**, haz clic en `Agregar Solicitud`.
2.  Completa el formulario inicial:
    *   `Título de la solicitud`: Un nombre descriptivo para el proyecto (ej. "Proyecto Carcasa Nylamid 2025").
    *   `Cliente`: Selecciona la empresa cliente de la lista.
    *   `Área / Contacto`: Elige el área o departamento específico del cliente. Este campo se filtra automáticamente según el cliente seleccionado.
    *   `Fecha de petición` y `Observaciones` generales.
3.  Haz clic en `Guardar`. La solicitud aparecerá en la tabla principal.

### **4.3. Definir Requerimientos y Buscar Candidatos (El Corazón del Módulo)**

Una vez creada la solicitud, el verdadero trabajo comienza al definir los requerimientos.

1.  **Abrir el Gestor de Requerimientos**: En la tabla de solicitudes, cada fila tiene un botón para `Gestionar Requerimientos`. Al hacer clic, se abre un modal dedicado.
2.  **Añadir un Requerimiento**: Dentro del modal, usa el formulario para crear un nuevo requerimiento:
    *   `Nombre del Requerimiento`: Sé específico (ej. "Pieza de sujeción A-45").
    *   `Número de Piezas`.
    *   `Prioridad`: Para ordenar los requerimientos dentro de la solicitud.
    *   `Observación`: Detalles técnicos, materiales, acabados, etc.
3.  **Especificar Criterios Técnicos**: En la lista de requerimientos dentro del modal, cada uno tiene sus propios iconos de acción:
    *   **Certificaciones (🏆)**: Haz clic para abrir un modal y seleccionar las certificaciones obligatorias para este requerimiento.
    *   **Especialidades (🛠️)**: Haz clic para asignar las capacidades técnicas (especialidad, alcance, sub-alcance) necesarias.
4.  **Encontrar y Gestionar Participantes (🎯)**:
    *   Una vez definidos los criterios, haz clic en el icono de `Participantes`.
    *   El sistema te presentará una lista de **candidatos ideales**, es decir, las empresas que cumplen con todos los requisitos técnicos que estableciste.
    *   Desde aquí, puedes `invitar` a las empresas a cotizar, `retirarlas` del proceso o ver el `estado` de su participación (ej. "Invitado", "Cotización Recibida").

### **4.4. Gestión de Cotizaciones y Documentación**

*   **Documentos Técnicos**: En la vista principal de la solicitud, hay un botón para `gestionar los documentos técnicos` (planos, 3D, etc.). Puedes subir archivos que solo serán visibles para los asociados que hayan firmado un NDA.
*   **Revisión de Cotizaciones**: Cuando un asociado envía una cotización, podrás verla y gestionarla desde el modal de participantes, centralizando toda la información para tomar la mejor decisión.

[Volver al Índice](#índice-general)

---

## **5. Módulo de Gestión de Proyectos (Project Management)**

Una vez que una solicitud se aprueba y se selecciona un proveedor, se convierte en un proyecto activo. Este módulo te ofrece una vista de "Torre de Control" para supervisar todos los proyectos en curso, desde el inicio hasta el final.

### **5.1. Overview de Proyectos: Tu Torre de Control**

La pantalla principal te muestra una lista de todos los proyectos activos. Cada proyecto es un panel expandible que, al abrirse, revela una vista detallada con:

*   **Información General**: Requerimientos que componen el proyecto y la empresa asignada.
*   **Vista de Categorías y Progreso**: Un desglose de las categorías del proyecto (ej. Análisis, Diseño, Producción) con una barra de progreso para cada una. Esta barra se actualiza automáticamente según el estado de las actividades internas.
*   **Contadores Rápidos**: Indicadores visuales que te dicen cuántas actividades hay en cada estado (`Por Iniciar`, `En Progreso`, `Completado`).

### **5.2. Gestión de Etapas, Categorías y Actividades**

La clave de este módulo es su estructura flexible para organizar el trabajo.

*   **Gestión de Etapas**: 
    1.  Haz clic en el botón `Gestionar Etapas` dentro de un proyecto.
    2.  En el modal, puedes crear las fases macro del proyecto (ej. "Fase 1: Diseño y Prototipado", "Fase 2: Producción").
    3.  Puedes asignar un orden a las etapas para reflejar la secuencia del proyecto.

*   **Gestión de Categorías y Actividades**:
    1.  Dentro de la vista de un proyecto, puedes crear `Categorías` para agrupar tareas (ej. "Pruebas de Calidad").
    2.  A cada categoría puedes asignarle `Actividades` específicas (ej. "Realizar prueba de dureza").
    3.  Tanto las categorías como las actividades se pueden asignar a una de las etapas que creaste previamente, permitiendo una organización jerárquica y clara.

### **5.3. Seguimiento de Progreso y Bitácora**

Este módulo está optimizado para darte una visión clara y en tiempo real del estado de cada proyecto.

*   **Cálculo de Progreso Automático**: Gracias a una vista de datos optimizada en la base de datos (`project_categories_with_progress`), el sistema calcula el porcentaje de avance de cada categoría en tiempo real. El cálculo se basa en el número de actividades que el asociado marca como `Completado`.
*   **Interpretación Visual**: Las barras de progreso y los contadores te permiten identificar cuellos de botella de un solo vistazo. Si una categoría tiene muchas actividades `Por Iniciar`, sabrás inmediatamente dónde se necesita atención.
*   **Bitácora del Proyecto**: Cada proyecto tiene su propia bitácora (`Project Logs`), donde se registran todos los eventos importantes, cambios de estado y comunicaciones, proporcionando un historial completo y auditable.

[Volver al Índice](#índice-general)

---

## **6. Módulo de Reportes**

Este módulo es el centro de inteligencia de negocio de Conecta Tool. Te proporciona herramientas avanzadas para visualizar, analizar y exportar información clave de la plataforma, permitiéndote tomar decisiones estratégicas basadas en datos reales y generar reportes profesionales para diferentes audiencias.

### **6.1. Dashboard de KPIs (Indicadores Clave)**

Al ingresar al módulo, lo primero que verás es un **Dashboard de KPIs**, un panel visual que te ofrece un resumen ejecutivo de alto nivel de la actividad en la plataforma. Este dashboard incluye:

**Métricas Principales:**
*   **Total de empresas activas** y su distribución por estado.
*   **Número de proyectos en curso** y su progreso promedio.
*   **Certificaciones más comunes** en tu red de asociados.
*   **Especialidades con mayor demanda** y disponibilidad.
*   **Indicadores de rendimiento** de cotizaciones y asignaciones.
*   **Análisis de costos y ganancias** por periodo.

**Visualizaciones Interactivas:**
*   Gráficos de barras y circulares para distribución de datos.
*   Líneas de tendencia para análisis temporal.
*   Mapas de calor para identificar patrones.
*   Indicadores de semáforo para alertas y estados críticos.

Este dashboard es ideal para obtener un pulso rápido del ecosistema y identificar áreas que requieren atención inmediata.

### **6.2. Tipos de Reportes Disponibles**

El sistema ofrece múltiples tipos de reportes especializados para diferentes necesidades:

#### **6.2.1. Reportes de Empresas y Asociados**
*   **Directorio Completo de Empresas**: Listado detallado con información de contacto, capacidades y certificaciones.
*   **Análisis de Certificaciones**: Estado de certificaciones, fechas de vencimiento y compromisos pendientes.
*   **Mapa de Especialidades**: Distribución de capacidades técnicas en tu red de asociados.
*   **Perfiles de Empresas Individuales**: Reportes detallados por empresa con toda su información.

#### **6.2.2. Reportes de Proyectos y Solicitudes**
*   **Estado de Solicitudes Activas**: Seguimiento de todas las solicitudes en proceso.
*   **Análisis de Cotizaciones**: Comparativo de precios y propuestas recibidas.
*   **Progreso de Proyectos**: Estado detallado de avance por proyecto y categoría.
*   **Bitácora de Actividades**: Historial completo de eventos y cambios.

#### **6.2.3. Reportes Financieros y de Rendimiento**
*   **Resumen de Costos y Ganancias**: Análisis financiero por periodo seleccionado.
*   **Indicadores de Rendimiento**: Métricas de eficiencia y productividad.
*   **Análisis de Participación**: Estadísticas de empresas más activas y exitosas.

### **6.3. Generación de Reportes Paso a Paso**

#### **Paso 1: Selección del Tipo de Reporte**
1.  En el módulo **Reportes**, verás una lista de tipos de reportes disponibles.
2.  Cada reporte tiene una descripción que te ayuda a identificar cuál necesitas.
3.  Haz clic en `Ver Reporte` del tipo que deseas generar.

#### **Paso 2: Configuración de Filtros y Parámetros**
Dependiendo del tipo de reporte, tendrás diferentes opciones de filtrado:

**Filtros Temporales:**
*   **Selector de Rango de Fechas**: Define un periodo específico usando el calendario interactivo.
*   **Filtros Predefinidos**: Opciones rápidas como "Último mes", "Trimestre actual", etc.

**Filtros de Contenido:**
*   **Búsqueda por Término**: Encuentra empresas, proyectos o contactos específicos.
*   **Filtros por Estado**: Selecciona solo elementos activos, completados, pendientes, etc.
*   **Filtros por Categoría**: Especialidades, certificaciones, tipos de proyecto, etc.

**Filtros Avanzados:**
*   **Criterios Múltiples**: Combina varios filtros para obtener resultados muy específicos.
*   **Exclusiones**: Define qué elementos NO incluir en el reporte.

#### **Paso 3: Previsualización y Ajustes**
1.  Una vez aplicados los filtros, el sistema genera una **previsualización** del reporte.
2.  Puedes revisar el contenido y ajustar los filtros si es necesario.
3.  La previsualización te muestra:
    *   Número total de registros incluidos.
    *   Resumen de las secciones que contendrá el reporte.
    *   Estimado del tamaño del archivo de exportación.

### **6.4. Visualización y Navegación de Reportes**

#### **Visor de Reportes Integrado**
El sistema incluye un **visor de reportes** avanzado que te permite:

*   **Navegación Intuitiva**: Desplázate por secciones usando el índice lateral.
*   **Búsqueda Interna**: Encuentra información específica dentro del reporte generado.
*   **Zoom y Ajustes de Vista**: Optimiza la visualización según tus preferencias.
*   **Marcadores y Notas**: Añade comentarios y marca secciones importantes.

#### **Contenido Detallado de Reportes**
Los reportes incluyen información exhaustiva:

**Para Empresas:**
*   Datos de identificación y contacto completos.
*   Dirección fiscal y operativa detallada.
*   Información de contactos principales y secundarios.
*   Listado completo de certificaciones con fechas de vigencia.
*   Detalle jerárquico de especialidades (especialidad → alcance → sub-alcance).
*   Capacidad productiva (número de máquinas, empleados, turnos).
*   Documentos asociados (NDA, certificados, etc.).
*   Historial de participación en proyectos.

**Para Proyectos:**
*   Información del cliente y área solicitante.
*   Desglose completo de requerimientos.
*   Estado de cotizaciones y participantes.
*   Cronograma y progreso por categorías.
*   Documentación técnica asociada.
*   Bitácora de eventos y cambios.

### **6.5. Opciones de Exportación Avanzadas**

#### **Formatos de Exportación Disponibles**

![Exportación a Excel](./public/manual_images/admin/05_reportes_exportar_excel.png)
*Opciones de exportación de reportes en múltiples formatos (Excel, PDF, etc.)*

*   **PDF Profesional**: Reportes con formato corporativo, ideal para presentaciones ejecutivas.
*   **Excel Detallado**: Hojas de cálculo con datos estructurados para análisis adicional.
*   **CSV para Análisis**: Datos en formato plano para importar en otras herramientas.
*   **Presentación PowerPoint**: Resúmenes ejecutivos con gráficos y visualizaciones.

#### **Personalización de Exportaciones**
*   **Plantillas Corporativas**: Aplica el branding de tu empresa a los reportes.
*   **Selección de Secciones**: Incluye solo las secciones relevantes para tu audiencia.
*   **Configuración de Privacidad**: Controla qué información sensible incluir o excluir.
*   **Formatos de Fecha y Moneda**: Adapta el formato según tu región y preferencias.

### **6.6. Reportes Especializados y Análisis Avanzado**

#### **Análisis de Tendencias**
*   **Evolución Temporal**: Compara métricas a lo largo del tiempo.
*   **Patrones de Demanda**: Identifica especialidades y certificaciones más solicitadas.
*   **Análisis de Crecimiento**: Seguimiento del crecimiento de tu red de asociados.

#### **Reportes de Cumplimiento**
*   **Estado de Certificaciones**: Alertas sobre vencimientos próximos.
*   **Auditoría de Documentos**: Verificación de completitud de expedientes.
*   **Cumplimiento Regulatorio**: Reportes para auditorías externas.

#### **Análisis Competitivo**
*   **Benchmarking de Precios**: Comparación de cotizaciones por tipo de servicio.
*   **Análisis de Capacidades**: Mapeo de fortalezas y oportunidades en tu red.
*   **Indicadores de Calidad**: Métricas de desempeño y satisfacción.

### **6.7. Automatización y Programación de Reportes**

#### **Reportes Programados**
*   **Frecuencia Configurable**: Diario, semanal, mensual o personalizada.
*   **Distribución Automática**: Envío por email a listas de destinatarios.
*   **Alertas Inteligentes**: Notificaciones cuando se detectan cambios significativos.

#### **Dashboards Personalizados**
*   **Widgets Configurables**: Crea paneles personalizados con las métricas más importantes.
*   **Acceso Rápido**: Guarda configuraciones de reportes frecuentes.
*   **Compartir Dashboards**: Permite acceso a otros usuarios con permisos específicos.

### **6.8. Casos de Uso Prácticos**

#### **Para Reuniones Ejecutivas**
1.  Genera el reporte "Resumen Ejecutivo" con KPIs principales.
2.  Exporta en formato PowerPoint.
3.  Incluye análisis de tendencias del último trimestre.

#### **Para Auditorías de Calidad**
1.  Selecciona el reporte "Estado de Certificaciones".
2.  Filtra por certificaciones próximas a vencer.
3.  Exporta en Excel para seguimiento detallado.

#### **Para Análisis de Mercado**
1.  Genera reportes de "Análisis de Cotizaciones".
2.  Compara precios por especialidad y región.
3.  Identifica oportunidades de optimización.

#### **Para Comunicación con Clientes**
1.  Crea reportes de "Progreso de Proyectos" específicos.
2.  Personaliza con branding corporativo.
3.  Programa envío automático semanal.

[Volver al Índice](#índice-general)

---
