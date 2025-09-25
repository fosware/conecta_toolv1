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
    description: 'Conecta Tool es tu plataforma para gestionar proyectos, actualizar tu perfil y acceder a nuevas oportunidades de negocio.',
    content: [
      {
        type: 'text',
        text: 'Como asociado, tienes acceso a herramientas especializadas para gestionar tus proyectos asignados, mantener actualizada tu información empresarial y acceder a nuevas oportunidades.'
      },
      {
        type: 'grid',
        gridItems: [
          {
            title: '🚀 Gestionar proyectos',
            description: 'Visualiza y administra los proyectos que te han sido asignados.'
          },
          {
            title: '📋 Ver solicitudes',
            description: 'Accede a nuevas oportunidades de proyectos disponibles.'
          },
          {
            title: '👤 Actualizar perfil',
            description: 'Mantén actualizada tu información empresarial y certificaciones.'
          },
          {
            title: '🔐 Acceso seguro',
            description: 'Plataforma segura con autenticación y roles específicos.'
          }
        ]
      },
      {
        type: 'alert',
        alertType: 'info',
        text: 'Tu cuenta de asociado te permite acceder solo a la información y proyectos relevantes para tu empresa.'
      }
    ],
    faq: [
      {
        question: '¿Qué puedo hacer como asociado en Conecta Tool?',
        answer: 'Puedes gestionar tus proyectos asignados, ver nuevas oportunidades, actualizar tu perfil empresarial y mantener tus certificaciones al día.'
      },
      {
        question: '¿Cómo accedo a nuevos proyectos?',
        answer: 'Los nuevos proyectos aparecerán en la sección de Solicitudes cuando cumplan con tus especialidades y certificaciones.'
      }
    ]
  },

  {
    id: 'login',
    title: 'Inicio de Sesión',
    icon: '🔐',
    description: 'Accede a tu cuenta de asociado en Conecta Tool de forma segura.',
    content: [
      {
        type: 'text',
        text: 'Para acceder a tu cuenta de asociado, necesitas las credenciales proporcionadas por el administrador del sistema.'
      },
      {
        type: 'steps',
        title: 'Pasos para iniciar sesión:',
        steps: [
          'Abre tu navegador web y ve a la URL de Conecta Tool',
          'Ingresa tu email corporativo en el campo "Email"',
          'Ingresa tu contraseña en el campo "Contraseña"',
          'Haz clic en "Iniciar Sesión"',
          'Serás redirigido al dashboard de asociado'
        ]
      },
      {
        type: 'alert',
        alertType: 'warning',
        text: 'Si no tienes credenciales de acceso, contacta al administrador del sistema para que te proporcione una cuenta.'
      },
      {
        type: 'image',
        imageId: 'IMG-0',
        imageCaption: 'Pantalla de inicio de sesión para asociados - <<cambiar>> (enfocar en rol asociado)'
      }
    ],
    faq: [
      {
        question: '¿Qué hago si olvidé mi contraseña?',
        answer: 'Contacta al administrador del sistema para que restablezca tu contraseña.'
      },
      {
        question: '¿Puedo cambiar mi contraseña?',
        answer: 'Sí, puedes cambiar tu contraseña desde tu perfil de usuario una vez que hayas iniciado sesión.'
      }
    ]
  },

  {
    id: 'proyectos',
    title: 'Mis Proyectos',
    icon: '🚀',
    description: 'Visualiza y gestiona los proyectos que te han sido asignados.',
    content: [
      {
        type: 'text',
        text: 'En esta sección puedes ver todos los proyectos que te han sido asignados, su estado actual y los detalles específicos de cada uno.'
      },
      {
        type: 'steps',
        title: 'Cómo gestionar tus proyectos:',
        steps: [
          'Accede al módulo "Mis Proyectos" desde el menú principal',
          'Revisa la lista de proyectos asignados a tu empresa',
          'Haz clic en un proyecto para ver sus detalles completos',
          'Actualiza el estado del proyecto según corresponda',
          'Sube documentos o evidencias si es necesario'
        ]
      },
      {
        type: 'grid',
        gridItems: [
          {
            title: '📊 Estados de proyecto',
            description: 'Pendiente, En Progreso, Completado, Cancelado'
          },
          {
            title: '📄 Documentación',
            description: 'Sube y gestiona documentos relacionados al proyecto'
          },
          {
            title: '💬 Comunicación',
            description: 'Mantén comunicación con el cliente y administrador'
          },
          {
            title: '⏰ Seguimiento',
            description: 'Monitorea fechas límite y entregables'
          }
        ]
      },
      {
        type: 'alert',
        alertType: 'info',
        text: 'Solo puedes ver y gestionar los proyectos que han sido específicamente asignados a tu empresa.'
      },
      {
        type: 'image',
        imageId: 'IMG-1',
        imageCaption: 'Dashboard de proyectos del asociado - <<cambiar>> (sin opciones de admin)'
      },
      {
        type: 'image',
        imageId: 'IMG-2',
        imageCaption: 'Lista de proyectos asignados - <<cambiar>> (solo proyectos propios)'
      }
    ],
    faq: [
      {
        question: '¿Cómo sé qué proyectos me han asignado?',
        answer: 'Todos los proyectos asignados aparecerán automáticamente en tu dashboard de "Mis Proyectos".'
      },
      {
        question: '¿Puedo rechazar un proyecto asignado?',
        answer: 'Contacta al administrador si necesitas rechazar o renegociar un proyecto asignado.'
      }
    ]
  },

  {
    id: 'solicitudes',
    title: 'Oportunidades Disponibles',
    icon: '📋',
    description: 'Explora nuevas oportunidades de proyectos que coinciden con tus especialidades.',
    content: [
      {
        type: 'text',
        text: 'Aquí puedes ver las solicitudes de proyectos disponibles que coinciden con las especialidades y certificaciones de tu empresa.'
      },
      {
        type: 'steps',
        title: 'Cómo explorar oportunidades:',
        steps: [
          'Ve al módulo "Oportunidades Disponibles"',
          'Revisa las solicitudes que coinciden con tu perfil',
          'Lee los detalles y requisitos de cada proyecto',
          'Expresa tu interés en participar (si está habilitado)',
          'Espera la asignación por parte del administrador'
        ]
      },
      {
        type: 'alert',
        alertType: 'success',
        text: 'Las oportunidades se filtran automáticamente según tus especialidades y certificaciones registradas.'
      },
      {
        type: 'grid',
        gridItems: [
          {
            title: '🎯 Filtrado inteligente',
            description: 'Solo ves proyectos relevantes para tu empresa'
          },
          {
            title: '📋 Detalles completos',
            description: 'Información detallada de cada oportunidad'
          },
          {
            title: '⭐ Requisitos claros',
            description: 'Certificaciones y especialidades necesarias'
          },
          {
            title: '💼 Información del cliente',
            description: 'Detalles del cliente y tipo de proyecto'
          }
        ]
      },
      {
        type: 'image',
        imageId: 'IMG-4',
        imageCaption: 'Lista de oportunidades disponibles - <<cambiar>> (vista filtrada para asociado)'
      },
      {
        type: 'image',
        imageId: 'IMG-5',
        imageCaption: 'Detalle de oportunidad - <<cambiar>> (sin opciones de asignación manual)'
      }
    ],
    faq: [
      {
        question: '¿Por qué no veo muchas oportunidades?',
        answer: 'Las oportunidades se filtran según tus especialidades registradas. Asegúrate de tener tu perfil actualizado.'
      },
      {
        question: '¿Cómo puedo aplicar a una oportunidad?',
        answer: 'El proceso de asignación lo maneja el administrador. Puedes expresar interés si la función está habilitada.'
      }
    ]
  },

  {
    id: 'perfil',
    title: 'Mi Perfil Empresarial',
    icon: '👤',
    description: 'Gestiona la información de tu empresa, certificaciones y especialidades.',
    content: [
      {
        type: 'text',
        text: 'Mantén actualizada la información de tu empresa para asegurar que recibas las oportunidades más relevantes.'
      },
      {
        type: 'steps',
        title: 'Cómo actualizar tu perfil:',
        steps: [
          'Ve al módulo "Mi Perfil" desde el menú',
          'Revisa y actualiza la información básica de tu empresa',
          'Actualiza tus especialidades y áreas de expertise',
          'Sube o actualiza tus certificaciones vigentes',
          'Guarda los cambios realizados'
        ]
      },
      {
        type: 'grid',
        gridItems: [
          {
            title: '🏢 Información empresarial',
            description: 'Datos básicos, contacto y ubicación'
          },
          {
            title: '🎯 Especialidades',
            description: 'Áreas de expertise y servicios ofrecidos'
          },
          {
            title: '📜 Certificaciones',
            description: 'Certificados vigentes y documentación'
          },
          {
            title: '👥 Equipo',
            description: 'Información del equipo y capacidades'
          }
        ]
      },
      {
        type: 'alert',
        alertType: 'warning',
        text: 'Mantener tu perfil actualizado es crucial para recibir oportunidades relevantes y mantener tu estatus activo.'
      },
      {
        type: 'image',
        imageId: 'IMG-6',
        imageCaption: 'Perfil empresarial - información básica - <<cambiar>> (vista de autogestión)'
      },
      {
        type: 'image',
        imageId: 'IMG-7',
        imageCaption: 'Especialidades y certificaciones - <<cambiar>> (vista de asociado)'
      },
      {
        type: 'image',
        imageId: 'IMG-8',
        imageCaption: 'Actualización de datos empresariales - <<cambiar>> (formulario de asociado)'
      }
    ],
    faq: [
      {
        question: '¿Con qué frecuencia debo actualizar mi perfil?',
        answer: 'Recomendamos revisar y actualizar tu perfil al menos cada 3 meses o cuando obtengas nuevas certificaciones.'
      },
      {
        question: '¿Puedo cambiar mis especialidades?',
        answer: 'Sí, puedes actualizar tus especialidades, pero algunos cambios pueden requerir aprobación del administrador.'
      }
    ]
  }
];
