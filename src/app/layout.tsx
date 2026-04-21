import type { Metadata } from "next";
import { Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from '@/components/lisan/theme-provider';
import { AuthProvider } from '@/components/auth/auth-provider';
import { CallNotification } from '@/components/lisan/call-notification';
import { LanguageProvider } from '@/components/lisan/language-provider';
import { PwaRegister } from '@/components/lisan/pwa-register';

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "লিসান - আরবি শিখুন",
  description: "আরবি শব্দ শিখুন এবং কথোপকথন অনুশীলন করুন।",
  keywords: ["লিসান", "Arabic", "Bangla", "Vocabulary", "Islamic", "Quran"],
  manifest: '/manifest.webmanifest',
  applicationName: 'Lisan',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Lisan',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
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
        className={`${hindSiliguri.variable} ${hindSiliguri.className} antialiased bg-background text-foreground`}
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
                <PwaRegister />
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
