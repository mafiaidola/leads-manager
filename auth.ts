import NextAuth, { type DefaultSession } from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Organization from "@/models/Organization";
import bcrypt from "bcryptjs";
import { checkRateLimit, resetRateLimit } from "@/lib/utils/rateLimiter";
import { recordLogin } from "@/lib/actions/attendance";

declare module "next-auth" {
    interface Session {
        user: {
            role: string;
            id: string;
            orgId: string;
            orgSlug: string;
            orgName: string;
            isSuperAdmin: boolean;
        } & DefaultSession["user"]
    }

    interface User {
        role: string;
        orgId: string;
        orgSlug: string;
        orgName: string;
        isSuperAdmin: boolean;
    }
}


async function getUser(username: string, orgId: string) {
    try {
        await dbConnect();
        const user = await User.findOne({ username: username.toLowerCase(), orgId });
        return user;
    } catch (error) {
        console.error("Failed to fetch user:", error);
        throw new Error("Failed to fetch user.");
    }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    trustHost: true,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({
                        username: z.string().min(3),
                        password: z.string().min(6),
                        orgSlug: z.string().min(1),
                    })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { username, password, orgSlug } = parsedCredentials.data;

                    // Rate limiting check (key = orgSlug:username)
                    const rateLimitKey = `login:${orgSlug}:${username.toLowerCase()}`;
                    const rateCheck = checkRateLimit(rateLimitKey);
                    if (rateCheck.limited) {
                        console.warn(`Rate limited: ${rateLimitKey}`);
                        return null;
                    }

                    await dbConnect();

                    // Find the organization by slug
                    const org = await Organization.findOne({ slug: orgSlug, active: true });
                    if (!org) return null;

                    const user = await getUser(username, org._id.toString());
                    // Fallback: SuperAdmin can log into any org
                    if (!user) {
                        const superAdmin = await User.findOne({
                            username: username.toLowerCase(),
                            isSuperAdmin: true,
                            active: true,
                        });
                        if (!superAdmin) {
                            // Log failed attempt — user not found
                            try {
                                const AuditLog = (await import("@/models/AuditLog")).default;
                                await AuditLog.create({
                                    action: "LOGIN_FAILED", entityType: "user",
                                    entityId: "unknown",
                                    userId: undefined, userName: username,
                                    orgId: org._id,
                                    details: `Failed login: user "${username}" not found in ${org.name}`,
                                });
                            } catch { /* silent */ }
                            return null;
                        }
                        // SuperAdmin found — allow login with target org context
                        const passwordsMatch = await bcrypt.compare(password, superAdmin.passwordHash);
                        if (!passwordsMatch) {
                            // Log failed SuperAdmin attempt
                            try {
                                const AuditLog = (await import("@/models/AuditLog")).default;
                                await AuditLog.create({
                                    action: "LOGIN_FAILED", entityType: "user",
                                    entityId: superAdmin._id.toString(),
                                    userId: superAdmin._id, userName: superAdmin.name,
                                    orgId: org._id,
                                    details: `Failed login: wrong password for SuperAdmin "${superAdmin.name}"`,
                                });
                            } catch { /* silent */ }
                            return null;
                        }
                        // Track login
                        try {
                            await User.updateOne({ _id: superAdmin._id }, { $set: { lastLogin: new Date() } });
                            const AuditLog = (await import("@/models/AuditLog")).default;
                            await AuditLog.create({
                                action: "LOGIN", entityType: "user",
                                entityId: superAdmin._id.toString(),
                                userId: superAdmin._id, userName: superAdmin.name,
                                orgId: org._id,
                                details: `${superAdmin.name} (SuperAdmin) logged into ${org.name}`,
                            });
                        } catch { /* silent */ }
                        // Record attendance
                        try { await recordLogin(superAdmin._id.toString(), org._id.toString(), superAdmin.name); } catch { /* silent */ }
                        return {
                            id: superAdmin._id.toString(),
                            name: superAdmin.name,
                            email: superAdmin.email || superAdmin.username,
                            username: superAdmin.username,
                            role: superAdmin.role,
                            orgId: org._id.toString(),
                            orgSlug: org.slug,
                            orgName: org.name,
                            isSuperAdmin: true,
                            createdAt: superAdmin.createdAt?.toISOString() || null,
                            lastLogin: new Date().toISOString(),
                        };
                    }

                    // Check if user is active
                    if (user.active === false) {
                        // Log failed attempt — inactive user
                        try {
                            const AuditLog = (await import("@/models/AuditLog")).default;
                            await AuditLog.create({
                                action: "LOGIN_FAILED", entityType: "user",
                                entityId: user._id.toString(),
                                userId: user._id, userName: user.name,
                                orgId: org._id,
                                details: `Failed login: inactive user "${user.name}"`,
                            });
                        } catch { /* silent */ }
                        return null;
                    }

                    const passwordsMatch = await bcrypt.compare(
                        password,
                        user.passwordHash
                    );

                    if (passwordsMatch) {
                        // Reset rate limit on successful login
                        resetRateLimit(rateLimitKey);
                        // Track login history
                        try {
                            await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });
                            const AuditLog = (await import("@/models/AuditLog")).default;
                            await AuditLog.create({
                                action: "LOGIN",
                                entityType: "user",
                                entityId: user._id.toString(),
                                userId: user._id,
                                userName: user.name,
                                orgId: org._id,
                                details: `${user.name} logged in`,
                            });
                        } catch (e) { /* silent – don't block login */ }

                        // Record attendance
                        try { await recordLogin(user._id.toString(), org._id.toString(), user.name); } catch { /* silent */ }

                        return {
                            id: user._id.toString(),
                            name: user.name,
                            email: user.email || user.username,
                            username: user.username,
                            role: user.role,
                            orgId: org._id.toString(),
                            orgSlug: org.slug,
                            orgName: org.name,
                            isSuperAdmin: user.isSuperAdmin || false,
                            createdAt: user.createdAt?.toISOString() || null,
                            lastLogin: new Date().toISOString(),
                        };
                    }

                    // Failed password — log attempt
                    try {
                        const AuditLog = (await import("@/models/AuditLog")).default;
                        await AuditLog.create({
                            action: "LOGIN_FAILED", entityType: "user",
                            entityId: user._id.toString(),
                            userId: user._id, userName: user.name,
                            orgId: org._id,
                            details: `Failed login: wrong password for "${user.name}"`,
                        });
                    } catch { /* silent */ }
                }

                return null;
            },
        }),
    ],
});
