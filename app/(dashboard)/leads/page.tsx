export const dynamic = "force-dynamic";
import { serialize } from "@/lib/serialize";
import { auth } from "@/auth";

import { getLeads, getLeadsStats, getLeadsByStatus } from "@/lib/actions/leads";
import { getSettings } from "@/lib/actions/settings";
import { getSalesUsers } from "@/lib/actions/users";
import { LeadsClient } from "@/components/leads/LeadsClient";
import { redirect } from "next/navigation";

export default async function LeadsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await auth();
    if (!session) redirect("/login");

    const resolvedParams = await searchParams;

    const [leadsData, stats, settings, users, kanbanLeads] = await Promise.all([
        getLeads(resolvedParams),
        getLeadsStats(),
        getSettings(),
        getSalesUsers(),
        getLeadsByStatus(),
    ]);

    // Serialize Mongoose docs (ObjectId/Date → primitives) for Client Components
    const serializedLeads = serialize(leadsData.leads);
    const serializedStats = serialize(stats);
    const serializedSettings = serialize(settings);
    const serializedUsers = serialize(users);
    const serializedKanban = serialize(kanbanLeads);

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Leads</h2>
            </div>

            <LeadsClient
                leads={serializedLeads}
                total={leadsData.total}
                stats={serializedStats}
                settings={serializedSettings}
                users={serializedUsers}
                currentUserRole={session.user.role}
                currentUserId={session.user.id}
                kanbanLeads={serializedKanban}
            />
        </div>
    );
}
