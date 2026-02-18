"use client";

import { useTransition, useState, useEffect } from "react";
import { authenticate } from "@/lib/actions/auth";
import { LayoutDashboard, User, Lock, ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            const result = await authenticate(undefined, formData);
            if (result) {
                setErrorMessage(result);
            }
        });
    }

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-[#09090b] overflow-hidden selection:bg-primary/30">
            {/* Animated Background Blobs */}
            <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] bg-primary/15 rounded-full blur-[140px] animate-blob-drift" />
            <div className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] bg-violet-600/15 rounded-full blur-[140px] animate-blob-drift" style={{ animationDelay: "-5s" }} />
            <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] bg-pink-500/10 rounded-full blur-[120px] animate-blob-drift" style={{ animationDelay: "-10s" }} />

            {/* Floating Particles */}
            <FloatingParticles />

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 opacity-15 pointer-events-none noise-overlay" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />

            <div className="relative w-full max-w-lg px-6 py-12">
                {/* Logo & Branding */}
                <div
                    className={cn(
                        "flex flex-col items-center mb-10 group transition-all duration-700",
                        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                    )}
                >
                    <div className="h-18 w-18 rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-[2px] shadow-2xl shadow-primary/30 group-hover:scale-110 group-hover:shadow-primary/40 transition-all duration-500">
                        <div className="h-full w-full rounded-[14px] bg-[#09090b] flex items-center justify-center">
                            <LayoutDashboard className="h-9 w-9 text-white" />
                        </div>
                    </div>
                    <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white">
                        Leads Manager
                        <span className="text-primary block text-center text-sm font-medium tracking-widest uppercase mt-1 opacity-70">
                            Pro Edition
                        </span>
                    </h1>
                </div>

                {/* Login Card */}
                <div
                    className={cn(
                        "group relative transition-all duration-700 delay-200",
                        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                    )}
                >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-primary/30 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-gradient" />
                    <div className="relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <ShieldCheck className="h-6 w-6 text-primary" />
                                Welcome back
                            </h2>
                            <p className="text-muted-foreground mt-2 text-sm">
                                Enter your credentials to access your CRM dashboard.
                            </p>
                        </div>

                        <form action={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 ml-1">Username</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-500 group-focus-within/input:text-primary transition-colors duration-300" />
                                    </div>
                                    <input
                                        type="text"
                                        name="username"
                                        required
                                        minLength={3}
                                        className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 focus:bg-white/10 transition-all duration-300 hover:bg-white/[0.07]"
                                        placeholder="admin"
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-sm font-medium text-gray-300">Password</label>
                                </div>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-500 group-focus-within/input:text-primary transition-colors duration-300" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        required
                                        minLength={6}
                                        className="block w-full pl-11 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 focus:bg-white/10 transition-all duration-300 hover:bg-white/[0.07]"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-primary transition-colors duration-200"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <LoginButton pending={isPending} />

                            <div
                                className="flex h-6 items-end space-x-1"
                                aria-live="polite"
                                aria-atomic="true"
                            >
                                {errorMessage && (
                                    <p className="text-sm text-red-400 flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                                        {errorMessage}
                                    </p>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                <div
                    className={cn(
                        "mt-8 text-center transition-all duration-700 delay-500",
                        mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    )}
                >
                    <p className="text-sm text-muted-foreground italic opacity-50">
                        &quot;Empowering sales teams with modern leads management.&quot;
                    </p>
                </div>
            </div>
        </div>
    );
}

function LoginButton({ pending }: { pending: boolean }) {
    return (
        <button
            type="submit"
            className={cn(
                "group relative w-full flex justify-center items-center gap-2 py-4 px-4 rounded-2xl shadow-xl text-base font-bold text-white transition-all duration-300 overflow-hidden",
                pending
                    ? "bg-primary/50 cursor-not-allowed"
                    : "bg-gradient-to-r from-primary to-primary/80 hover:shadow-primary/30 hover:shadow-2xl active:scale-[0.98] shadow-lg shadow-primary/20"
            )}
            disabled={pending}
        >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {pending ? (
                <>
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                </>
            ) : (
                <>
                    <span>Sign into Dashboard</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </>
            )}
        </button>
    );
}

function FloatingParticles() {
    // Generate deterministic particle positions
    const particles = [
        { left: "10%", top: "20%", size: 3, duration: 6, delay: 0 },
        { left: "20%", top: "80%", size: 2, duration: 8, delay: 1 },
        { left: "80%", top: "10%", size: 4, duration: 7, delay: 2 },
        { left: "70%", top: "60%", size: 2, duration: 9, delay: 0.5 },
        { left: "40%", top: "30%", size: 3, duration: 5, delay: 3 },
        { left: "90%", top: "40%", size: 2, duration: 8, delay: 1.5 },
        { left: "15%", top: "55%", size: 3, duration: 7, delay: 4 },
        { left: "60%", top: "85%", size: 2, duration: 6, delay: 2.5 },
        { left: "35%", top: "70%", size: 4, duration: 10, delay: 1 },
        { left: "85%", top: "75%", size: 2, duration: 7, delay: 3.5 },
        { left: "50%", top: "15%", size: 3, duration: 8, delay: 0 },
        { left: "5%", top: "45%", size: 2, duration: 9, delay: 2 },
    ];

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((p, i) => (
                <div
                    key={i}
                    className="absolute rounded-full bg-primary/20 animate-float"
                    style={{
                        left: p.left,
                        top: p.top,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        ["--float-duration" as string]: `${p.duration}s`,
                        ["--float-delay" as string]: `${p.delay}s`,
                    }}
                />
            ))}
        </div>
    );
}
