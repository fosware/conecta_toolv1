import { catCertificacionesSchema } from "@/schemas/cat-certificaciones-schema";

interface CertificacionesModalProps {
  IsOpen: boolean;
  onClose: () => void;
  onSubmit: (data: catCertificacionesSchema) => Promise<void>;
  initialData?: Partial<catCertificacionesSchema>;
  mode: "edit" | "create";
  onSuccess?: () => Promise<void>;  
}

export const CatCertificacionesModal = (
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: CertificacionesModalProps) => {
  
};

export default CatCertificacionesModal;
