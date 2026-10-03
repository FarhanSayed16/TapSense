import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AppProviders";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "TapSense",
  description: "College water-tap monitoring — pilot admin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
