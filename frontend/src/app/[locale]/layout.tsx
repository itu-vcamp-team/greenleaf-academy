import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Inter } from "next/font/google";
import { UserRoleProvider } from "@/context/UserRoleContext";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Footer } from "@/components/layout/Footer";

import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

/**
 * Anti-FOUC (Flash of Unstyled Content) script.
 * Runs SYNCHRONOUSLY before React hydrates, so the correct dark/light class
 * is applied to <html> before the first paint — eliminating the white flash.
 *
 * Strategy:
 *  1. Read the persisted Zustand store from localStorage ("greenleaf-theme")
 *  2. If the stored theme is "dark" (or if nothing is stored, default to dark)
 *     → add the `dark` class to <html>
 *  3. Otherwise remove it.
 */
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem('greenleaf-theme');
    var theme = 'dark'; // default: dark
    if (stored) {
      var parsed = JSON.parse(stored);
      if (parsed && parsed.state && parsed.state.theme) {
        theme = parsed.state.theme;
      }
    }
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {
    // On any error (e.g. private browsing blocks localStorage) default to dark
    document.documentElement.classList.add('dark');
  }
})();
`;

export default async function LocaleLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = params.locale;
  const children = props.children;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/*
          This inline script runs synchronously before the page renders.
          suppressHydrationWarning on <html> silences the React mismatch
          warning that occurs because the server doesn't know the user's
          theme preference.
        */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${inter.variable} antialiased selection:bg-primary/30 flex flex-col min-h-screen`}>
        <NextIntlClientProvider messages={messages}>
          <UserRoleProvider>
            <Toaster richColors position="top-right" />
            <main className="flex-1 bg-background">{children}</main>
            <Footer />
          </UserRoleProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
