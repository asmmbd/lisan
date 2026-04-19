import type { Metadata } from "next";
import { Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from '@/components/lisan/theme-provider';
import { AuthProvider } from '@/components/auth/auth-provider';

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Lisan - আরবি শিখুন | Arabic Vocabulary Learning",
  description: "আরবি শব্দ শিখুন এবং কথোপকথন অনুশীলন করুন। Learn Arabic vocabulary and practice conversation skills.",
  keywords: ["Lisan", "Arabic", "Bengali", "Vocabulary", "Islamic", "Quran", "Learning"],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body
        className={`${hindSiliguri.className} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
