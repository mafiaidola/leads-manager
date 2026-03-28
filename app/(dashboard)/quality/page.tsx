/**
 * @page /quality
 * @description IQA + Admin quality assurance dashboard.
 * Shows abandoned leads, inactive users, target tracking, and user performance.
 */
export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getSettings } from "@/lib/actions/settings";
import { serialize } from "@/lib/serialize";
import { getSalesUsers } from "@/lib/actions/users";
import QualityClient from "@/components/quality/QualityClient";

export default async function QualityPage() {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "IQA")) {
        redirect("/");
    }

    const [settings, users] = await Promise.all([
        getSettings(),
        getSalesUsers(),
    ]);

    return (
        <div className="p-8 space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Quality Assurance</h2>
            <QualityClient
                settings={serialize(settings)}
                users={serialize(users)}
                currentUserRole={session.user.role}
            />
        </div>
    );
}
