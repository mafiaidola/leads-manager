import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AuditClient } from "@/components/audit/AuditClient";

export default async function AuditPage() {
    const session = await auth();
    if (!session) redirect("/login");

    // Only admins can access audit logs
    if (session.user.role !== "ADMIN") redirect("/");

    return (
        <div className="p-8 space-y-6">
            <AuditClient />
        </div>
    );
}
