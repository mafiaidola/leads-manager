export const dynamic = "force-dynamic";
/**
 * @page /reports
 * @description Server component for the reports/analytics page.
 * Fetches report data and org list for SuperAdmin. Admin-only access.
 */
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getOrganizations } from "@/lib/actions/organizations";
import ReportsWrapper from "@/components/reports/ReportsWrapper";

export default async function ReportsPage() {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "IQA")) {
        redirect("/");
    }

    const isSuperAdmin = !!(session.user as any).isSuperAdmin;
    const organizations = isSuperAdmin ? await getOrganizations() : [];

    return (
        <ReportsWrapper
            isSuperAdmin={isSuperAdmin}
            organizations={organizations.map((o: any) => ({ _id: o._id, name: o.name, slug: o.slug }))}
        />
    );
}
