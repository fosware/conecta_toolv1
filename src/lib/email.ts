import { Resend } from "resend";
import * as React from "react";
import { WelcomeEmail } from "@/components/email/welcome-email";

const resend = new Resend(process.env.RESEND_API_KEY);

// En desarrollo, enviar todos los emails a esta dirección a menos que SEND_REAL_EMAILS sea true
const DEV_EMAIL = "fosahadal@protonmail.com";
const isDevelopment = process.env.NODE_ENV === "development";
const sendRealEmails = process.env.SEND_REAL_EMAILS === "true";

// Configuración del email
const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "Tooling Cluster";

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
    // Solo redirigir emails en desarrollo si SEND_REAL_EMAILS no es true
    const shouldRedirect = isDevelopment && !sendRealEmails;

    const emailResponse = await resend.emails.send({
      from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
      to: [shouldRedirect ? DEV_EMAIL : to],
      subject: shouldRedirect
        ? `[TEST] Bienvenido a Tooling Cluster - Tus credenciales de acceso`
        : "Bienvenido a Tooling Cluster - Tus credenciales de acceso",
      react: React.createElement(WelcomeEmail, { name, username, password }),
    });

    return {
      success: true,
      isDevelopment,
      originalTo: to,
      sentTo: shouldRedirect ? DEV_EMAIL : to,
    };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw error;
  }
}
