import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user as { role?: string })?.role;
      const isSolicitante = role === "SOLICITANTE";
      const isAuthPage = nextUrl.pathname.startsWith("/login");
      const isPortal = nextUrl.pathname.startsWith("/portal");

      if (isAuthPage) {
        if (!isLoggedIn) return true;
        return Response.redirect(new URL(isSolicitante ? "/portal" : "/board", nextUrl));
      }

      if (!isLoggedIn) return Response.redirect(new URL("/login", nextUrl));

      // SOLICITANTE só pode acessar /portal
      if (isSolicitante && !isPortal) {
        return Response.redirect(new URL("/portal", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  providers: [],
};
