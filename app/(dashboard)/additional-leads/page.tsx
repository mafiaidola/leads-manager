/**
 * @page /additional-leads
 * @description Additional Leads section - personal leads for every user.
 * Users see their own leads; Admin sees all grouped by user.
 */
export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAdditionalLeads, getAdditionalLeadStats } from "@/lib/actions/additionalLeads";
import { getSettings } from "@/lib/actions/settings";
import { getSalesUsers } from "@/lib/actions/users";
import { serialize } from "@/lib/serialize";
import AdditionalLeadsClient from "@/components/additional-leads/AdditionalLeadsClient";

export default async function AdditionalLeadsPage() {
    const session = await auth();
    if (!session) redirect("/login");

    const isSuperAdmin = !!(session.user as any).isSuperAdmin;
    const isAdmin = session.user.role === "ADMIN" || isSuperAdmin;

    const [leadsData, stats, settings, users] = await Promise.all([
        getAdditionalLeads(),
        getAdditionalLeadStats(),
        getSettings(),
        isAdmin ? getSalesUsers() : Promise.resolve([]),
    ]);

    return (
        <div className="p-8 space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Additional Leads</h2>
            <AdditionalLeadsClient
                initialLeads={serialize(leadsData.leads)}
                initialTotal={leadsData.total}
                initialStats={stats}
                settings={serialize(settings)}
                users={serialize(users)}
                currentUserRole={session.user.role}
                currentUserId={session.user.id}
                currentUserName={session.user.name || ""}
                isAdmin={isAdmin}
            />
        </div>
    );
}
