import { NextRequest, NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default async function proxy(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  if (!session && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/board", request.url));
  }

  const role = (session?.user as { role?: string })?.role;

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/board", request.url));
  }

  if (pathname.startsWith("/relatorios") && !["ADMIN", "SUPERVISOR"].includes(role ?? "")) {
    return NextResponse.redirect(new URL("/board", request.url));
  }

  if (pathname.startsWith("/importar") && !["ADMIN", "SUPERVISOR"].includes(role ?? "")) {
    return NextResponse.redirect(new URL("/board", request.url));
  }

  if (pathname.startsWith("/dashboard") && !["ADMIN", "SUPERVISOR", "AGENTE"].includes(role ?? "")) {
    return NextResponse.redirect(new URL("/board", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
