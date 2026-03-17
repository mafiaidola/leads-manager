"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * @component SettingsTabSkeleton
 * @description Premium loading skeleton for Settings tab content.
 * Shows pulsing card placeholders while tab data loads.
 */
export function SettingsTabSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl overflow-hidden">
                    <CardHeader className="space-y-2">
                        <div className="h-5 w-40 rounded-lg bg-white/10 animate-pulse" />
                        <div className="h-3 w-64 rounded-lg bg-white/5 animate-pulse" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="h-10 rounded-xl bg-white/5 animate-pulse" />
                        <div className="h-10 rounded-xl bg-white/5 animate-pulse" />
                        <div className="grid grid-cols-2 gap-3">
                            <div className="h-10 rounded-xl bg-white/5 animate-pulse" />
                            <div className="h-10 rounded-xl bg-white/5 animate-pulse" />
                        </div>
                        <div className="h-8 w-32 rounded-xl bg-primary/10 animate-pulse mt-4" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
