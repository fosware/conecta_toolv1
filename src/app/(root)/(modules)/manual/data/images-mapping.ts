// Mapeo de imágenes extraídas del manual
// Generado automáticamente - No editar manualmente

export const imagesMapping: Record<string, string> = {
  "IMG-0": "/manual/images/sys_login.png",
  "IMG-2": "/manual/images/proj_module.png",
  "IMG-3": "/manual/images/proj_detail_overview.png",
  "IMG-4": "/manual/images/proj_create_categories.png",
  "IMG-5": "/manual/images/proj_activities_view.png",
  "IMG-6": "/manual/images/proj_log_window.png",
  "IMG-8": "/manual/images/proj_create_activity.png",
  "IMG-9": "/manual/images/proj_cancelled_activities.png",
  "IMG-11": "/manual/images/proj_create_stages.png",
  "IMG-13": "/manual/images/proj_categories_stages.png",
  "IMG-14": "/manual/images/proj_management.png",
  "IMG-15": "/manual/images/req_module.png",
  "IMG-16": "/manual/images/req_manage_requirements.png",
  "IMG-17": "/manual/images/req_detail_view.png",
  "IMG-18": "/manual/images/req_edit.png",
  "IMG-20": "/manual/images/req_specialties.png",
  "IMG-21": "/manual/images/req_requirements_view.png",
  "IMG-22": "/manual/images/req_certifications.png",
  "IMG-23": "/manual/images/req_participants.png",
  "IMG-25": "/manual/images/req_associates_list.png",
  "IMG-26": "/manual/images/req_quote_detail.png",
  "IMG-27": "/manual/images/req_quote_accept_reject.png",
  "IMG-28": "/manual/images/asg_assigned_requests.png",
  "IMG-29": "/manual/images/asg_documents_quotes.png",
  "IMG-30": "/manual/images/ass_create.png",
  "IMG-31": "/manual/images/ass_list.png",
  "IMG-32": "/manual/images/ass_detail.png",
  "IMG-33": "/manual/images/ass_certificates.png",
  "IMG-34": "/manual/images/ass_specialties.png",
  "IMG-35": "/manual/images/ass_add_users.png",
  "IMG-36": "/manual/images/cli_create.png",
  "IMG-37": "/manual/images/cli_list.png",
  "IMG-38": "/manual/images/cli_create_contact.png",
  "IMG-39": "/manual/images/cli_overview.png",
  "IMG-41": "/manual/images/sys_reports.png",
  "IMG-42": "/manual/images/sys_catalog_specialties.png",
  "IMG-43": "/manual/images/sys_catalog_certifications.png",
  "IMG-44": "/manual/images/sys_ndas.png",
  "IMG-45": "/manual/images/sys_edit_profile.png",
  "IMG-46": "/manual/images/sys_logout.png"
};

// Función helper para obtener imagen con fallback
export function getManualImage(imageId: string): string {
  return imagesMapping[imageId] || '/manual/images/placeholder.png';
}

// Función para verificar si una imagen existe
export function hasManualImage(imageId: string): boolean {
  return imageId in imagesMapping;
}

// Lista de todas las imágenes disponibles
export const availableImages = Object.keys(imagesMapping);
