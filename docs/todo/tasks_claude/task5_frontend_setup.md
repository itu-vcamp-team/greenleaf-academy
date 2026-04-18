# Task 5: Frontend Proje Kurulumu

## 🎯 Hedef
`frontend/` dizini altında Next.js 15 (App Router) + TypeScript + TailwindCSS 4 projesini kurmak; i18n (çok dil) altyapısını, tenant tema sistemini, API client'ını ve temel layout bileşenlerini hazırlamak.

## ⚠️ Ön Koşullar
- Node.js 20+ kurulu olmalı (`node --version`)
- Backend Task 1 tamamlanmış ve çalışıyor olmalı (`http://localhost:8000/health`)
- Tenant sistemi (Task 3) çalışıyor olmalı

---

## 📁 Adım 1: Next.js 15 Projesini Başlat

```bash
# Proje kökünde çalıştır (greanleaf-academy/ yerine frontend/ kullanacağız)
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --no-eslint-strict \
  --import-alias "@/*"
```

Kurulum sonrası oluşacak yapıyı `7_project_structure.md`'ye uygun şekilde genişlet:

```
frontend/
├── src/
│   ├── app/
│   │   ├── [locale]/                  # i18n: tüm sayfalar locale altında
│   │   │   ├── (public)/              # Misafir sayfaları (layout gizli nav)
│   │   │   │   ├── page.tsx           # Ana sayfa (landing)
│   │   │   │   └── layout.tsx
│   │   │   ├── (auth)/                # Login, Register sayfaları
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   ├── forgot-password/page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── (dashboard)/           # Partner ve Admin sayfaları (korumalı)
│   │   │   │   ├── dashboard/page.tsx
│   │   │   │   ├── academy/
│   │   │   │   │   ├── page.tsx       # Akademi ana sayfası
│   │   │   │   │   ├── shorts/page.tsx
│   │   │   │   │   └── masterclass/page.tsx
│   │   │   │   ├── calendar/page.tsx
│   │   │   │   ├── resources/page.tsx # Kaynak Merkezi
│   │   │   │   ├── settings/page.tsx
│   │   │   │   ├── admin/             # Sadece Admin/Superadmin
│   │   │   │   │   ├── users/page.tsx
│   │   │   │   │   ├── content/page.tsx
│   │   │   │   │   ├── events/page.tsx
│   │   │   │   │   └── announcements/page.tsx
│   │   │   │   └── layout.tsx         # Korumalı layout (auth kontrol)
│   │   │   └── layout.tsx             # Locale layout (font, metadata)
│   │   ├── api/                       # Next.js Route Handlers (proxy)
│   │   │   └── [...proxy]/route.ts    # Backend'e proxy (opsiyonel)
│   │   ├── globals.css
│   │   └── layout.tsx                 # Root layout
│   ├── components/
│   │   ├── ui/                        # Temel UI bileşenleri
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Avatar.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx             # Desktop üst navigasyon
│   │   │   ├── MobileBottomNav.tsx    # Mobil alt navigasyon (app gibi)
│   │   │   ├── Sidebar.tsx            # Admin sidebar
│   │   │   └── Footer.tsx
│   │   ├── academy/
│   │   │   ├── ShortsPlayer.tsx
│   │   │   ├── MasterclassPlayer.tsx
│   │   │   ├── ContentCard.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── SearchBar.tsx
│   │   ├── calendar/
│   │   │   ├── CalendarGrid.tsx
│   │   │   └── EventList.tsx
│   │   └── home/
│   │       ├── CountdownBanner.tsx    # FOMO geri sayım banner
│   │       └── AnnouncementCard.tsx
│   ├── context/
│   │   ├── TenantContext.tsx
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── useTenant.ts
│   │   ├── useAuth.ts
│   │   └── useToast.ts
│   ├── lib/
│   │   ├── api-client.ts              # Backend API çağrıları
│   │   └── utils.ts
│   ├── store/
│   │   └── auth.store.ts              # Zustand store
│   └── types/
│       ├── tenant.types.ts
│       ├── user.types.ts
│       └── academy.types.ts
├── public/
│   └── locales/                       # i18n çeviri dosyaları
│       ├── tr/common.json
│       └── en/common.json
├── messages/                          # next-intl mesaj dosyaları
│   ├── tr.json
│   └── en.json
├── next.config.ts
├── tailwind.config.ts
└── .env.local
```

