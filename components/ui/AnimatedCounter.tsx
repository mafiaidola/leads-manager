"use client";

import { useEffect, useState, useRef } from "react";

interface AnimatedCounterProps {
    value: number;
    duration?: number;
    suffix?: string;
    prefix?: string;
    className?: string;
    decimals?: number;
}

/**
 * @component AnimatedCounter
 * @description Smoothly animates a number from 0 to the target value on mount.
 * Uses requestAnimationFrame with easeOutExpo for premium feel.
 */
export function AnimatedCounter({
    value,
    duration = 1200,
    suffix = "",
    prefix = "",
    className = "",
    decimals = 0,
}: AnimatedCounterProps) {
    const [current, setCurrent] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (hasAnimated.current) {
            setCurrent(value);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    animate();
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [value]);

    function animate() {
        const start = performance.now();
        const from = 0;
        const to = value;

        function tick(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutExpo
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const val = from + (to - from) * eased;
            setCurrent(val);
            if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
    }

    const display = decimals > 0
        ? current.toFixed(decimals)
        : Math.round(current).toLocaleString();

    return (
        <span ref={ref} className={className}>
            {prefix}{display}{suffix}
        </span>
    );
}
