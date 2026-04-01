/**
 * @layout (dashboard)
 * @description Root layout for authenticated dashboard pages.
 * Renders Sidebar, MobileSidebar, HeaderBreadcrumb, NotificationBell.
 * Enforces auth redirect and applies org branding CSS variables.
 */
import { Suspense } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileSidebar } from "@/components/MobileSidebar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LogOut, UserCircle2 } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { handleSignOut } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { HeaderBreadcrumb } from "@/components/HeaderBreadcrumb";
import dbConnect from "@/lib/db";
import Organization from "@/models/Organization";
import { unstable_cache } from "next/cache";
import { ToastHistoryPanel } from "@/components/ui/ToastHistoryPanel";
import { PresenceIndicator } from "@/components/ui/PresenceIndicator";
import { SessionTimeoutWarning } from "@/components/session/SessionTimeoutWarning";
import { CheckInOutWidget } from "@/components/attendance/AttendanceTracker";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session) {
        redirect("/login");
    }

    // Fetch org branding for sidebar (cached 5 min — branding rarely changes)
    let orgBranding: { appName?: string; logoUrl?: string; accentColor?: string } = {};
    let orgTheme: "violet" | "ocean" | "emerald" = "violet";
    try {
        const orgId = (session.user as any)?.orgId;
        if (orgId) {
            const getCachedBranding = unstable_cache(
                async () => {
                    await dbConnect();
                    const org = await Organization.findById(orgId).select("branding theme").lean();
                    return { branding: org?.branding || null, theme: org?.theme || null };
                },
                [`org-branding-${orgId}`],
                { revalidate: 300 }
            );
            const cached = await getCachedBranding();
            if (cached.branding) {
                orgBranding = {
                    appName: cached.branding.appName,
                    logoUrl: cached.branding.logoUrl,
                    accentColor: cached.branding.accentColor,
                };
            }
            if (cached.theme) {
                orgTheme = cached.theme as "violet" | "ocean" | "emerald";
            }
        }
    } catch (e) {
        // Branding is non-critical
    }

    const isSuperAdmin = !!(session.user as any)?.isSuperAdmin;

    return (
        <div className="h-full relative bg-[#fafafa] dark:bg-[#09090b]">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] p-4">
                <Sidebar userRole={session.user?.role} orgBranding={orgBranding} isSuperAdmin={isSuperAdmin} />
            </div>
            <main className="md:pl-72 pb-10 min-h-screen overflow-x-hidden">
                {/* Modern Glassmorphic Header */}
                <header className="sticky top-0 z-50 p-4">
                    <div className="flex items-center justify-between px-6 py-3 bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-xl shadow-black/5">
                        <div className="flex items-center gap-4">
                            <MobileSidebar userRole={session.user?.role} orgBranding={orgBranding} isSuperAdmin={isSuperAdmin} />
                            <div className="hidden md:block">
                                <HeaderBreadcrumb />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">

                            {/* Notifications */}
                            <NotificationBell />

                            {/* Dark/Light Mode */}
                            <ThemeToggle />

                            {/* Presence */}
                            <PresenceIndicator
                                currentUserId={(session.user as any)?.id || ""}
                                currentUserName={session.user?.name || ""}
                                currentPage="/"
                            />

                            {/* Attendance Check-in/out */}
                            <CheckInOutWidget />

                            <div className="h-8 w-[1px] bg-border mx-1" />

                            <div className="flex items-center gap-3 pl-2">
                                <div className="hidden lg:flex flex-col items-end">
                                    <span className="text-sm font-bold text-foreground leading-none">
                                        {session.user?.name}
                                    </span>
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded-md mt-1 border",
                                        session.user?.role === 'ADMIN'
                                            ? "bg-violet-500/10 text-violet-500 border-violet-500/20"
                                            : session.user?.role === 'MARKETING'
                                                ? "bg-teal-500/10 text-teal-500 border-teal-500/20"
                                                : "bg-primary/10 text-primary border-primary/20"
                                    )}>
                                        {session.user?.role}
                                    </span>
                                </div>
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 border border-white/20 flex items-center justify-center">
                                    <UserCircle2 className="h-6 w-6 text-primary" />
                                </div>

                                <form
                                    action={handleSignOut}
                                >
                                    <button className="ml-2 p-2.5 text-red-500 hover:text-white hover:bg-red-500 rounded-xl transition-all group lg:flex items-center gap-2">
                                        <LogOut className="h-5 w-5" />
                                        <span className="hidden xl:block text-xs font-bold">Logout</span>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="px-4 max-w-full overflow-hidden">
                    <Suspense fallback={
                        <div className="p-8 space-y-6 animate-pulse">
                            <div className="h-8 w-48 bg-muted/20 rounded-xl" />
                            <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
                                {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-muted/10 rounded-3xl border border-white/5" />)}
                            </div>
                            <div className="h-64 bg-muted/10 rounded-3xl border border-white/5" />
                        </div>
                    }>
                        {children}
                    </Suspense>
                </div>
                <ToastHistoryPanel />
                <SessionTimeoutWarning />

            </main>
        </div>
    );
}
