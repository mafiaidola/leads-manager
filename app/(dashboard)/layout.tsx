import { Sidebar } from "@/components/Sidebar";
import { MobileSidebar } from "@/components/MobileSidebar";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LogOut, UserCircle2, Bell } from "lucide-react";
import { handleSignOut } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { HeaderBreadcrumb } from "@/components/HeaderBreadcrumb";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session) {
        redirect("/login");
    }

    return (
        <div className="h-full relative bg-[#fafafa] dark:bg-[#09090b]">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] p-4">
                <Sidebar userRole={session.user?.role} />
            </div>
            <main className="md:pl-72 pb-10 min-h-screen">
                {/* Modern Glassmorphic Header */}
                <header className="sticky top-0 z-50 p-4">
                    <div className="flex items-center justify-between px-6 py-3 bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-xl shadow-black/5">
                        <div className="flex items-center gap-4">
                            <MobileSidebar userRole={session.user?.role} />
                            <div className="hidden md:block">
                                <HeaderBreadcrumb />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Simple Notifications Placeholder */}
                            <button aria-label="Notifications" className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all relative">
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full border-2 border-white dark:border-black" />
                            </button>

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

                <div className="px-4">
                    {children}
                </div>
            </main>
        </div>
    );
}
