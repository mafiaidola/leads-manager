import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuditClient } from "@/components/audit/AuditClient";
import { getOrganizations } from "@/lib/actions/organizations";

export default async function AuditPage() {
    const session = await auth();
    if (!session) redirect("/login");

    // Only admins can access audit logs
    if (session.user.role !== "ADMIN") redirect("/");

    const isSuperAdmin = !!(session.user as any).isSuperAdmin;
    const organizations = isSuperAdmin ? await getOrganizations() : [];

    return (
        <div className="p-8 space-y-6">
            <AuditClient
                isSuperAdmin={isSuperAdmin}
                organizations={organizations.map((o: any) => ({ _id: o._id, name: o.name, slug: o.slug }))}
            />
        </div>
    );
}
