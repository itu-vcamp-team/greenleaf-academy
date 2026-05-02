import type { MetadataRoute } from "next";

const BASE_URL = "https://tr.greenleafakademi.com";
const LOCALES = ["tr-TR", "en-US"] as const;

/** Herkese açık, statik sayfalar. Admin/dashboard/auth hariç. */
const PUBLIC_ROUTES = [
  "",                  // anasayfa
  "/academy",
  "/calendar",
  "/resources",
  "/dashboard-preview",
  "/legal/kvkk",
  "/legal/aydinlatma",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const route of PUBLIC_ROUTES) {
      entries.push({
        url: `${BASE_URL}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === "" ? "weekly" : "monthly",
        priority: route === "" ? 1.0 : 0.8,
        alternates: {
          languages: {
            "tr-TR": `${BASE_URL}/tr-TR${route}`,
            "en-US": `${BASE_URL}/en-US${route}`,
          },
        },
      });
    }
  }

  return entries;
}
