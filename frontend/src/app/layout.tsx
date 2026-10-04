import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AppProviders";
import { ToastProvider } from "@/components/ui/Toast";
import { ScaleProvider } from "@/lib/scale-context";

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
    // suppressHydrationWarning: browser extensions (password managers, etc.)
    // often inject attributes like __processed_* onto <html>/<body> before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>
          <ScaleProvider>
            <ToastProvider>{children}</ToastProvider>
          </ScaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
