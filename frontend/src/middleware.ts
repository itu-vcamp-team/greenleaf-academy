import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Get auth state from cookies
  const token = request.cookies.get("access_token")?.value;
  const role = request.cookies.get("user_role")?.value;

  // 2. Define route categories
  const isAuthPage = pathname.includes("/auth/login") || pathname.includes("/auth/register");
  const isPrivatePage = pathname.includes("/dashboard") || pathname.includes("/admin") || pathname.includes("/settings");
  const isAdminPage = pathname.includes("/admin");

  // 3. Auth Logic
  if (isPrivatePage && !token) {
    // Unauthenticated user trying to access private page -> Redirect to login
    // We need to preserve the locale in the redirect
    const locale = pathname.split("/")[1] || "tr-TR";
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url));
  }

  if (isAuthPage && token) {
    // Authenticated user trying to access login/register -> Redirect to dashboard
    const locale = pathname.split("/")[1] || "tr-TR";
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  if (isAdminPage && role !== "ADMIN" && role !== "SUPERADMIN") {
    // Non-admin trying to access admin pages -> Redirect to dashboard
    const locale = pathname.split("/")[1] || "tr-TR";
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  // 4. Fallback to i18n middleware
  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: ["/", "/(tr-TR|en-US)/:path*"],
};
