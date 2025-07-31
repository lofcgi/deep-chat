import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // API 요청 로깅
  if (request.nextUrl.pathname.startsWith("/api/")) {
    console.log(
      `[${new Date().toISOString()}] ${request.method} ${
        request.nextUrl.pathname
      }`
    );
  }

  // 보안 헤더 추가
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
