/**
 * @page /attendance
 * @description Admin-only attendance tracking page.
 * Shows daily login/logout logs and monthly summaries.
 */
export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getAttendanceLogs, getAttendanceSummary, getWorkSchedule, getOrgUsers } from "@/lib/actions/attendance";
import { serialize } from "@/lib/serialize";
import { AttendanceClient } from "@/components/attendance/AttendanceClient";

export default async function AttendancePage() {
    const session = await auth();
    if (!session) redirect("/login");

    const role = session.user.role;
    const isSuperAdmin = !!(session.user as any).isSuperAdmin;
    if (role !== "ADMIN" && !isSuperAdmin) redirect("/");

    const today = new Date().toISOString().split("T")[0];
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const [todayLogs, monthlySummary, workSchedule, orgUsers] = await Promise.all([
        getAttendanceLogs(today),
        getAttendanceSummary(currentMonth, currentYear),
        getWorkSchedule(),
        getOrgUsers(),
    ]);

    return (
        <div className="p-8 space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Attendance</h2>
            <AttendanceClient
                initialLogs={serialize(todayLogs)}
                initialSummary={serialize(monthlySummary)}
                workSchedule={serialize(workSchedule)}
                orgUsers={serialize(orgUsers)}
                initialDate={today}
                initialMonth={currentMonth}
                initialYear={currentYear}
            />
        </div>
    );
}
