/**
 * @component DashboardAnimations
 * @description Framer Motion wrapper providing fade-in and stagger animations
 * for dashboard cards and sections. Exports AnimatedCard and AnimatedSection.
 */
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
            ref={(node) => { ref.current = node; if (node) node.style.setProperty('--fade-delay', `${delay}ms`); }}
            className={`fade-in-up${visible ? ' visible' : ''} ${className}`}
        >
            {children}
        </div>
    );
}

// ─── Animated counter with viewport trigger ──────────────────────────────────
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
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (hasAnimated.current) { setCount(end); return; }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    const startTime = performance.now();
                    function tick(now: number) {
                        const elapsed = now - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        // easeOutExpo — premium feel
                        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                        setCount(Math.round(eased * end));
                        if (progress < 1) requestAnimationFrame(tick);
                    }
                    requestAnimationFrame(tick);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [end, duration]);

    return (
        <span ref={ref} className={className}>
            {count.toLocaleString()}{suffix}
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
