/**
 * @page /leads/[id]
 * @description Server component for the single lead detail page.
 * Fetches lead details, timeline, settings, and users.
 * Renders LeadDetailClient with serialised data.
 */
import { auth } from "@/auth";
import { serialize } from "@/lib/serialize";
import { getLeadDetails } from "@/lib/actions/leads";
import { getSettings } from "@/lib/actions/settings";
import { redirect } from "next/navigation";
import LeadDetailClient from "@/components/leads/LeadDetailClient";
import { getSalesUsers } from "@/lib/actions/users";
import { getLeadChangeHistory } from "@/lib/utils/trackChanges";

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

    // Fetch field change history for Admin/SuperAdmin
    const isAdmin = session.user.role === "ADMIN" || (session.user as any).isSuperAdmin;
    const changeHistory = isAdmin ? await getLeadChangeHistory(id) : [];

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
            isSuperAdmin={!!(session.user as any).isSuperAdmin}
            changeHistory={changeHistory}
        />
    );
}
