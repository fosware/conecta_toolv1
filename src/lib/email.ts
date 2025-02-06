import { Resend } from "resend";
import { WelcomeEmail } from "@/components/email/welcome-email";

const resend = new Resend(process.env.RESEND_API_KEY);

// En desarrollo, enviar todos los emails a esta dirección
const DEV_EMAIL = "fosahadal@protonmail.com";
const isDevelopment = process.env.NODE_ENV === "development";

interface SendWelcomeEmailParams {
  to: string;
  username: string;
  password: string;
  name: string;
}

export async function sendWelcomeEmail({
  to,
  username,
  password,
  name,
}: SendWelcomeEmailParams) {
  try {
    // En desarrollo, enviar al email de prueba pero mantener el email original en el contenido
    const emailResponse = await resend.emails.send({
      from: "Conecta Tool <onboarding@resend.dev>",
      to: [isDevelopment ? DEV_EMAIL : to],
      subject: isDevelopment 
        ? `[TEST - Original to: ${to}] Bienvenido a Conecta Tool - Tus credenciales de acceso`
        : "Bienvenido a Conecta Tool - Tus credenciales de acceso",
      react: WelcomeEmail({ name, username, password }),
    });

    return { 
      success: true,
      isDevelopment,
      originalTo: to,
      sentTo: isDevelopment ? DEV_EMAIL : to
    };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw new Error("Error al enviar el correo de bienvenida");
  }
}
