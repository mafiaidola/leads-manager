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
        redirect("/");
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
