"use client";

interface GoalProgressRingProps {
    current: number;
    target: number;
    label: string;
    color?: string;
}

export function GoalProgressRing({ current, target, label, color = "var(--primary)" }: GoalProgressRingProps) {
    const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-3 group">
            <div className="relative w-36 h-36">
                <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                    {/* Background ring */}
                    <circle
                        cx="60" cy="60" r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-white/5"
                    />
                    {/* Progress ring */}
                    <circle
                        cx="60" cy="60" r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="transition-all duration-1000 ease-out"
                        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold leading-none">{Math.round(percentage)}%</span>
                    <span className="text-[10px] text-muted-foreground font-medium mt-0.5">{current}/{target}</span>
                </div>
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">{label}</p>
        </div>
    );
}
