import type { Metadata } from "next";
import { Outfit, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
  weight: ["400", "500", "600"],
});

const jbmono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jbmono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Imperio Barber | Barbería de Autor",
  description: "Reserva tu cita en Imperio Barber: cortes, rituales de afeitado y gestión de barberos en un solo lugar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body
        className={`${outfit.variable} ${hanken.variable} ${jbmono.variable} font-sans bg-surface text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container`}
      >
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="w-full pt-20 bg-surface flex-1">{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