---

## 📦 Adım 2: Gerekli Paketleri Kur

```bash
cd frontend

# i18n (çoklu dil)
npm install next-intl

# State management
npm install zustand

# API client
npm install axios

# Form yönetimi
npm install react-hook-form zod @hookform/resolvers

# Tarih/zaman
npm install date-fns

# Takvim
npm install react-big-calendar

# Toast bildirimleri
npm install react-hot-toast

# İkon kütüphanesi
npm install lucide-react
```

---

## ⚙️ Adım 3: `next.config.ts` – i18n ve API Proxy

```typescript
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Frontend → Backend API proxy
        // /api/backend/* → BACKEND_URL/*
        source: "/api/backend/:path*",
        destination: `${process.env.NEXT_PUBLIC_BACKEND_URL}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { hostname: "img.youtube.com" },  // YouTube thumbnail'ları
    ],
  },
};

export default withNextIntl(nextConfig);
```

---

## 🌍 Adım 4: i18n Kurulumu (next-intl)

### `src/i18n/request.ts`
```typescript
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ locale }) => {
  return {
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

### `src/i18n/routing.ts`
```typescript
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["tr", "en", "de", "fr", "ru", "es", "cn"],
  defaultLocale: "tr",
});
```

### `src/middleware.ts` (Next.js middleware – locale yönlendirmesi)
```typescript
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
```

### `messages/tr.json` (örnek)
```json
{
  "nav": {
    "academy": "Akademi",
    "shorts": "Shorts",
    "masterclass": "Masterclass",
    "calendar": "Takvim",
    "resources": "Kaynaklar",
    "dashboard": "Panosu",
    "settings": "Ayarlar",
    "logout": "Çıkış"
  },
  "auth": {
    "login": "Giriş Yap",
    "register": "Kayıt Ol",
    "email": "E-posta",
    "password": "Şifre",
    "username": "Kullanıcı Adı",
    "captcha_hint": "Ekrandaki sayıların toplamını girin"
  },
  "academy": {
    "continue_watching": "Kaldığın yerden devam et",
    "locked": "Bu içerik kilitli",
    "completed": "Tamamlandı",
    "mark_complete": "Tamamlandı Olarak İşaretle",
    "search_placeholder": "İçerik ara..."
  }
}
```

---

## 🏢 Adım 5: `src/context/TenantContext.tsx` – Tenant Tema Sistemi

```typescript
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import apiClient from "@/lib/api-client";

interface TenantConfig {
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  support_links: Record<string, string>;
  social_media: Record<string, string>;
}

interface TenantData {
  slug: string;
  name: string;
  config: TenantConfig;
}

const TenantContext = createContext<TenantData | null>(null);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<TenantData | null>(null);

  useEffect(() => {
    // Subdomain'e göre backend'den tenant bilgisini çek
    apiClient.get("/tenants/current").then((res) => {
      const data: TenantData = res.data;
      setTenant(data);

      // CSS değişkenlerini dinamik olarak ata (Tailwind uyumlu)
      document.documentElement.style.setProperty(
        "--color-primary",
        data.config.primary_color || "#2D6A4F"
      );
      document.documentElement.style.setProperty(
        "--color-secondary",
        data.config.secondary_color || "#74C69D"
      );
    });
  }, []);

  return (
    <TenantContext.Provider value={tenant}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
}
```

### `tailwind.config.ts` içinde CSS variable desteği ekle:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 🔐 Adım 6: `src/store/auth.store.ts` – Zustand Auth Store

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: "SUPERADMIN" | "ADMIN" | "EDITOR" | "PARTNER" | "GUEST";
  partner_id: string | null;
  profile_image_path: string | null;
}

interface AuthState {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
  setAuth: (user: User, access_token: string, refresh_token: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      access_token: null,
      refresh_token: null,
      setAuth: (user, access_token, refresh_token) =>
        set({ user, access_token, refresh_token }),
      clearAuth: () =>
        set({ user: null, access_token: null, refresh_token: null }),
      isAuthenticated: () => !!get().access_token,
    }),
    {
      name: "greenleaf-auth",
      // Güvenlik notu: access_token'ı localStorage'da tutmak XSS riski taşır.
      // Üretim ortamında HttpOnly cookie kullanmayı değerlendir.
      partialize: (state) => ({
        user: state.user,
        access_token: state.access_token,
        refresh_token: state.refresh_token,
      }),
    }
  )
);
```

---

## 🌐 Adım 7: `src/lib/api-client.ts` – Axios API Client

```typescript
import axios from "axios";
import { useAuthStore } from "@/store/auth.store";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Request interceptor: Her isteğe Authorization header'ı ekle
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: 401 durumunda token yenile veya logout
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refresh_token = useAuthStore.getState().refresh_token;
      if (refresh_token) {
        try {
          const res = await axios.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/refresh`,
            { refresh_token }
          );
          const { access_token } = res.data;
          useAuthStore.getState().setAuth(
            useAuthStore.getState().user!,
            access_token,
            refresh_token
          );
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        } catch {
          useAuthStore.getState().clearAuth();
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 📱 Adım 8: `src/components/layout/MobileBottomNav.tsx` – Mobil Alt Navigasyon

Mobil cihazlarda ekranın altında sabit duran, native uygulama hissi veren navigasyon:

```typescript
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, BookOpen, Calendar, FolderOpen, User } from "lucide-react";
import { useTranslations } from "next-intl";

const navItems = [
  { href: "/dashboard", icon: Home, labelKey: "nav.dashboard" },
  { href: "/academy", icon: BookOpen, labelKey: "nav.academy" },
  { href: "/calendar", icon: Calendar, labelKey: "nav.calendar" },
  { href: "/resources", icon: FolderOpen, labelKey: "nav.resources" },
  { href: "/settings", icon: User, labelKey: "nav.settings" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const t = useTranslations();

  return (
    // lg ekranlarında gizle, sadece mobilde göster
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, icon: Icon, labelKey }) => {
          const isActive = pathname.includes(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

---

## 📄 Adım 9: `.env.local`

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_APP_ENV=development
```

---

## ✅ Kabul Kriterleri

- [ ] `npm run dev` çalışıyor, `http://localhost:3000` açılıyor
- [ ] `tr.localhost:3000` ve `en.localhost:3000` farklı dilleri gösteriyor
- [ ] Tenant renkleri (primary/secondary) CSS değişkeni olarak sayfaya uygulanıyor
- [ ] Mobil görünümde (< 1024px) altta navigasyon barı görünüyor
- [ ] Desktop görünümde (>= 1024px) üstte Navbar görünüyor, alt nav gizli
- [ ] Korumalı route'lara (örn: `/dashboard`) giriş yapmadan erişilince login'e yönlendiriyor
- [ ] API client token ekliyor ve 401'de refresh deniyor

---

## 📝 Junior Developer Notları

> **`(public)`, `(auth)`, `(dashboard)` nedir?** Next.js'de parantez içindeki klasörler "route group"tur. URL'ye yansımaz; sadece farklı layout'lar uygulamak için kullanılır. `/academy` sayfasına hem `(dashboard)` layout'u hem de `[locale]` layout'u uygulanır.
>
> **`next-intl` neden?** Yerleşik Next.js i18n, App Router ile sınırlıdır. `next-intl` daha zengin özellikler sunar: mesaj dosyaları, hook tabanlı çeviri, server/client uyumu.
>
> **CSS değişkeni ile tema neden?** Tailwind statik sınıflar üretir; dinamik renk `tenant.config.primary_color` gibi bir değer olamaz. CSS değişkeni (`var(--color-primary)`) + Tailwind custom color ile bu dinamiklik sağlanır.
>
> **Mobil bottom nav neden `lg:hidden`?** Büyük ekranlarda üstteki Navbar yeterli. Küçük ekranlarda native uygulama hissi için alt navigasyon gösterilir (info_needed.md'de "mobil uygulama gibi en alta icon" notu var).
