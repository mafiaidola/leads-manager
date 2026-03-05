/**
 * @page /settings
 * @description Server component for the settings page.
 * Fetches org settings, users, and org list. Admin-only access.
 * Renders SettingsClient with 9 tabbed sections.
 */
export const dynamic = "force-dynamic";

import { auth } from "@/auth";

import { getSettings } from "@/lib/actions/settings";
import { getUsers } from "@/lib/actions/users";
import { getOrganizations } from "@/lib/actions/organizations";
import { SettingsClient } from "@/components/settings/SettingsClient";
import { redirect } from "next/navigation";
import { USER_ROLES } from "@/models/User";

export default async function SettingsPage() {
    const session = await auth();
    if (!session) redirect("/login");

    if (session.user.role !== USER_ROLES.ADMIN) {
        redirect("/");
    }

    const isSuperAdmin = !!(session.user as any).isSuperAdmin;

    const [settings, users, organizations] = await Promise.all([
        getSettings(),
        getUsers(),
        isSuperAdmin ? getOrganizations() : Promise.resolve([]),
    ]);

    return (
        <div className="p-8 space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            <SettingsClient
                settings={settings}
                users={users}
                isSuperAdmin={isSuperAdmin}
                organizations={organizations}
                currentOrgId={session.user.orgId}
            />
        </div>
    );
}

