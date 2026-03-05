/**
 * @component MobileSidebar
 * @description Mobile/tablet hamburger-triggered sidebar (Sheet overlay).
 * Shows same nav links as desktop Sidebar with org branding.
 */
"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/Sidebar";

export function MobileSidebar({ userRole, orgBranding, isSuperAdmin }: { userRole: string; orgBranding?: { appName?: string; logoUrl?: string; accentColor?: string }; isSuperAdmin?: boolean }) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <button aria-label="Open navigation menu" className="md:hidden p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                    <Menu className="h-5 w-5" />
                </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-4 w-72 border-white/10 bg-[#09090b]">
                <div onClick={() => setOpen(false)}>
                    <Sidebar userRole={userRole} orgBranding={orgBranding} isSuperAdmin={isSuperAdmin} />
                </div>
            </SheetContent>
        </Sheet>
    );
}
