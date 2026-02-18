function Sk({ className }: { className?: string }) {
    return <div className={`bg-white/5 rounded animate-pulse ${className || ""}`} />;
}

export default function LeadDetailLoading() {
    return (
        <div className="space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Sk className="h-5 w-28 rounded-full" />
                <div className="flex-1" />
                <Sk className="h-8 w-8 rounded-full" />
                <Sk className="h-8 w-[140px] rounded-full" />
            </div>

            {/* Name & Meta */}
            <div className="space-y-2">
                <Sk className="h-9 w-64 rounded-xl" />
                <div className="flex gap-3">
                    <Sk className="h-4 w-32 rounded-full" />
                    <Sk className="h-4 w-24 rounded-full" />
                    <Sk className="h-4 w-28 rounded-full" />
                </div>
            </div>

            {/* Grid */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Cards */}
                <div className="space-y-6">
                    <div className="rounded-3xl border border-white/10 bg-card/40 p-6 space-y-4">
                        <Sk className="h-5 w-36 rounded-lg" />
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5">
                                <Sk className="h-8 w-8 rounded-lg" />
                                <div className="space-y-1 flex-1">
                                    <Sk className="h-3 w-12 rounded-full" />
                                    <Sk className="h-4 w-32 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-card/40 p-6 space-y-4">
                        <Sk className="h-5 w-28 rounded-lg" />
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex justify-between items-center p-2.5 rounded-xl bg-white/5">
                                <Sk className="h-3 w-16 rounded-full" />
                                <Sk className="h-4 w-20 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Timeline */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex gap-2">
                        {[1, 2, 3, 4].map((i) => (
                            <Sk key={i} className="h-9 w-28 rounded-full" />
                        ))}
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-card/40 p-6 space-y-4">
                        <Sk className="h-5 w-36 rounded-lg" />
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex gap-3 py-3">
                                <Sk className="h-10 w-10 rounded-full shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <Sk className="h-3 w-20 rounded-full" />
                                    <Sk className="h-4 w-full max-w-[300px] rounded-full" />
                                    <Sk className="h-3 w-36 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
