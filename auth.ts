import NextAuth, { type DefaultSession } from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

declare module "next-auth" {
    interface Session {
        user: {
            role: string;
            id: string;
        } & DefaultSession["user"]
    }

    interface User {
        role: string;
    }
}


async function getUser(username: string) {
    try {
        await dbConnect();
        const user = await User.findOne({ username: username.toLowerCase() });
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
                    .object({ username: z.string().min(3), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { username, password } = parsedCredentials.data;
                    const user = await getUser(username);
                    if (!user) return null;

                    // Check if user is active
                    if (user.active === false) return null;

                    const passwordsMatch = await bcrypt.compare(
                        password,
                        user.passwordHash
                    );

                    if (passwordsMatch) {
                        // Return a plain object — NextAuth v5 requires id, not _id
                        return {
                            id: user._id.toString(),
                            name: user.name,
                            email: user.email || user.username,
                            role: user.role,
                        };
                    }
                }

                return null;
            },
        }),
    ],
});
