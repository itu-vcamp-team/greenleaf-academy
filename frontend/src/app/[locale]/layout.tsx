import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Inter } from "next/font/google";
import { UserRoleProvider } from "@/context/UserRoleContext";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default async function LocaleLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const locale = params.locale;
  const children = props.children;
  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} antialiased selection:bg-primary/30`}>
        <NextIntlClientProvider messages={messages}>
          <UserRoleProvider>
            <Toaster richColors position="top-right" />
            <main className="min-h-screen bg-background">{children}</main>
          </UserRoleProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
