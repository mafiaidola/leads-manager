import { auth } from "@/auth";
import { serialize } from "@/lib/serialize";
import { getLeadDetails } from "@/lib/actions/leads";
import { getSettings } from "@/lib/actions/settings";
import { redirect } from "next/navigation";
import LeadDetailClient from "@/components/leads/LeadDetailClient";
import { getSalesUsers } from "@/lib/actions/users";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) redirect("/login");

    const { id } = await params;
    const [data, settings, users] = await Promise.all([
        getLeadDetails(id),
        getSettings(),
        getSalesUsers(),
    ]);
    if (!data) redirect("/leads");

    const rawStatuses = settings?.statuses || [];
    const statuses: string[] = rawStatuses.map((s: any) => typeof s === "string" ? s : s.key || s.label || String(s));
    const rawSources = settings?.sources || [];
    const sources: string[] = rawSources.map((s: any) => typeof s === "string" ? s : s.key || s.label || String(s));
    const serializedSettings = serialize(settings || {});
    const serializedUsers = serialize(users);

    return (
        <LeadDetailClient
            lead={data.lead}
            notes={data.notes}
            actions={data.actions}
            statuses={statuses}
            sources={sources}
            settings={serializedSettings}
            users={serializedUsers}
            userRole={session.user.role}
            userId={session.user.id}
        />
    );
}
