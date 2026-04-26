import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Noto_Naskh_Arabic, Hind_Siliguri } from 'next/font/google';
import { ThemeProvider } from '@/components/lisan/theme-provider';
import { AuthProvider } from '@/components/auth/auth-provider';
import { CallNotification } from '@/components/lisan/call-notification';
import { LanguageProvider } from '@/components/lisan/language-provider';
import { PwaRegister } from '@/components/lisan/pwa-register';

const notoNaskhArabic = Noto_Naskh_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
});

const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali'],
  variable: '--font-hind-siliguri',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
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
      { url: '/logo.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/logo.png', sizes: '180x180', type: 'image/png' },
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
        className={`${notoNaskhArabic.className} ${hindSiliguri.className} antialiased bg-background text-foreground`}
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
