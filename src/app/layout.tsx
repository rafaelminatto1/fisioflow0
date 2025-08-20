import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "FisioFlow - Sistema de Gestão para Clínicas de Fisioterapia",
  description: "Sistema integrado de gestão para clínicas de fisioterapia com compliance LGPD e COFFITO",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionProvider>
          <div className="min-h-screen bg-background text-foreground">
            {children}
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
