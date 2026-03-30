import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CalendarClient from "@/components/calendar/CalendarClient";

export const metadata = {
    title: "Calendar | Follow-ups",
    description: "Calendar view for follow-up scheduling and management",
};

export default async function CalendarPage() {
    const session = await auth();
    if (!session) redirect("/login");

    return (
        <div className="p-4 sm:p-8 space-y-6">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Follow-up Calendar
            </h1>
            <CalendarClient
                currentUserId={session.user.id}
                currentUserRole={session.user.role}
                isAdmin={session.user.role === "ADMIN"}
            />
        </div>
    );
}
