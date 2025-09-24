export const searchIndex = {
  // Términos y conceptos clave con sus secciones relacionadas
  terms: {
    // Gestión de Proyectos
    'proyecto': {
      sections: ['proyectos', 'solicitudes'],
      description: 'Gestión completa de proyectos desde solicitud hasta finalización'
    },
    'actividad': {
      sections: ['proyectos'],
      description: 'Tareas específicas dentro de un proyecto'
    },
    'etapa': {
      sections: ['proyectos'],
      description: 'Grandes agrupaciones creadas por el administrador para organizar categorías'
    },
    'categoría': {
      sections: ['proyectos'],
      description: 'Agrupaciones de actividades creadas por los asociados'
    },
    'bitácora': {
      sections: ['proyectos'],
      description: 'Registro de eventos y cambios en el proyecto'
    },
    'progreso': {
      sections: ['proyectos'],
      description: 'Porcentaje de avance del proyecto y sus actividades'
    },

    // Solicitudes
    'solicitud': {
      sections: ['solicitudes', 'asignadas'],
      description: 'Petición de proyecto de un cliente'
    },
    'requerimiento': {
      sections: ['solicitudes'],
      description: 'Especificaciones técnicas de productos o servicios necesarios'
    },
    'cotización': {
      sections: ['solicitudes', 'asignadas'],
      description: 'Propuesta económica de los asociados'
    },
    'especialidad': {
      sections: ['solicitudes', 'asociados', 'catalogos'],
      description: 'Capacidades técnicas requeridas o disponibles'
    },
    'certificación': {
      sections: ['solicitudes', 'asociados', 'catalogos'],
      description: 'Normas y estándares de calidad requeridos'
    },
    'participante': {
      sections: ['solicitudes'],
      description: 'Asociados invitados a cotizar en una solicitud'
    },

    // Asociados
    'asociado': {
      sections: ['asociados', 'solicitudes', 'asignadas'],
      description: 'Empresas proveedoras registradas en el sistema'
    },
    'proveedor': {
      sections: ['asociados'],
      description: 'Empresa que suministra productos o servicios'
    },
    'certificado': {
      sections: ['asociados'],
      description: 'Documento que acredita cumplimiento de normas'
    },
    'compromiso de certificación': {
      sections: ['asociados'],
      description: 'Acuerdo para obtener certificación en plazo determinado'
    },
    'capacidad productiva': {
      sections: ['asociados'],
      description: 'Volumen de producción que puede manejar un asociado'
    },

    // Clientes
    'cliente': {
      sections: ['clientes', 'solicitudes'],
      description: 'Empresas que solicitan productos o servicios'
    },
    'contacto': {
      sections: ['clientes'],
      description: 'Persona específica de contacto en el cliente'
    },
    'área de negocio': {
      sections: ['clientes'],
      description: 'Departamentos del cliente (Compras, Ingeniería, etc.)'
    },

    // Sistema
    'usuario': {
      sections: ['usuarios', 'asociados', 'perfil'],
      description: 'Cuenta de acceso al sistema'
    },
    'rol': {
      sections: ['usuarios'],
      description: 'Nivel de permisos (Admin, Asociado, Staff)'
    },
    'perfil': {
      sections: ['perfil'],
      description: 'Información personal del usuario'
    },
    'login': {
      sections: ['login'],
      description: 'Proceso de inicio de sesión'
    },
    'contraseña': {
      sections: ['login', 'perfil'],
      description: 'Clave de acceso al sistema'
    },

    // NDAs y Seguridad
    'nda': {
      sections: ['ndas'],
      description: 'Acuerdo de Confidencialidad'
    },
    'confidencialidad': {
      sections: ['ndas'],
      description: 'Protección de información técnica'
    },

    // Reportes y Catálogos
    'reporte': {
      sections: ['reportes'],
      description: 'Análisis e inteligencia de negocio'
    },
    'catálogo': {
      sections: ['catalogos'],
      description: 'Configuración de especialidades y certificaciones'
    }
  },

  // Acciones comunes que los usuarios buscan
  actions: [
    {
      text: 'crear solicitud',
      sectionId: 'solicitudes',
      keywords: ['nueva solicitud', 'agregar solicitud', 'solicitar proyecto']
    },
    {
      text: 'crear asociado',
      sectionId: 'asociados',
      keywords: ['nuevo asociado', 'registrar proveedor', 'agregar empresa']
    },
    {
      text: 'crear cliente',
      sectionId: 'clientes',
      keywords: ['nuevo cliente', 'registrar cliente', 'agregar cliente']
    },
    {
      text: 'agregar certificación',
      sectionId: 'asociados',
      keywords: ['subir certificado', 'certificar asociado', 'ISO']
    },
    {
      text: 'definir especialidades',
      sectionId: 'asociados',
      keywords: ['capacidades técnicas', 'especialidades técnicas']
    },
    {
      text: 'gestionar requerimientos',
      sectionId: 'solicitudes',
      keywords: ['agregar requerimiento', 'especificaciones técnicas']
    },
    {
      text: 'invitar asociados',
      sectionId: 'solicitudes',
      keywords: ['seleccionar participantes', 'enviar invitaciones']
    },
    {
      text: 'revisar cotizaciones',
      sectionId: 'solicitudes',
      keywords: ['gestionar cotizaciones', 'propuestas económicas']
    },
    {
      text: 'crear actividad',
      sectionId: 'proyectos',
      keywords: ['nueva actividad', 'agregar tarea', 'añadir actividad']
    },
    {
      text: 'ver progreso proyecto',
      sectionId: 'proyectos',
      keywords: ['avance proyecto', 'estado proyecto', 'porcentaje completado']
    },
    {
      text: 'asignar usuario',
      sectionId: 'asociados',
      keywords: ['vincular usuario', 'usuario asociado', 'acceso empresa']
    },
    {
      text: 'cambiar contraseña',
      sectionId: 'perfil',
      keywords: ['actualizar contraseña', 'modificar clave']
    },
    {
      text: 'cerrar sesión',
      sectionId: 'perfil',
      keywords: ['logout', 'salir sistema']
    }
  ],

  // Problemas comunes y sus soluciones
  troubleshooting: [
    {
      problem: 'asociado no aparece en búsqueda',
      solution: 'Verificar especialidades, certificaciones y usuario asignado',
      sectionId: 'asociados'
    },
    {
      problem: 'no puedo crear solicitud',
      solution: 'Verificar que el cliente tenga áreas y contactos configurados',
      sectionId: 'solicitudes'
    },
    {
      problem: 'cotización no se envía',
      solution: 'Verificar que se haya justificado exclusión de asociados',
      sectionId: 'solicitudes'
    },
    {
      problem: 'no puedo acceder al sistema',
      solution: 'Verificar usuario, contraseña y permisos',
      sectionId: 'login'
    },
    {
      problem: 'proyecto no se crea automáticamente',
      solution: 'Verificar que el cliente haya aceptado la cotización',
      sectionId: 'solicitudes'
    }
  ],

  // Sinónimos y términos relacionados
  synonyms: {
    'empresa': ['asociado', 'proveedor', 'compañía'],
    'solicitud': ['petición', 'requerimiento', 'pedido'],
    'cotización': ['propuesta', 'presupuesto', 'oferta'],
    'actividad': ['tarea', 'trabajo', 'labor'],
    'usuario': ['cuenta', 'acceso', 'login'],
    'certificación': ['certificado', 'norma', 'estándar'],
    'especialidad': ['capacidad', 'habilidad', 'competencia']
  }
};
