import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    providers: [], // Added later in auth.ts
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnLogin = nextUrl.pathname.startsWith("/login");

            // Public API routes (each has its own internal auth via SEED_SECRET)
            const publicApiPaths = [
                "/api/organizations/public",
                "/api/seed",
                "/api/promote-super",
                "/api/reset-password",
            ];
            if (publicApiPaths.some(p => nextUrl.pathname.startsWith(p))) {
                return true;
            }

            // Login page is always accessible
            if (isOnLogin) {
                // Redirect logged-in users away from login to dashboard
                if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
                return true;
            }

            // All other routes require authentication
            if (!isLoggedIn) return false;
            return true;
        },
        async jwt({ token, user }: { token: any; user: any }) {
            if (user) {
                token.role = user.role;
                token.id = user.id || user._id;
                token.orgId = user.orgId;
                token.orgSlug = user.orgSlug;
                token.orgName = user.orgName;
                token.isSuperAdmin = user.isSuperAdmin || false;
            }
            return token;
        },
        async session({ session, token }: { session: any; token: any }) {
            if (token) {
                session.user.role = token.role;
                session.user.id = token.id;
                session.user.orgId = token.orgId;
                session.user.orgSlug = token.orgSlug;
                session.user.orgName = token.orgName;
                session.user.isSuperAdmin = token.isSuperAdmin || false;
            }
            return session;
        },
    },
} satisfies NextAuthConfig;
