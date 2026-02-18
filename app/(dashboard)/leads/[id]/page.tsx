import { auth } from "@/auth";
import { getLeadDetails } from "@/lib/actions/leads";
import { getSettings } from "@/lib/actions/settings";
import { redirect } from "next/navigation";
import LeadDetailClient from "@/components/leads/LeadDetailClient";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) redirect("/login");

    const { id } = await params;
    const data = await getLeadDetails(id);
    if (!data) redirect("/leads");

    const settings = await getSettings();
    const rawStatuses = settings?.statuses || [];
    const statuses: string[] = rawStatuses.map((s: any) => typeof s === "string" ? s : s.key || s.label || String(s));
    const rawSources = settings?.sources || [];
    const sources: string[] = rawSources.map((s: any) => typeof s === "string" ? s : s.key || s.label || String(s));

    return (
        <LeadDetailClient
            lead={data.lead}
            notes={data.notes}
            actions={data.actions}
            statuses={statuses}
            sources={sources}
            userRole={session.user.role}
            userId={session.user.id}
        />
    );
}
