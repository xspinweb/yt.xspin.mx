import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YT Xspin | Creator discovery",
  description: "Motor de descubrimiento para pequenos creadores de YouTube."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
