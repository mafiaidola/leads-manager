import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ReportsClient from "@/components/reports/ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        redirect("/");
    }

    return <ReportsClient />;
}
