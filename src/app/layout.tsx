import type { Metadata } from "next";
import { Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from '@/components/lisan/theme-provider';
import { AuthProvider } from '@/components/auth/auth-provider';
import { CallNotification } from '@/components/lisan/call-notification';
import { LanguageProvider } from '@/components/lisan/language-provider';

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "লিসান - আরবি শিখুন",
  description: "আরবি শব্দ শিখুন এবং কথোপকথন অনুশীলন করুন।",
  keywords: ["লিসান", "Arabic", "Bangla", "Vocabulary", "Islamic", "Quran"],
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
          <LanguageProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem
              disableTransitionOnChange
            >
              <div className="min-h-screen bg-background">
                <CallNotification />
                {children}
              </div>
              <Toaster />
            </ThemeProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
