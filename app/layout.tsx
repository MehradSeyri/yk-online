import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteProvider } from "@/components/site-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/contact-footer";
import { Modals, Toast } from "@/components/modals";

export const metadata: Metadata = {
  title: "YK-Online | Digitální produkty & Marketing",
  description:
    "YK-Online — digitální šablony, programy a marketingové poradenství / digital templates, programs and marketing consulting",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="cs">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Manrope:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SiteProvider>
          <Navbar />
          {children}
          <Footer />
          <Modals />
          <Toast />
        </SiteProvider>
      </body>
    </html>
  );
}
