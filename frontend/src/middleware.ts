import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

const VALID_LOCALES = ["tr-TR", "en-US"];
const DEFAULT_LOCALE = "tr-TR";

/** URL'deki ilk segment geçerli bir locale ise onu, değilse default'u döndürür. */
function getLocale(pathname: string): string {
  const segment = pathname.split("/")[1];
  return VALID_LOCALES.includes(segment) ? segment : DEFAULT_LOCALE;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 0. Root path için explicit redirect: / → /tr-TR
  //    (Google botları ve kullanıcılar root'tan geldiğinde doğru sayfaya yönlendirilir)
  if (pathname === "/") {
    return NextResponse.redirect(new URL(`/${DEFAULT_LOCALE}`, request.url), {
      status: 301, // Kalıcı yönlendirme — Google bunu cacheler
    });
  }

  // 1. Get auth state from cookies
  const token = request.cookies.get("access_token")?.value;
  const role = request.cookies.get("user_role")?.value;

  // 2. Define route categories
  const isAuthPage = pathname.includes("/auth/login") || pathname.includes("/auth/register");
  // Use segment-level matching so /dashboard-preview is NOT treated as private
  const segments = pathname.split("/");
  const isPrivatePage =
    segments.includes("dashboard") ||
    segments.includes("admin") ||
    segments.includes("settings");
  const isAdminPage = pathname.includes("/admin");

  const locale = getLocale(pathname);

  // 3. Auth Logic
  if (isPrivatePage && !token) {
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url));
  }

  if (isAuthPage && token) {
    const target = (role === "ADMIN" || role === "EDITOR") ? "admin" : "dashboard";
    return NextResponse.redirect(new URL(`/${locale}/${target}`, request.url));
  }

  // Only ADMIN and EDITOR roles can access admin pages
  if (isAdminPage && role !== "ADMIN" && role !== "EDITOR") {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  // 4. next-intl middleware: locale detection + prefix ekleme / redirect
  return intlMiddleware(request);
}

export const config = {
  // _next, api ve statik dosyalar hariç her şeyi yakala
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|api).*)"],
};
