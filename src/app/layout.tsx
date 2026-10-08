import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import { env } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  title: "Medical Store ERP",
  description: "POS and Inventory Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  void env;

  return (
    <ClerkProvider>
      <html lang="en">
        <body suppressHydrationWarning className="font-sans text-slate-900 antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
