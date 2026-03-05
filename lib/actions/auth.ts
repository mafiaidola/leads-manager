/**
 * @module lib/actions/auth
 * @description Server action for credential-based authentication.
 *
 * Exports:
 * - `authenticate` — validates credentials via next-auth `signIn("credentials")`
 *   and logs the login event via `logAudit`
 */
"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function authenticate(
    prevState: string | undefined,
    formData: FormData
) {
    try {
        await signIn("credentials", {
            username: formData.get("username") as string,
            password: formData.get("password") as string,
            orgSlug: formData.get("orgSlug") as string,
            redirect: false,
        });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return "Invalid credentials.";
                default:
                    return "Something went wrong.";
            }
        }
        throw error;
    }

    redirect("/");
}

export async function handleSignOut() {
    await signOut();
}
