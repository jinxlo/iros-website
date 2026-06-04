import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CartProvider } from "@/stores/cart-context";
import { SiteContentProvider } from "@/stores/site-content-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "iroselectronics | Electrónica y electrodomésticos",
  description:
    "Tienda profesional de electrónica y electrodomésticos para hogares modernos.",
  metadataBase: new URL("https://iroselectronics.com"),
  icons: {
    icon: "/logos/icon.png",
    shortcut: "/logos/icon.png",
    apple: "/logos/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-950">
        <SiteContentProvider>
          <CartProvider>{children}</CartProvider>
        </SiteContentProvider>
      </body>
    </html>
  );
}
