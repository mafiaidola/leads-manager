"use server";

import { auth } from "@/auth";

/**
 * Get the current user's orgId from the session.
 * Throws if not authenticated or no orgId.
 */
export async function getOrgId(): Promise<string> {
    const session = await auth();
    if (!session?.user?.orgId) {
        throw new Error("No organization context. Please re-login.");
    }
    return session.user.orgId;
}

/**
 * Get the current session with orgId guaranteed.
 * Returns session or null if not authenticated.
 */
export async function getOrgSession() {
    const session = await auth();
    if (!session?.user?.orgId) return null;
    return session;
}

/**
 * Check if the current user is a super admin.
 */
export async function isSuperAdmin(): Promise<boolean> {
    const session = await auth();
    return session?.user?.isSuperAdmin === true;
}
