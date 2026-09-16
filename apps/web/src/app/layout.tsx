import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orion",
  description: "Sistema pessoal de vida com IA embutida",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="bg-zinc-900 text-zinc-100 antialiased">{children}</body>
    </html>
  );
}
