import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { SidebarConfigProvider } from "@/contexts/sidebar-context";
import { Toaster } from "@/components/ui/sonner";
import { inter } from "@/lib/fonts";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export const metadata: Metadata = {
  title: "BoolTox",
  description: "Pure Web Toolbox + 资源导航",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${inter.variable} antialiased`}>
      <body className={inter.className}>
        <NuqsAdapter>
          <ThemeProvider defaultTheme="system" storageKey="nextjs-ui-theme">
            <SidebarConfigProvider>
              {children}
              <Toaster richColors position="top-center" />
            </SidebarConfigProvider>
          </ThemeProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
