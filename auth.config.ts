import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    providers: [], // Added later in auth.ts
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/");
            const isOnLogin = nextUrl.pathname.startsWith("/login");

            if (isOnDashboard) {
                if (isOnLogin) return true; // Always allow access to login page
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                return Response.redirect(new URL("/", nextUrl));
            }
            return true;
        },
        async jwt({ token, user }: { token: any; user: any }) {
            if (user) {
                token.role = user.role;
                token.id = user.id || user._id; // Ensure ID is available
            }
            return token;
        },
        async session({ session, token }: { session: any; token: any }) {
            if (token) {
                session.user.role = token.role;
                session.user.id = token.id;
            }
            return session;
        },
    },
} satisfies NextAuthConfig;
