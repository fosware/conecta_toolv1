// Mapeo de imágenes para el Manual del Asociado
// Las imágenes se almacenan en /public/manual-asociado/images/

export const imagesMapping: { [key: string]: string } = {
  // Imágenes de Login - Misma que admin pero enfocada en asociado
  'IMG-0': '/manual-asociado/images/IMG-0.png', // Pantalla de login para asociados
  
  // Imágenes de Proyectos - Vista de asociado (sin opciones de admin)
  'IMG-1': '/manual-asociado/images/IMG-1.png', // Dashboard de proyectos del asociado
  'IMG-2': '/manual-asociado/images/IMG-2.png', // Lista de proyectos asignados
  'IMG-3': '/manual-asociado/images/IMG-3.png', // Detalle de proyecto individual
  
  // Imágenes de Solicitudes/Oportunidades - Vista filtrada para asociado
  'IMG-4': '/manual-asociado/images/IMG-4.png', // Lista de oportunidades disponibles
  'IMG-5': '/manual-asociado/images/IMG-5.png', // Detalle de oportunidad
  
  // Imágenes de Perfil - Gestión de información empresarial
  'IMG-6': '/manual-asociado/images/IMG-6.png', // Perfil empresarial - información básica
  'IMG-7': '/manual-asociado/images/IMG-7.png', // Especialidades y certificaciones
  'IMG-8': '/manual-asociado/images/IMG-8.png', // Actualización de datos
};

// Función helper para obtener la URL de una imagen
export const getImageUrl = (imageId: string): string => {
  return imagesMapping[imageId] || '/404.webp';
};
