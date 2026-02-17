"use client";

import { useTransition, useState } from "react";
import { authenticate } from "@/lib/actions/auth";
import { LayoutDashboard, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

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
            {/* Dynamic Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/20 rounded-full blur-[120px] animate-pulse delay-700" />

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none noise-overlay" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

            <div className="relative w-full max-w-lg px-6 py-12">
                {/* Logo & Branding */}
                <div className="flex flex-col items-center mb-10 group">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-violet-600 p-[2px] shadow-2xl shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
                        <div className="h-full w-full rounded-[14px] bg-[#09090b] flex items-center justify-center">
                            <LayoutDashboard className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white">
                        Leads Manager
                        <span className="text-primary block text-center text-sm font-medium tracking-widest uppercase mt-1 opacity-70">Pro Edition</span>
                    </h1>
                </div>

                {/* Login Card */}
                <div className="group relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-violet-500/50 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                    <div className="relative bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <ShieldCheck className="h-6 w-6 text-primary" />
                                Welcome back
                            </h2>
                            <p className="text-muted-foreground mt-2 text-sm">Enter your credentials to access your CRM dashboard.</p>
                        </div>

                        <form action={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 ml-1">Email Address</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-500 group-focus-within/input:text-primary transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all hover:bg-white/10"
                                        placeholder="admin@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-sm font-medium text-gray-300">Password</label>
                                </div>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-500 group-focus-within/input:text-primary transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        minLength={6}
                                        className="block w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all hover:bg-white/10"
                                        placeholder="••••••••"
                                    />
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

                <div className="mt-8 text-center">
                    <p className="text-sm text-muted-foreground italic opacity-60">
                        "Empowering sales teams with modern leads management."
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
                "group relative w-full flex justify-center items-center gap-2 py-4 px-4 rounded-2xl shadow-xl text-base font-bold text-white transition-all overflow-hidden",
                pending
                    ? "bg-primary/50 cursor-not-allowed"
                    : "bg-gradient-to-r from-primary to-violet-600 hover:shadow-primary/30 active:scale-[0.98]"
            )}
            disabled={pending}
        >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            {pending ? (
                <>
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                </>
            ) : (
                <>
                    <span>Sign into Dashboard</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
            )}
        </button>
    );
}
