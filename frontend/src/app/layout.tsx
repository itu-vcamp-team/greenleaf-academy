import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TenantProvider } from "@/context/TenantContext";
import { UserRoleProvider } from "@/context/UserRoleContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Greenleaf Global Hub | Dijital Kale",
  description: "Parçalanmış bir network marketing operasyonunu merkezi, veri odaklı ve yüksek düzeyde ölçeklenebilir bir Dijital Ekosistem'e dönüştürün.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className={`${inter.variable} antialiased selection:bg-primary/30`}>
        <TenantProvider>
          <UserRoleProvider>
            <main className="min-h-screen bg-background">{children}</main>
          </UserRoleProvider>
        </TenantProvider>
      </body>
    </html>
  );
}
