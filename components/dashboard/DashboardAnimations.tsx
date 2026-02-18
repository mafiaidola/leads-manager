"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

// ─── Fade-in-up on scroll/mount ───────────────────────────────────────────────
export function FadeIn({
    children,
    delay = 0,
    className = "",
}: {
    children: ReactNode;
    delay?: number;
    className?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(20px)",
                transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)`,
                transitionDelay: `${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}

// ─── Animated counter ─────────────────────────────────────────────────────────
export function CountUp({
    end,
    duration = 1200,
    suffix = "",
    className = "",
}: {
    end: number;
    duration?: number;
    suffix?: string;
    className?: string;
}) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const startTime = Date.now();
        const startVal = 0;

        function tick() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out curve
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(startVal + (end - startVal) * easedProgress);
            setCount(current);

            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        }

        requestAnimationFrame(tick);
    }, [end, duration]);

    return (
        <span ref={ref} className={className}>
            {count}{suffix}
        </span>
    );
}

// ─── Stagger container ────────────────────────────────────────────────────────
export function StaggerContainer({
    children,
    staggerMs = 100,
    className = "",
}: {
    children: ReactNode[];
    staggerMs?: number;
    className?: string;
}) {
    return (
        <div className={className}>
            {children.map((child, i) => (
                <FadeIn key={i} delay={i * staggerMs}>
                    {child}
                </FadeIn>
            ))}
        </div>
    );
}

// ─── Mini Sparkline chart ─────────────────────────────────────────────────────
export function Sparkline({
    data,
    color = "var(--primary)",
    width = 80,
    height = 28,
}: {
    data: number[];
    color?: string;
    width?: number;
    height?: number;
}) {
    if (!data || data.length < 2) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const padding = 2;

    const points = data.map((val, i) => {
        const x = padding + (i / (data.length - 1)) * (width - padding * 2);
        const y = height - padding - ((val - min) / range) * (height - padding * 2);
        return `${x},${y}`;
    }).join(" ");

    return (
        <svg width={width} height={height} className="overflow-visible">
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-60"
            />
            {/* Dot at the end */}
            {data.length > 0 && (() => {
                const lastX = padding + ((data.length - 1) / (data.length - 1)) * (width - padding * 2);
                const lastY = height - padding - ((data[data.length - 1] - min) / range) * (height - padding * 2);
                return <circle cx={lastX} cy={lastY} r="3" fill={color} className="opacity-80" />;
            })()}
        </svg>
    );
}
