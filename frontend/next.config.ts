import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Cloudflare Turnstile requires its own domain for frames, scripts and XHR.
// YouTube needs frame-src + script-src for embeds.
const CSP = [
  "default-src 'self'",
  // Inline styles needed by Tailwind/framer-motion; Turnstile needs 'unsafe-eval' (official Cloudflare requirement)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://www.youtube.com https://s.ytimg.com",
  // Turnstile renders an <iframe>; YouTube player also needs it
  "frame-src https://challenges.cloudflare.com https://www.youtube.com https://drive.google.com",
  // Turnstile verification XHR happens client-side during widget load
  "connect-src 'self' https://challenges.cloudflare.com",
  // Inline styles needed by many UI libs
  "style-src 'self' 'unsafe-inline'",
  // YouTube thumbnails
  "img-src 'self' data: blob: https://img.youtube.com https://i.ytimg.com",
  // Allow fonts from self
  "font-src 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply CSP to all page routes (not API routes — those are covered by the backend middleware)
        source: "/((?!api/).*)",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        // Frontend → Backend API proxy
        source: "/api/backend/:path*",
        destination: `${
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"
        }/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { hostname: "img.youtube.com" }, // YouTube thumbnails
    ],
  },
};

export default withNextIntl(nextConfig);
