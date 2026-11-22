import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScanDev | Seguridad web más clara",
  description:
    "Analiza la configuración pública de seguridad de tu sitio, entiende los riesgos y descubre qué puedes mejorar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
