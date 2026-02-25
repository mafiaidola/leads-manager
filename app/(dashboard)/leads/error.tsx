"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LeadsError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Leads error:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <div className="text-center space-y-2">
                <h2 className="text-xl font-bold">Failed to load leads</h2>
                <p className="text-sm text-muted-foreground max-w-md">
                    An error occurred while loading your leads data. Please try again.
                </p>
            </div>
            <Button onClick={reset} className="rounded-xl gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
            </Button>
        </div>
    );
}
