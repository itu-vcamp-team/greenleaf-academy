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

  // 1. Get auth state from cookies
  const token = request.cookies.get("access_token")?.value;
  const role = request.cookies.get("user_role")?.value;

  // 2. Define route categories
  const isAuthPage = pathname.includes("/auth/login") || pathname.includes("/auth/register");
  const isPrivatePage =
    pathname.includes("/dashboard") ||
    pathname.includes("/admin") ||
    pathname.includes("/settings");
  const isAdminPage = pathname.includes("/admin");

  const locale = getLocale(pathname);

  // 3. Auth Logic
  if (isPrivatePage && !token) {
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
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
