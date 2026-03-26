/**
 * @component ThemeToggle
 * @description Dark/Light/System mode toggle button for dashboard header.
 * Cycles through modes with smooth icon transitions.
 */
"use client";

import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const MODES = [
    { key: "light" as const, label: "Light", icon: Sun },
    { key: "dark" as const, label: "Dark", icon: Moon },
    { key: "system" as const, label: "System", icon: Monitor },
];

export function ThemeToggle() {
    const { mode, resolvedMode, setMode } = useTheme();

    const ActiveIcon = resolvedMode === "dark" ? Moon : Sun;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full h-9 w-9 hover:bg-primary/10"
                    aria-label="Toggle appearance mode"
                >
                    <ActiveIcon className={cn(
                        "h-5 w-5 transition-all duration-300",
                        resolvedMode === "dark" ? "text-amber-400" : "text-yellow-500"
                    )} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-40 rounded-2xl border-white/10 bg-card/95 backdrop-blur-xl"
            >
                {MODES.map(({ key, label, icon: Icon }) => (
                    <DropdownMenuItem
                        key={key}
                        onClick={() => setMode(key)}
                        className="cursor-pointer flex items-center gap-2 rounded-xl"
                    >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1">{label}</span>
                        {mode === key && <Check className="h-3.5 w-3.5 text-primary" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
