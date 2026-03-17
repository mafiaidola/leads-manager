/**
 * @page /settings
 * @description Server component for the settings page.
 * SuperAdmin gets ALL users (getAllUsers) + securityStats + all orgs.
 * Regular Admin gets own-org users only.
 */
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { auth } from "@/auth";
import { getSettings } from "@/lib/actions/settings";
import { getUsers, getAllUsers } from "@/lib/actions/users";
import { getOrganizations } from "@/lib/actions/organizations";
import { getSecurityStats } from "@/lib/actions/security";
import { SettingsClient } from "@/components/settings/SettingsClient";
import { redirect } from "next/navigation";
import { USER_ROLES } from "@/models/User";

export default async function SettingsPage() {
    const session = await auth();
    if (!session) redirect("/login");
    if (session.user.role !== USER_ROLES.ADMIN) redirect("/");

    const isSuperAdmin = !!(session.user as any).isSuperAdmin;
    const u = session.user as any;

    const [settings, users, organizations, securityStats] = await Promise.all([
        getSettings(),
        isSuperAdmin ? getAllUsers() : getUsers(),
        isSuperAdmin ? getOrganizations() : Promise.resolve([]),
        isSuperAdmin ? getSecurityStats() : Promise.resolve({ users: [], recentEvents: [] }),
    ]);

    const currentUser = {
        name: u.name || u.username || "User",
        username: u.username || "",
        role: u.role || "ADMIN",
        isSuperAdmin,
        lastLogin: u.lastLogin || null,
        createdAt: u.createdAt || null,
        orgName: (organizations as any[]).find((o: any) => o._id?.toString() === session.user.orgId)?.name,
    };

    return (
        <div className="p-8 space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            <Suspense>
                <SettingsClient
                    settings={settings}
                    users={users}
                    isSuperAdmin={isSuperAdmin}
                    organizations={organizations}
                    currentOrgId={session.user.orgId}
                    securityStats={securityStats}
                    currentUser={currentUser}
                />
            </Suspense>
        </div>
    );
}
