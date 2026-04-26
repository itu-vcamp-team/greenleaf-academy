import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Cloudflare Turnstile requires its own domain for frames, scripts and XHR.
// YouTube needs frame-src + script-src for embeds.
const CSP = [
  "default-src 'self'",
  // Turnstile needs 'unsafe-eval' (official Cloudflare requirement); YouTube embed scripts
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://s.ytimg.com",
  // Turnstile iframe + YouTube player (noCookie mode)
  "frame-src https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com https://drive.google.com",
  // Turnstile uses blob: workers internally; XHR to Cloudflare + YouTube postMessage
  "worker-src blob: https://challenges.cloudflare.com",
  "connect-src 'self' blob: https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com",
  // Inline styles needed by many UI libs
  "style-src 'self' 'unsafe-inline'",
  // YouTube thumbnails + Cloudflare challenge images
  "img-src 'self' data: blob: https://img.youtube.com https://i.ytimg.com https://challenges.cloudflare.com",
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
