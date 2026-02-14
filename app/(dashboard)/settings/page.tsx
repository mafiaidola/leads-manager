export const dynamic = "force-dynamic";
import { auth } from "@/auth";

import { getSettings } from "@/lib/actions/settings";
import { getUsers } from "@/lib/actions/users";
import { SettingsClient } from "@/components/settings/SettingsClient";
import { redirect } from "next/navigation";
import { USER_ROLES } from "@/models/User";

export default async function SettingsPage() {
    const session = await auth();
    if (!session) redirect("/login");

    if (session.user.role !== USER_ROLES.ADMIN) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
                <p>You do not have permission to view this page.</p>
            </div>
        )
    }

    const [settings, users] = await Promise.all([
        getSettings(),
        getUsers(),
    ]);

    return (
        <div className="p-8 space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            <SettingsClient settings={settings} users={users} />
        </div>
    );
}
