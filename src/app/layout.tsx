import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: 'Conecta Tool Panel',
  description: 'Aplicación administrativa de Conecta Tool',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
