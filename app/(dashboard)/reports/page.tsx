export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ReportsWrapper from "@/components/reports/ReportsWrapper";

export default async function ReportsPage() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        redirect("/");
    }

    return <ReportsWrapper />;
}

