export interface ManualSection {
  id: string;
  title: string;
  icon: string;
  description?: string;
  content?: ContentItem[];
  faq?: FAQItem[];
  images?: string[];
}

export interface ContentItem {
  type: "text" | "steps" | "alert" | "grid" | "image";
  id?: string; // ID único para anchors de búsqueda
  title?: string;
  text?: string;
  steps?: string[];
  alertType?: "info" | "success" | "warning" | "error";
  gridItems?: GridItem[];
  imageId?: string;
  imageCaption?: string;
}

export interface GridItem {
  title: string;
  description: string;
  icon?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  relatedSections?: string[];
}

export const manualSections: ManualSection[] = [
  {
    id: "introduccion",
    title: "Introducción",
    icon: "🏠",
    description:
      "Conecta Tool es tu plataforma para gestionar proyectos, actualizar tu perfil y acceder a nuevas oportunidades de negocio.",
    content: [
      {
        type: "text",
        text: "Como asociado, tienes acceso a herramientas especializadas para gestionar tus proyectos asignados, mantener actualizada tu información empresarial y acceder a nuevas oportunidades.",
      },
      {
        type: "grid",
        gridItems: [
          {
            title: "🚀 Gestionar proyectos",
            description:
              "Visualiza y administra los proyectos que te han sido asignados.",
          },
          {
            title: "📋 Ver solicitudes",
            description:
              "Accede a nuevas oportunidades de proyectos disponibles.",
          },
          {
            title: "👤 Actualizar perfil",
            description:
              "Mantén actualizada tu información empresarial y certificaciones.",
          },
          {
            title: "🔐 Acceso seguro",
            description:
              "Plataforma segura con autenticación y roles específicos.",
          },
        ],
      },
      {
        type: "alert",
        alertType: "info",
        text: "Tu cuenta de asociado te permite acceder a la información y proyectos de tu empresa.",
      },
    ],
    faq: [
      {
        question: "¿Qué puedo hacer como asociado en Conecta Tool?",
        answer:
          "Puedes gestionar tus proyectos asignados, ver nuevas oportunidades, actualizar tu perfil empresarial y mantener tus certificaciones al día.",
      },
      {
        question: "¿Cómo accedo a nuevos proyectos?",
        answer:
          "Los nuevos proyectos aparecerán en la sección de Solicitudes cuando cumplan con tus especialidades y certificaciones.",
      },
    ],
  },

  {
    id: "login",
    title: "Inicio de Sesión",
    icon: "🔐",
    description:
      "Accede a tu cuenta de asociado en Conecta Tool de forma segura.",
    content: [
      {
        type: "image",
        imageId: "IMG-0",
        imageCaption: "Pantalla de inicio de sesión del sistema",
      },
      {
        type: "text",
        title: "¿Por qué es importante la autenticación?",
        text: "Como asociado, tendrás acceso a información de tus proyectos asignados, oportunidades de negocio y datos de tu empresa. El sistema de autenticación garantiza que solo tú y tu equipo puedan acceder a esta información empresarial.",
      },
      {
        type: "steps",
        title: "¿Cómo iniciar sesión paso a paso?",
        steps: [
          "Accede a la URL del sistema: Abre tu navegador web y navega a la dirección proporcionada por el administrador",
          'Localiza los campos de acceso: Verás dos campos principales - "Email" y "Contraseña"',
          "Ingresa tu email corporativo: Escribe exactamente el email que te fue asignado",
          "Introduce tu contraseña: Ingresa tu clave de acceso de forma segura",
          'Haz clic en "Iniciar Sesión": El botón te dará acceso al sistema',
          "Verificación automática: El sistema validará tus credenciales en segundos",
          "Redirección al dashboard: Si todo es correcto, accederás al panel principal de asociado",
        ],
      },
      {
        type: "alert",
        alertType: "warning",
        text: "⚠️ Importante: Si olvidaste tu contraseña, contacta al administrador del sistema. No intentes múltiples accesos fallidos ya que tu cuenta podría bloquearse temporalmente.",
      },
      {
        type: "text",
        title: "¿Qué pasa después del login exitoso?",
        text: "Una vez autenticado correctamente, el sistema te redirigirá al dashboard de asociado donde tendrás acceso a tus proyectos asignados, nuevas oportunidades, gestión de tu perfil empresarial y más.",
      },
      {
        type: "alert",
        alertType: "info",
        text: "💡 Tip de seguridad: Siempre cierra tu sesión cuando termines de usar el sistema, especialmente si estás en una computadora compartida.",
      },
    ],
    faq: [
      {
        question: "¿Qué hago si no puedo acceder al sistema?",
        answer:
          "Verifica tu email y contraseña. Si olvidaste tu contraseña, contacta al administrador del sistema. Asegúrate de usar la URL correcta y que tu cuenta esté activa.",
      },
      {
        question: "¿El sistema guarda mi sesión?",
        answer:
          "Sí, el sistema mantiene tu sesión activa por un período determinado. Sin embargo, por seguridad, se recomienda cerrar sesión manualmente al terminar.",
      },
      {
        question: "¿Puedo cambiar mi contraseña?",
        answer:
          "Sí, una vez dentro del sistema puedes ir a tu perfil de usuario y cambiar tu contraseña desde ahí.",
      },
    ],
  },

  {
    id: "proyectos",
    title: "Mis Proyectos",
    icon: "🚀",
    description:
      "Visualiza y gestiona los proyectos que te han sido asignados.",
    content: [
      {
        type: "text",
        title: "¿Qué puedes ver en Mis Proyectos?",
        text: "Este módulo es tu centro de trabajo para gestionar todos los proyectos que te han sido asignados. Aquí puedes monitorear el progreso, gestionar actividades, crear categorías y mantener comunicación con el administrador sobre el avance del trabajo.",
      },
      {
        type: "image",
        imageId: "IMG-2",
        imageCaption: "Vista principal del módulo de Proyectos",
      },
      {
        type: "steps",
        title: "¿Cómo acceder y navegar en Mis Proyectos?",
        steps: [
          'Desde el menú lateral: Localiza y haz clic en "Mis Proyectos"',
          "Vista general: Verás una lista de todos los proyectos asignados a tu empresa con sus estados",
          "Expandir detalles: Haz clic en cualquier proyecto para ver su información detallada",
          "Navegar entre secciones: Usa las pestañas para ver diferentes aspectos del proyecto",
          "Filtrar proyectos: Utiliza los filtros para encontrar proyectos específicos por estado",
        ],
      },
      {
        type: "image",
        imageId: "IMG-3",
        imageCaption: "Vista detallada de un proyecto con todas sus actividades y progreso",
      },
      {
        type: "text",
        title: "¿Qué información crítica puedes ver de cada proyecto?",
        text: "Cada proyecto te proporciona una vista integral que incluye: porcentaje general de completado, categorías que has creado para organizar el trabajo, actividades específicas organizadas por estado (Por iniciar, En progreso, Completadas, Canceladas), fechas de inicio y finalización, y bitácora de eventos importantes del proyecto.",
      },
      {
        type: "alert",
        alertType: "info",
        text: "💡 Tip: Los porcentajes se calculan automáticamente basándose en las actividades que completas. No necesitas actualizar manualmente estos valores.",
      },
      {
        type: "steps",
        title: "Cómo gestionar tus proyectos:",
        steps: [
          'Accede al módulo "Mis Proyectos" desde el menú principal',
          "Revisa la lista de proyectos asignados a tu empresa",
          "Haz clic en un proyecto para ver sus detalles completos",
          "Crea categorías para organizar tus actividades",
          "Actualiza el estado de las actividades según avances en el trabajo",
          "Consulta la bitácora para ver el historial de cambios",
        ],
      },
      {
        type: "grid",
        gridItems: [
          {
            title: "📊 Estados de proyecto",
            description: "Pendiente, En Progreso, Completado, Cancelado",
          },
          {
            title: "📄 Documentación",
            description: "Sube y gestiona documentos relacionados al proyecto",
          },
          {
            title: "💬 Comunicación",
            description: "Mantén comunicación con el cliente y administrador",
          },
          {
            title: "⏰ Seguimiento",
            description: "Monitorea fechas límite y entregables",
          },
        ],
      },
      {
        type: "text",
        title: "¿Cómo entender las categorías?",
        text: "Las categorías las creas tú para agrupar tus actividades (ej: 'Diseño', 'Fabricación'). Esto permite una mejor organización y seguimiento del progreso de tu trabajo.",
      },
      {
        type: "text",
        title: "¿Cómo consultar la bitácora del proyecto?",
        text: "La bitácora es un registro automático de todos los eventos importantes del proyecto: cambios de estado que realizas, creación de actividades, actualizaciones de progreso, comentarios del administrador y más. Es tu historial completo del proyecto.",
      },
      {
        type: "steps",
        id: "proyectos-actividades",
        title: "¿Cómo crear una nueva actividad en un proyecto?",
        steps: [
          "Accede al proyecto: Haz clic en el proyecto donde quieres agregar la actividad",
          "Localiza el botón 'Añadir Actividad': Generalmente está en la sección de actividades",
          "Completa la información requerida: Nombre descriptivo de la actividad",
          "Agrega descripción detallada: Explica claramente qué debe hacerse",
          "Define fechas: Establece fecha tentativa de inicio y finalización",
          "Incluye observaciones: Agrega notas importantes",
          "Guarda la actividad: Haz clic en 'Crear Actividad'",
          "Verificación: La nueva actividad aparecerá en la columna 'Por iniciar'"
        ]
      },
      {
        type: "image",
        imageId: "IMG-8",
        imageCaption: "Formulario para crear una nueva actividad en el proyecto",
      },
      {
        type: "alert",
        alertType: "success",
        text: "✅ Resultado: Podrás ver la nueva actividad en tu panel y cambiar su estado conforme avances en el trabajo.",
      },
      {
        type: "text",
        id: "proyectos-categorias",
        title: "¿Cómo gestionar categorías del proyecto?",
        text: "Las categorías son agrupaciones que creas para organizar tus actividades en el proyecto. Esto te permite tener una vista organizada del progreso y facilita la gestión de tareas relacionadas.",
      },
      {
        type: "image",
        imageId: "IMG-11",
        imageCaption: "Interfaz para crear y gestionar categorías del proyecto",
      },
      {
        type: "steps",
        title: "¿Cómo crear y organizar categorías?",
        steps: [
          "Accede a la gestión de categorías: Dentro del proyecto, busca la opción de categorías",
          "Define agrupaciones lógicas: Crea categorías como 'Diseño', 'Producción', 'Entrega'",
          "Asigna actividades: Agrupa las actividades relacionadas en cada categoría",
          "Establece orden lógico: Organiza las categorías según el flujo natural del proyecto",
          "Guarda la configuración: Aplica los cambios para que se reflejen en el proyecto"
        ]
      },
      {
        type: "image",
        imageId: "IMG-13",
        imageCaption: "Vista de actividades organizadas por categorías en formato kanban",
      },
      {
        type: "text",
        id: "proyectos-bitacora",
        title: "¿Cómo consultar la bitácora del proyecto?",
        text: "La bitácora es un registro automático de todos los eventos importantes del proyecto: cambios de estado que realizas, creación de actividades, actualizaciones de progreso, comentarios del administrador y más. Es tu historial completo del proyecto.",
      },
      {
        type: "image",
        imageId: "IMG-6",
        imageCaption: "Ventana de la bitácora del proyecto con historial de eventos",
      },
      {
        type: "alert",
        alertType: "info",
        text: "Puedes ver y gestionar los proyectos que han sido asignados a tu empresa.",
      },
    ],
    faq: [
      {
        question: "¿Cómo puedo ver el progreso de mis proyectos?",
        answer:
          'Ve a "Mis Proyectos" desde el menú lateral. Cada proyecto muestra su porcentaje de completado y puedes expandir los detalles para ver actividades específicas por estado (Por iniciar, En progreso, Completadas).',
      },
      {
        question: "¿Cómo funcionan las categorías en mis proyectos?",
        answer:
          "Las categorías las creas tú para agrupar tus actividades (ej: 'Diseño', 'Fabricación'). Te permiten organizar mejor tu trabajo y tener una vista clara del progreso en cada área del proyecto.",
      },
      {
        question: "¿Cómo agrego una nueva actividad a un proyecto?",
        answer:
          "Dentro del proyecto, busca el botón 'Añadir Actividad', completa el formulario con nombre, descripción, fechas y observaciones. La actividad aparecerá en 'Por iniciar' y podrás cambiar su estado.",
      },
      {
        question: "¿Puedo ver qué cambios se han hecho en un proyecto?",
        answer:
          "Sí, cada proyecto tiene una bitácora que registra automáticamente todos los cambios de estado, creación de actividades, comentarios y eventos importantes.",
      },
    ],
  },

  {
    id: "solicitudes",
    title: "Solicitudes Asignadas",
    icon: "📋",
    description:
      "Gestiona las solicitudes de proyectos que te han sido asignadas y crea cotizaciones.",
    content: [
      {
        type: "text",
        title: "¿Qué son las Solicitudes Asignadas?",
        text: "Este módulo te permite gestionar las solicitudes de proyectos que el administrador te ha asignado específicamente. Aquí puedes revisar los detalles, crear cotizaciones y gestionar toda la documentación relacionada.",
      },
      {
        type: "image",
        imageId: "IMG-15",
        imageCaption: "Vista principal del módulo de Solicitudes Asignadas",
      },
      {
        type: "steps",
        title: "¿Cómo acceder y navegar en Solicitudes Asignadas?",
        steps: [
          'Desde el menú lateral: Localiza y haz clic en "Solicitudes Asignadas"',
          "Vista general: Verás una lista de todas las solicitudes que te han sido asignadas",
          "Revisar detalles: Haz clic en cualquier solicitud para ver información completa",
          "Estado de solicitudes: Observa el estado actual de cada solicitud",
          "Acciones disponibles: Utiliza las opciones para crear cotizaciones o subir documentos"
        ]
      },
      {
        type: "image",
        imageId: "IMG-16",
        imageCaption: "Vista detallada de una solicitud asignada",
      },
      {
        type: "text",
        id: "solicitudes-cotizaciones",
        title: "¿Cómo crear una cotización?",
        text: "Una de las principales funciones es crear cotizaciones para las solicitudes asignadas. El sistema te guía paso a paso para completar toda la información necesaria.",
      },
      {
        type: "steps",
        title: "Proceso para crear cotización:",
        steps: [
          "Selecciona la solicitud: Haz clic en la solicitud para la cual quieres crear cotización",
          "Accede al formulario: Busca y haz clic en el botón 'Crear Cotización'",
          "Completa requerimientos: Llena la información técnica solicitada",
          "Agrega detalles: Incluye especificaciones, materiales y procesos",
          "Define precios: Establece costos y tiempos de entrega",
          "Revisa información: Verifica que todos los datos sean correctos",
          "Envía cotización: Finaliza y envía la cotización al administrador"
        ]
      },
      {
        type: "image",
        imageId: "IMG-17",
        imageCaption: "Formulario para crear cotización - información de requerimientos",
      },
      {
        type: "image",
        imageId: "IMG-18",
        imageCaption: "Formulario para crear cotización - finalizar y enviar",
      },
      {
        type: "alert",
        alertType: "info",
        text: "💡 Tip: Asegúrate de revisar cuidadosamente todos los requerimientos antes de crear tu cotización. Una cotización completa y precisa aumenta las posibilidades de que sea aceptada.",
      },
      {
        type: "text",
        id: "solicitudes-documentos",
        title: "¿Cómo gestionar documentos y cotizaciones?",
        text: "El sistema te permite subir documentos técnicos, planos, especificaciones y gestionar todas las cotizaciones relacionadas con tus solicitudes asignadas.",
      },
      {
        type: "image",
        imageId: "IMG-19",
        imageCaption: "Gestión de documentos técnicos y cotizaciones",
      },
    ],
    faq: [
      {
        question: "¿Cómo sé qué solicitudes me han asignado?",
        answer:
          "Todas las solicitudes asignadas aparecerán automáticamente en tu módulo de 'Solicitudes Asignadas'. Recibirás notificaciones cuando se te asigne una nueva solicitud.",
      },
      {
        question: "¿Puedo rechazar una solicitud asignada?",
        answer:
          "Contacta al administrador si necesitas rechazar o renegociar una solicitud asignada. Es importante comunicar cualquier limitación técnica o de capacidad.",
      },
      {
        question: "¿Cómo modifico una cotización ya enviada?",
        answer:
          "Una vez enviada, no puedes modificar directamente una cotización. Contacta al administrador para solicitar cambios o enviar una nueva versión.",
      },
      {
        question: "¿Qué documentos puedo subir?",
        answer:
          "Puedes subir planos técnicos, especificaciones, catálogos, certificaciones y cualquier documento que respalde tu cotización o capacidades técnicas.",
      },
    ],
  },

  {
    id: "asociados",
    title: "Gestión de Asociados",
    icon: "👥",
    description:
      "Administra la información de tu empresa y gestiona usuarios asociados.",
    content: [
      {
        type: "text",
        title: "¿Qué puedes gestionar en Asociados?",
        text: "Este módulo te permite administrar toda la información relacionada con tu empresa asociada: datos generales, especialidades, certificaciones, usuarios y más. Es tu centro de control para mantener actualizada la información empresarial.",
      },
      {
        type: "image",
        imageId: "IMG-20",
        imageCaption: "Vista principal del módulo de Asociados",
      },
      {
        type: "steps",
        title: "¿Cómo acceder y navegar en Asociados?",
        steps: [
          'Desde el menú lateral: Localiza y haz clic en "Asociados"',
          "Vista general: Verás la información principal de tu empresa",
          "Secciones disponibles: Navega entre información general, especialidades y certificaciones",
          "Editar información: Utiliza los botones de edición para actualizar datos",
          "Gestionar usuarios: Administra los usuarios de tu empresa"
        ]
      },
      {
        type: "image",
        imageId: "IMG-21",
        imageCaption: "Vista detallada de la información del asociado",
      },
      {
        type: "text",
        id: "asociados-informacion",
        title: "¿Cómo editar la información de tu empresa?",
        text: "Mantener actualizada la información de tu empresa es fundamental para recibir solicitudes relevantes y mantener un perfil profesional completo.",
      },
      {
        type: "steps",
        title: "Proceso para editar información empresarial:",
        steps: [
          "Accede a edición: Haz clic en el botón 'Editar' en la información de tu empresa",
          "Información básica: Actualiza nombre comercial, contacto principal y teléfono",
          "Dirección completa: Completa calle, número, colonia, código postal, ciudad y estado",
          "Información técnica: Agrega número de máquinas y capacidades",
          "Revisa datos: Verifica que toda la información sea correcta",
          "Guarda cambios: Aplica las modificaciones realizadas"
        ]
      },
      {
        type: "image",
        imageId: "IMG-22",
        imageCaption: "Formulario para editar información básica del asociado - parte 1",
      },
      {
        type: "image",
        imageId: "IMG-23",
        imageCaption: "Formulario para editar información básica del asociado - parte 2",
      },
      {
        type: "text",
        id: "asociados-certificaciones",
        title: "¿Cómo gestionar certificaciones?",
        text: "Las certificaciones son fundamentales para demostrar tus capacidades técnicas y cumplir con los requerimientos de los proyectos.",
      },
      {
        type: "image",
        imageId: "IMG-24",
        imageCaption: "Gestión de certificaciones del asociado",
      },
      {
        type: "text",
        id: "asociados-especialidades",
        title: "¿Cómo gestionar especialidades?",
        text: "Las especialidades definen en qué áreas técnicas tienes experiencia y capacidades. Mantenerlas actualizadas es clave para recibir solicitudes relevantes.",
      },
      {
        type: "image",
        imageId: "IMG-25",
        imageCaption: "Gestión de especialidades del asociado",
      },
      {
        type: "text",
        id: "asociados-usuarios",
        title: "¿Cómo agregar usuarios a tu empresa?",
        text: "Puedes agregar usuarios adicionales de tu empresa para que tengan acceso al sistema y puedan colaborar en la gestión de proyectos.",
      },
      {
        type: "image",
        imageId: "IMG-26",
        imageCaption: "Formulario para agregar usuarios al asociado",
      },
      {
        type: "alert",
        alertType: "warning",
        text: "Mantener tu información actualizada es crucial para recibir solicitudes relevantes y mantener tu estatus activo en el sistema.",
      },
    ],
    faq: [
      {
        question: "¿Con qué frecuencia debo actualizar mi información?",
        answer:
          "Recomendamos revisar y actualizar tu información al menos cada 3 meses o cuando obtengas nuevas certificaciones o especialidades.",
      },
      {
        question: "¿Puedo cambiar mis especialidades?",
        answer:
          "Sí, puedes agregar o actualizar tus especialidades en cualquier momento. Esto afectará las solicitudes que recibas en el futuro.",
      },
      {
        question: "¿Cómo agrego una nueva certificación?",
        answer:
          "Ve a la sección de certificaciones, haz clic en 'Agregar' y completa la información de tu nueva certificación incluyendo fechas de vigencia.",
      },
      {
        question: "¿Cuántos usuarios puedo agregar?",
        answer:
          "No hay límite específico, pero cada usuario debe tener un propósito claro en la gestión de proyectos de tu empresa.",
      },
    ],
  },

  {
    id: "ndas",
    title: "Administración de NDAs",
    icon: "📄",
    description:
      "Gestiona los acuerdos de confidencialidad (NDAs) con clientes y proyectos.",
    content: [
      {
        type: "text",
        title: "¿Qué son los NDAs?",
        text: "Los Acuerdos de Confidencialidad (NDAs) son documentos legales que protegen la información sensible compartida entre tu empresa y los clientes durante el desarrollo de proyectos.",
      },
      {
        type: "image",
        imageId: "IMG-47",
        imageCaption: "Vista principal de Administración de NDAs",
      },
      {
        type: "steps",
        title: "¿Cómo gestionar NDAs?",
        steps: [
          'Accede al módulo: Haz clic en "Administración de NDAs" desde el menú lateral',
          "Revisa NDAs activos: Ve la lista de acuerdos vigentes y sus fechas de expiración",
          "Consulta detalles: Haz clic en cualquier NDA para ver información completa",
          "Verifica fechas: Mantente al tanto de las fechas de vencimiento",
          "Contacta administrador: Para renovaciones o nuevos NDAs"
        ]
      },
      {
        type: "text",
        id: "ndas-edicion",
        title: "¿Cómo editar un NDA existente?",
        text: "En algunos casos, podrás actualizar cierta información de los NDAs, siempre bajo supervisión del administrador del sistema.",
      },
      {
        type: "image",
        imageId: "IMG-48",
        imageCaption: "Formulario para editar acuerdo de confidencialidad (NDA)",
      },
      {
        type: "alert",
        alertType: "warning",
        text: "⚠️ Importante: Los NDAs son documentos legales. Cualquier modificación debe ser aprobada por el administrador y las partes involucradas.",
      },
      {
        type: "alert",
        alertType: "info",
        text: "💡 Tip: Mantén un registro de las fechas de vencimiento de tus NDAs para renovarlos oportunamente y evitar interrupciones en tus proyectos.",
      },
    ],
    faq: [
      {
        question: "¿Qué hago si un NDA está por vencer?",
        answer:
          "Contacta al administrador del sistema con al menos 30 días de anticipación para iniciar el proceso de renovación.",
      },
      {
        question: "¿Puedo trabajar en un proyecto sin NDA?",
        answer:
          "No, todos los proyectos que involucren información confidencial requieren un NDA vigente antes de comenzar el trabajo.",
      },
      {
        question: "¿Cómo solicito un nuevo NDA?",
        answer:
          "Los NDAs son gestionados por el administrador. Contacta al administrador cuando necesites un nuevo acuerdo de confidencialidad.",
      },
    ],
  },

  {
    id: "perfil",
    title: "Mi Perfil de Usuario",
    icon: "👤",
    description:
      "Gestiona tu información personal de acceso y configuraciones de cuenta.",
    content: [
      {
        type: "text",
        title: "¿Qué es Mi Perfil de Usuario?",
        text: "Tu perfil de usuario contiene la información personal de acceso al sistema: datos de contacto, configuraciones de cuenta y preferencias. Es diferente de la información empresarial que se gestiona en la sección 'Asociados'.",
      },
      {
        type: "steps",
        title: "¿Cómo acceder y editar tu perfil?",
        steps: [
          'Accede al perfil: Haz clic en tu nombre de usuario en la esquina superior derecha',
          'Selecciona "Editar Perfil" del menú desplegable',
          "Revisa información personal: Actualiza datos de contacto y acceso",
          "Modifica configuraciones: Ajusta preferencias del sistema",
          "Cambia contraseña: Si es necesario, actualiza tu contraseña de acceso",
          "Guarda cambios: Aplica todas las modificaciones realizadas"
        ],
      },
      {
        type: "image",
        imageId: "IMG-45",
        imageCaption: "Formulario para editar perfil de usuario",
      },
      {
        type: "text",
        title: "¿Cómo cerrar sesión de forma segura?",
        text: "Es importante cerrar sesión correctamente cuando termines de usar el sistema, especialmente si estás en una computadora compartida o pública.",
      },
      {
        type: "steps",
        title: "Proceso para cerrar sesión:",
        steps: [
          "Guarda tu trabajo: Asegúrate de guardar cualquier cambio pendiente",
          "Accede al menú de usuario: Haz clic en tu nombre en la esquina superior derecha",
          'Selecciona "Cerrar Sesión": Haz clic en la opción correspondiente',
          "Confirmación: El sistema te redirigirá a la pantalla de login",
          "Cierra el navegador: Para mayor seguridad, cierra completamente el navegador"
        ]
      },
      {
        type: "image",
        imageId: "IMG-46",
        imageCaption: "Opción para cerrar sesión",
      },
      {
        type: "alert",
        alertType: "info",
        text: "💡 Tip de seguridad: Siempre cierra tu sesión cuando termines de usar el sistema, especialmente si estás en una computadora compartida.",
      },
    ],
    faq: [
      {
        question: "¿Con qué frecuencia debo actualizar mi perfil?",
        answer:
          "Recomendamos revisar y actualizar tu perfil al menos cada 3 meses o cuando obtengas nuevas certificaciones.",
      },
      {
        question: "¿Puedo cambiar mi contraseña?",
        answer:
          "Sí, puedes cambiar tu contraseña desde la sección de editar perfil. Se recomienda usar una contraseña segura.",
      },
      {
        question: "¿Qué hago si olvido cerrar sesión?",
        answer:
          "El sistema cerrará automáticamente tu sesión después de un período de inactividad por seguridad.",
      },
    ],
  },
];
