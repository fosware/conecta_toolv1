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
  type: 'text' | 'steps' | 'alert' | 'grid' | 'image';
  title?: string;
  text?: string;
  steps?: string[];
  alertType?: 'info' | 'success' | 'warning' | 'error';
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
    id: 'introduccion',
    title: 'Introducción',
    icon: '🏠',
    description: 'Conecta Tool es una plataforma integral para la gestión y certificación de empresas, optimizando la conexión entre clientes y asociados calificados.',
    content: [
      {
        type: 'text',
        text: 'Como administrador, tienes acceso completo a todas las herramientas del sistema para gestionar proyectos, asociados, clientes y más.'
      },
      {
        type: 'grid',
        gridItems: [
          {
            title: '🗂️ Centralizar información',
            description: 'Administra empresas, certificaciones y proyectos desde un lugar.'
          },
          {
            title: '⚡ Optimizar procesos',
            description: 'Automatiza la búsqueda de proveedores calificados.'
          },
          {
            title: '✅ Garantizar calidad',
            description: 'Supervisa certificaciones y avance en tiempo real.'
          },
          {
            title: '🤝 Facilitar colaboración',
            description: 'Conecta clientes, asociados y administradores.'
          }
        ]
      }
    ]
  },

  {
    id: 'login',
    title: 'Inicio de Sesión',
    icon: '🔐',
    description: 'El primer paso para utilizar Conecta Tool es autenticarte en el sistema como administrador.',
    content: [
      {
        type: 'image',
        imageId: 'IMG-0',
        imageCaption: 'Pantalla de inicio de sesión del sistema'
      },
      {
        type: 'text',
        title: '¿Por qué es importante la autenticación?',
        text: 'Como administrador, tendrás acceso completo a información sensible de empresas, proyectos y cotizaciones. El sistema de autenticación garantiza que solo personal autorizado pueda acceder a estos datos críticos.'
      },
      {
        type: 'steps',
        title: '¿Cómo iniciar sesión paso a paso?',
        steps: [
          'Accede a la URL del sistema: Abre tu navegador web y navega a la dirección proporcionada por tu organización',
          'Localiza los campos de acceso: Verás dos campos principales - "Usuario" y "Contraseña"',
          'Ingresa tu nombre de usuario: Escribe exactamente el usuario que te fue asignado (sensible a mayúsculas y minúsculas)',
          'Introduce tu contraseña: Ingresa tu clave de acceso de forma segura',
          'Haz clic en "Ingresar": El botón azul te dará acceso al sistema',
          'Verificación automática: El sistema validará tus credenciales en segundos',
          'Redirección al dashboard: Si todo es correcto, accederás al panel principal de administración'
        ]
      },
      {
        type: 'alert',
        alertType: 'warning',
        text: '⚠️ Importante: Si olvidaste tu contraseña, contacta inmediatamente al administrador del sistema. No intentes múltiples accesos fallidos ya que tu cuenta podría bloquearse temporalmente.'
      },
      {
        type: 'text',
        title: '¿Qué pasa después del login exitoso?',
        text: 'Una vez autenticado correctamente, el sistema te redirigirá al dashboard principal donde tendrás acceso a todas las herramientas de administración: gestión de proyectos, asociados, clientes, reportes y más.'
      },
      {
        type: 'alert',
        alertType: 'info',
        text: '💡 Tip de seguridad: Siempre cierra tu sesión cuando termines de usar el sistema, especialmente si estás en una computadora compartida.'
      }
    ],
    faq: [
      {
        question: '¿Qué hago si no puedo acceder al sistema?',
        answer: 'Verifica tu usuario y contraseña. Si olvidaste tu contraseña, contacta al administrador del sistema. Asegúrate de usar la URL correcta y que tu usuario tenga los permisos adecuados.'
      },
      {
        question: '¿El sistema guarda mi sesión?',
        answer: 'Sí, el sistema mantiene tu sesión activa por un período determinado. Sin embargo, por seguridad, se recomienda cerrar sesión manualmente al terminar.'
      },
      {
        question: '¿Puedo cambiar mi contraseña?',
        answer: 'Sí, una vez dentro del sistema puedes ir a tu perfil de usuario y cambiar tu contraseña desde ahí.'
      }
    ]
  },

  {
    id: 'proyectos',
    title: 'Gestión de Proyectos',
    icon: '🚀',
    description: 'Torre de control para supervisar todos los proyectos activos desde inicio hasta finalización.',
    content: [
      {
        type: 'text',
        title: '¿Qué es la Gestión de Proyectos?',
        text: 'Este módulo es tu centro de comando para supervisar todos los proyectos que están en desarrollo. Aquí puedes monitorear el progreso, gestionar actividades, crear etapas y asegurar que todo marche según lo planeado.'
      },
      {
        type: 'image',
        imageId: 'IMG-2',
        imageCaption: 'Vista principal del módulo de Gestión de Proyectos'
      },
      {
        type: 'steps',
        title: '¿Cómo acceder y navegar en Gestión de Proyectos?',
        steps: [
          'Desde el menú lateral: Localiza y haz clic en "Gestión de Proyectos"',
          'Vista general: Verás una lista completa de todos los proyectos activos con sus estados',
          'Expandir detalles: Haz clic en cualquier proyecto para ver su información detallada',
          'Navegar entre secciones: Usa las pestañas para ver diferentes aspectos del proyecto',
          'Filtrar proyectos: Utiliza los filtros para encontrar proyectos específicos por estado, cliente o asociado'
        ]
      },
      {
        type: 'image',
        imageId: 'IMG-3',
        imageCaption: 'Vista detallada de un proyecto con todas sus actividades y progreso'
      },
      {
        type: 'text',
        title: '¿Qué información crítica puedo ver de cada proyecto?',
        text: 'Cada proyecto te proporciona una vista integral que incluye: porcentaje general de completado, empresa asociada responsable, categorías organizadas por etapas, progreso individual por cada categoría, actividades específicas organizadas por estado (Por iniciar, En progreso, Completadas, Canceladas), fechas de inicio y finalización, y bitácora de eventos importantes.'
      },
      {
        type: 'alert',
        alertType: 'info',
        text: '💡 Tip: Los porcentajes se calculan automáticamente basándose en las actividades completadas por el asociado. No necesitas actualizar manualmente estos valores.'
      },
      {
        type: 'steps',
        title: '¿Cómo crear una nueva actividad en un proyecto?',
        steps: [
          'Accede al proyecto: Haz clic en el proyecto donde quieres agregar la actividad',
          'Localiza el botón "Añadir Actividad": Generalmente está en la sección de actividades',
          'Completa la información requerida: Nombre descriptivo de la actividad',
          'Agrega descripción detallada: Explica claramente qué debe hacerse',
          'Define fechas: Establece fecha tentativa de inicio y finalización',
          'Incluye observaciones: Agrega notas importantes para el asociado',
          'Guarda la actividad: Haz clic en "Crear Actividad"',
          'Verificación: La nueva actividad aparecerá en la columna "Por iniciar"'
        ]
      },
      {
        type: 'image',
        imageId: 'IMG-8',
        imageCaption: 'Formulario para crear una nueva actividad en el proyecto'
      },
      {
        type: 'alert',
        alertType: 'success',
        text: '✅ Resultado: El asociado podrá ver la nueva actividad en su panel y cambiar su estado conforme avance en el trabajo.'
      },
      {
        type: 'text',
        title: '¿Cómo gestionar etapas del proyecto?',
        text: 'Las etapas son grandes agrupaciones que tú, como administrador, creas para organizar todas las categorías que los asociados han creado en sus proyectos. Esto te permite tener una vista macro del progreso.'
      },
      {
        type: 'image',
        imageId: 'IMG-11',
        imageCaption: 'Interfaz para crear y gestionar etapas del proyecto'
      },
      {
        type: 'steps',
        title: '¿Cómo crear y organizar etapas?',
        steps: [
          'Accede a la gestión de etapas: Dentro del proyecto, busca la opción de etapas',
          'Define grandes fases: Crea etapas como "Diseño", "Producción", "Entrega"',
          'Asigna categorías: Agrupa las categorías creadas por los asociados en cada etapa',
          'Establece orden lógico: Organiza las etapas según el flujo natural del proyecto',
          'Guarda la configuración: Aplica los cambios para que se reflejen en el proyecto'
        ]
      },
      {
        type: 'alert',
        alertType: 'info',
        text: '📌 Diferencia clave: Las categorías las crean los asociados para agrupar sus actividades. Las etapas las creas tú para organizar esas categorías en grandes fases del proyecto.'
      },
      {
        type: 'image',
        imageId: 'IMG-13',
        imageCaption: 'Vista de categorías organizadas por etapas en el proyecto'
      },
      {
        type: 'text',
        title: '¿Cómo consultar la bitácora del proyecto?',
        text: 'La bitácora es un registro automático de todos los eventos importantes del proyecto: cambios de estado, creación de actividades, actualizaciones de progreso, comentarios de asociados y más.'
      },
      {
        type: 'image',
        imageId: 'IMG-6',
        imageCaption: 'Ventana de la bitácora del proyecto con historial de eventos'
      }
    ],
    faq: [
      {
        question: '¿Cómo puedo ver el progreso de un proyecto?',
        answer: 'Ve a "Gestión de Proyectos" desde el menú lateral. Cada proyecto muestra su porcentaje de completado y puedes expandir los detalles para ver actividades específicas por estado (Por iniciar, En progreso, Completadas).'
      },
      {
        question: '¿Cuál es la diferencia entre etapas y categorías?',
        answer: 'Las categorías las crean los asociados para agrupar sus actividades (ej: "Diseño", "Fabricación"). Las etapas las creas tú como administrador para organizar esas categorías en grandes fases del proyecto.'
      },
      {
        question: '¿Cómo agrego una nueva actividad a un proyecto?',
        answer: 'Dentro del proyecto, busca el botón "Añadir Actividad", completa el formulario con nombre, descripción, fechas y observaciones. La actividad aparecerá en "Por iniciar" y el asociado podrá cambiar su estado.'
      },
      {
        question: '¿Puedo ver qué cambios se han hecho en un proyecto?',
        answer: 'Sí, cada proyecto tiene una bitácora que registra automáticamente todos los cambios de estado, creación de actividades, comentarios y eventos importantes.'
      }
    ]
  },

  {
    id: 'solicitudes',
    title: 'Solicitudes de Proyecto',
    icon: '📋',
    description: 'Punto de partida para conectar las necesidades de tus clientes con los asociados ideales.',
    content: [
      {
        type: 'image',
        imageId: 'IMG-15',
        imageCaption: 'Módulo de Solicitudes de Proyecto'
      },
      {
        type: 'steps',
        title: '¿Cómo crear una nueva solicitud?',
        steps: [
          'Accede al módulo: Haz clic en "Solicitud de Proyectos" en el menú lateral',
          'Inicia nueva solicitud: Haz clic en el botón "Nueva Solicitud"',
          'Completa la información básica: título, cliente, área/contacto, fecha de petición, observaciones',
          'Guarda la solicitud: Haz clic en "Guardar"'
        ]
      },
      {
        type: 'alert',
        alertType: 'info',
        text: '📌 Importante: Una solicitud es solo el contenedor. Lo realmente importante son los requerimientos que definirás después.'
      }
    ],
    faq: [
      {
        question: '¿Cómo creo una nueva solicitud de proyecto?',
        answer: 'Ve a "Solicitud de Proyectos" → "Nueva Solicitud". Completa la información básica (título, cliente, área, fecha). Después agrega requerimientos específicos con cantidades y especificaciones técnicas.'
      },
      {
        question: '¿Cuándo se convierte una solicitud en proyecto?',
        answer: 'Automáticamente cuando el cliente ACEPTA la cotización consolidada. El sistema crea el proyecto y notifica a los asociados seleccionados para que inicien el trabajo.'
      }
    ]
  },

  {
    id: 'asignadas',
    title: 'Solicitudes Asignadas',
    icon: '👥',
    description: 'Visualiza y gestiona la relación entre asociados y solicitudes de manera organizada.',
    content: [
      {
        type: 'image',
        imageId: 'IMG-28',
        imageCaption: 'Vista de Solicitudes Asignadas'
      },
      {
        type: 'text',
        title: '¿Qué información puedo ver aquí?',
        text: 'En esta vista tienes una tabla que muestra: qué asociado está asignado, a qué solicitud específica, el estado de la asignación, fechas importantes y montos de cotización.'
      }
    ],
    faq: [
      {
        question: '¿Cuál es la diferencia entre "Solicitudes" y "Solicitudes Asignadas"?',
        answer: '"Solicitudes" es donde creas y gestionas nuevas peticiones. "Solicitudes Asignadas" muestra la relación asociado-solicitud, documentos subidos y el estado de cada asignación.'
      }
    ]
  },

  {
    id: 'asociados',
    title: 'Gestión de Asociados',
    icon: '🏢',
    description: 'Corazón del sistema. Gestiona empresas proveedoras, sus capacidades y certificaciones.',
    content: [
      {
        type: 'image',
        imageId: 'IMG-31',
        imageCaption: 'Lista de Asociados registrados'
      },
      {
        type: 'steps',
        title: '¿Cómo crear un nuevo asociado?',
        steps: [
          'Haz clic en "Nuevo Asociado": Botón en la parte superior de la lista',
          'Completa información básica: razón social, nombre comercial, RFC/NIT, dirección, contacto',
          'Define capacidad productiva: Cuánto puede producir mensualmente',
          'Establece área de cobertura: Dónde puede entregar',
          'Guarda el registro: La empresa queda registrada pero inactiva'
        ]
      },
      {
        type: 'alert',
        alertType: 'warning',
        text: '⚠️ Siguiente paso: Después de crear la empresa, DEBES agregar sus certificaciones y especialidades para que aparezca en las búsquedas.'
      }
    ],
    faq: [
      {
        question: '¿Cómo registro un nuevo asociado?',
        answer: 'Ve a "Asociados" → "Nuevo Asociado". Completa información básica, luego DEBES agregar certificaciones y especialidades para que aparezca en las búsquedas. Finalmente, crea y asigna un usuario con rol "Asociado".'
      },
      {
        question: '¿Por qué un asociado no aparece en las búsquedas?',
        answer: 'Verifica que tenga: 1) Especialidades técnicas definidas, 2) Certificaciones vigentes, 3) Usuario asignado con rol "Asociado", 4) Estado activo. Sin estos elementos, no aparecerá como candidato.'
      }
    ]
  },

  {
    id: 'clientes',
    title: 'Gestión de Clientes',
    icon: '👤',
    description: 'Administra tu cartera de clientes y sus diferentes áreas de contacto.',
    content: [
      {
        type: 'image',
        imageId: 'IMG-37',
        imageCaption: 'Listado de Clientes'
      },
      {
        type: 'steps',
        title: '¿Cómo crear un nuevo cliente?',
        steps: [
          'Haz clic en "Nuevo Cliente": Botón en la parte superior de la lista',
          'Completa información corporativa: razón social, nombre comercial, RFC/NIT, giro empresarial',
          'Agrega información de contacto: dirección fiscal, teléfono principal, email corporativo, sitio web',
          'Guarda el cliente: Queda registrado y listo para agregar áreas'
        ]
      }
    ],
    faq: [
      {
        question: '¿Cómo organizo los contactos de un cliente?',
        answer: 'Cada cliente puede tener múltiples áreas (Compras, Ingeniería, Calidad) y cada área sus propios contactos específicos. Esto facilita dirigir las solicitudes al departamento correcto.'
      }
    ]
  },

  {
    id: 'ndas',
    title: 'Administración de NDAs',
    icon: '📄',
    description: 'Gestiona los Acuerdos de Confidencialidad con empresas asociadas.',
    content: [
      {
        type: 'image',
        imageId: 'IMG-44',
        imageCaption: 'Módulo de Administración de NDAs'
      },
      {
        type: 'text',
        title: 'Importancia de los NDAs',
        text: 'Los Acuerdos de Confidencialidad protegen la información técnica. Solo las empresas con NDA firmado pueden acceder a documentos técnicos de proyectos.'
      }
    ],
    faq: [
      {
        question: '¿Por qué son importantes los NDAs?',
        answer: 'Los Acuerdos de Confidencialidad protegen la información técnica. Solo las empresas con NDA firmado pueden acceder a documentos técnicos de proyectos, garantizando protección legal.'
      }
    ]
  },

  {
    id: 'reportes',
    title: 'Módulo de Reportes',
    icon: '📈',
    description: 'Centro de inteligencia de negocio con herramientas avanzadas para análisis.',
    content: [
      {
        type: 'image',
        imageId: 'IMG-41',
        imageCaption: 'Módulo de Reportes'
      },
      {
        type: 'alert',
        alertType: 'info',
        text: '💡 Tip: Usa los filtros de fecha para análisis específicos por períodos.'
      }
    ]
  },

  {
    id: 'catalogos',
    title: 'Catálogos',
    icon: '⚙️',
    description: 'Configuración de especialidades y certificaciones que el sistema reconocerá.',
    content: [
      {
        type: 'image',
        imageId: 'IMG-42',
        imageCaption: 'Catálogo de Especialidades'
      },
      {
        type: 'image',
        imageId: 'IMG-43',
        imageCaption: 'Catálogo de Certificaciones'
      }
    ],
    faq: [
      {
        question: '¿Cómo agrego nuevas especialidades o certificaciones al sistema?',
        answer: 'Ve a "Cat Especialidades" o "Cat Certificaciones" desde el menú. Puedes agregar nuevas categorías técnicas que luego estarán disponibles para asociados y requerimientos de proyectos.'
      }
    ]
  },

  {
    id: 'usuarios',
    title: 'Gestión de Usuarios',
    icon: '👥',
    description: 'Administra las cuentas de usuario y sus roles en el sistema.',
    content: [
      {
        type: 'alert',
        alertType: 'warning',
        text: '⚠️ Importante: Los usuarios con rol "Asociado" deben estar vinculados a una empresa para acceder a sus funcionalidades.'
      }
    ],
    faq: [
      {
        question: '¿Qué diferencia hay entre los roles de usuario?',
        answer: 'Admin: Acceso completo a todo el sistema. Asociado: Solo ve proyectos de su empresa. Staff: Acceso limitado según configuración. Los usuarios "Asociado" deben estar vinculados a una empresa.'
      }
    ]
  },

  {
    id: 'perfil',
    title: 'Perfil de Usuario',
    icon: '👤',
    description: 'Gestiona tu información personal y configuración de cuenta.',
    content: [
      {
        type: 'image',
        imageId: 'IMG-45',
        imageCaption: 'Editar Perfil de Usuario'
      },
      {
        type: 'image',
        imageId: 'IMG-46',
        imageCaption: 'Cerrar Sesión'
      }
    ],
    faq: [
      {
        question: '¿Cómo actualizo mi información de perfil?',
        answer: 'Haz clic en tu nombre de usuario (esquina superior derecha) → "Editar Perfil". Puedes cambiar nombre, apellidos, teléfono, email y contraseña.'
      }
    ]
  }
];
