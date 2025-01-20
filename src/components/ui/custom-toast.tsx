import { toast } from "sonner";

interface ToastOptions {
  message: string;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
}

export const showToast = ({ message, type = "info", duration = 3000 }: ToastOptions) => {
  // Asegurarnos de que el toast anterior se cierre
  toast.dismiss();
  
  switch (type) {
    case "success":
      toast.success(message, {
        duration,
        className: "bg-green-500 text-white",
      });
      break;
    case "error":
      toast.error(message, {
        duration,
        className: "bg-red-500 text-white",
      });
      break;
    case "warning":
      toast.warning(message, {
        duration,
        className: "bg-yellow-500 text-white",
      });
      break;
    default:
      toast(message, {
        duration,
        className: "bg-blue-500 text-white",
      });
  }
};
