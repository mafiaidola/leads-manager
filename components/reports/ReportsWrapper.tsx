"use client";
import dynamic from "next/dynamic";
import React from "react";

const ReportsClient = dynamic(() => import("@/components/reports/ReportsClient"), {
    ssr: false,
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
});

class ReportsErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 space-y-4">
                    <h2 className="text-xl font-bold text-red-400">Reports Error</h2>
                    <pre className="p-4 bg-red-900/20 rounded-xl text-red-300 text-sm whitespace-pre-wrap overflow-auto max-h-[400px]">
                        {this.state.error?.message}
                        {"\n\n"}
                        {this.state.error?.stack}
                    </pre>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="px-4 py-2 bg-primary rounded-lg text-sm font-medium"
                    >
                        Try Again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default function ReportsWrapper() {
    return (
        <ReportsErrorBoundary>
            <ReportsClient />
        </ReportsErrorBoundary>
    );
}
