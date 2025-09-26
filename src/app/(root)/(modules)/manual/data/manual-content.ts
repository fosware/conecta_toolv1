// Re-exportar interfaces y tipos
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
  id?: string;
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

// Re-exportar datos de admin (para compatibilidad con manual-admin)
export { manualSections } from "./admin-content";
