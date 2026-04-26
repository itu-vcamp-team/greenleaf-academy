import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Greenleaf Superadmin",
  description: "Greenleaf Academy Deployment Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
