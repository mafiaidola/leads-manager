import NextAuth, { type DefaultSession } from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Organization from "@/models/Organization";
import bcrypt from "bcryptjs";

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

                    await dbConnect();

                    // Find the organization by slug
                    const org = await Organization.findOne({ slug: orgSlug, active: true });
                    if (!org) return null;

                    const user = await getUser(username, org._id.toString());
                    if (!user) return null;

                    // Check if user is active
                    if (user.active === false) return null;

                    const passwordsMatch = await bcrypt.compare(
                        password,
                        user.passwordHash
                    );

                    if (passwordsMatch) {
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

                        return {
                            id: user._id.toString(),
                            name: user.name,
                            email: user.email || user.username,
                            role: user.role,
                            orgId: org._id.toString(),
                            orgSlug: org.slug,
                            orgName: org.name,
                            isSuperAdmin: user.isSuperAdmin || false,
                        };
                    }
                }

                return null;
            },
        }),
    ],
});
