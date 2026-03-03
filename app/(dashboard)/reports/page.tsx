export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getOrganizations } from "@/lib/actions/organizations";
import ReportsWrapper from "@/components/reports/ReportsWrapper";

export default async function ReportsPage() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
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
