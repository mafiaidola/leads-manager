export default function ReportsLoading() {
    return (
        <div className="p-8 space-y-8 bg-background/50 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="h-9 w-64 bg-white/5 rounded-xl" />
                <div className="flex gap-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-9 w-24 bg-white/5 rounded-xl" />
                    ))}
                </div>
            </div>
            <div className="grid gap-6 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-white/5 h-[110px]" />
                ))}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                <div className="p-6 rounded-3xl bg-white/5 h-[160px]" />
                <div className="p-6 rounded-3xl bg-white/5 h-[160px]" />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-white/5 h-[400px]" />
                ))}
            </div>
            <div className="grid gap-6 md:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-white/5 h-[400px]" />
                ))}
            </div>
        </div>
    );
}
