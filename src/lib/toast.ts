import toast from "react-hot-toast";

const baseStyle = {
  style: {
    backgroundColor: "var(--background)",
    color: "var(--foreground)",
    border: "1px solid var(--border-color)",
  },
};

export const showToast = {
  success: (message: string) => toast.success(message, baseStyle),
  error: (message: string) => toast.error(message, baseStyle),
  info: (message: string) => toast(message, baseStyle),
};
