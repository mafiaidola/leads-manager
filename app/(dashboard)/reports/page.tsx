import { auth } from "@/auth";
import { redirect } from "next/navigation";
import nextDynamic from "next/dynamic";

const ReportsClient = nextDynamic(() => import("@/components/reports/ReportsClient"), {
    loading: () => (
        <div className="p-8 space-y-8 bg-background/50">
            <div className="flex items-center justify-between">
                <div className="h-9 w-64 bg-white/5 rounded-xl animate-pulse" />
            </div>
            <div className="grid gap-6 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-white/5 animate-pulse h-[110px]" />
                ))}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-white/5 animate-pulse h-[400px]" />
                ))}
            </div>
        </div>
    ),
    ssr: false,
});

export default async function ReportsPage() {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
        redirect("/");
    }

    return <ReportsClient />;
}
