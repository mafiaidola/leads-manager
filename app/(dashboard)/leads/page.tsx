export const dynamic = "force-dynamic";
import { auth } from "@/auth";

import { getLeads, getLeadsStats } from "@/lib/actions/leads";
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

    const [leadsData, stats, settings, users] = await Promise.all([
        getLeads(resolvedParams),
        getLeadsStats(),
        getSettings(),
        getSalesUsers(),
    ]);

    // Ensure everything is plain objects for Client Components
    const serializedLeads = JSON.parse(JSON.stringify(leadsData.leads));
    const serializedStats = JSON.parse(JSON.stringify(stats));
    const serializedSettings = JSON.parse(JSON.stringify(settings));
    const serializedUsers = JSON.parse(JSON.stringify(users));

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
            />
        </div>
    );
}
