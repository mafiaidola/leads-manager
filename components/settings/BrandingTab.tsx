/**
 * @component BrandingTab
 * @description Settings tab for organisation branding: app name, logo upload
 * (via Vercel Blob), and accent colour picker. Live preview of changes.
 */
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Sparkles, Save, Check, Upload, X, ImageIcon, Loader2, Building2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandingTabProps {
    branding: { appName: string; accentColor: string; logoUrl: string; loginTheme: string };
    currentTheme: "violet" | "ocean" | "emerald";
    onBrandingChange: (branding: { appName: string; accentColor: string; logoUrl: string; loginTheme: string }) => void;
    onSaveBranding: () => void;
    onChangeTheme: (theme: "violet" | "ocean" | "emerald") => void;
}

const LOGIN_THEMES = [
    { key: "aurora", name: "Aurora Mesh", desc: "Animated gradient blobs & floating orbs", gradient: "from-violet-600 via-purple-600 to-fuchsia-600", borderColor: "violet" },
    { key: "waves", name: "Geometric Waves", desc: "Layered SVG wave animations", gradient: "from-blue-600 via-indigo-600 to-violet-700", borderColor: "blue" },
    { key: "particles", name: "Particle Network", desc: "Floating connected particles", gradient: "from-cyan-600 via-blue-700 to-indigo-800", borderColor: "cyan" },
    { key: "neon", name: "Neon Grid", desc: "Cyberpunk grid with scan lines", gradient: "from-green-500 via-emerald-600 to-teal-700", borderColor: "emerald" },
    { key: "gradient", name: "Gradient Shift", desc: "Smooth gradient rotation & blobs", gradient: "from-pink-500 via-rose-600 to-orange-600", borderColor: "pink" },
    { key: "minimal", name: "Minimal Blur", desc: "Clean, frosted glass spotlight", gradient: "from-slate-600 via-zinc-700 to-neutral-800", borderColor: "slate" },
];

const ACCENT_PRESETS = [
    { color: "#8b5cf6", name: "Violet" },
    { color: "#3b82f6", name: "Blue" },
    { color: "#06b6d4", name: "Cyan" },
    { color: "#10b981", name: "Emerald" },
    { color: "#f59e0b", name: "Amber" },
    { color: "#ef4444", name: "Red" },
    { color: "#ec4899", name: "Pink" },
    { color: "#f97316", name: "Orange" },
];

export function BrandingTab({
    branding, currentTheme,
    onBrandingChange, onSaveBranding,
    onChangeTheme,
}: BrandingTabProps) {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = useCallback(async (file: File) => {
        if (!file.type.startsWith("image/")) return;
        if (file.size > 2 * 1024 * 1024) {
            alert("File too large. Maximum size is 2MB.");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();

            if (data.error) {
                alert(data.error);
            } else {
                onBrandingChange({ ...branding, logoUrl: data.url });
            }
        } catch {
            alert("Upload failed. Check BLOB_READ_WRITE_TOKEN environment variable.");
        }
        setUploading(false);
    }, [branding, onBrandingChange]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files[0];
        if (file) handleUpload(file);
    }, [handleUpload]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
    }, [handleUpload]);

    const removeLogo = useCallback(async () => {
        if (branding.logoUrl) {
            try {
                await fetch("/api/upload", {
                    method: "DELETE",
                    body: JSON.stringify({ url: branding.logoUrl }),
                    headers: { "Content-Type": "application/json" },
                });
            } catch { /* blob cleanup is best-effort */ }
        }
        onBrandingChange({ ...branding, logoUrl: "" });
    }, [branding, onBrandingChange]);

    return (
        <>
            <div className="grid gap-6 lg:grid-cols-5">
                {/* Left column — Branding controls */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Logo Upload */}
                    <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <ImageIcon className="h-5 w-5 text-violet-500" />
                                Organization Logo
                            </CardTitle>
                            <CardDescription className="text-muted-foreground/80">
                                Upload your organization&apos;s logo. Appears in the sidebar, login page, and exports.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {branding.logoUrl ? (
                                <div className="flex items-center gap-4">
                                    <div className="relative group">
                                        <div className="h-20 w-20 rounded-2xl border-2 border-white/10 bg-white/5 flex items-center justify-center overflow-hidden shadow-lg">
                                            <img
                                                src={branding.logoUrl}
                                                alt="Organization logo"
                                                className="h-full w-full object-contain p-2"
                                            />
                                        </div>
                                        <button
                                            onClick={removeLogo}
                                            aria-label="Remove logo"
                                            className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-green-400">Logo uploaded</p>
                                        <p className="text-xs text-muted-foreground mt-1 break-all line-clamp-2">{branding.logoUrl}</p>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="rounded-xl text-xs mt-2 text-violet-400 hover:text-violet-300"
                                        >
                                            <Upload className="h-3 w-3 mr-1" /> Replace
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                    onDragLeave={() => setDragActive(false)}
                                    onDrop={handleDrop}
                                    onClick={() => !uploading && fileInputRef.current?.click()}
                                    className={cn(
                                        "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300",
                                        dragActive
                                            ? "border-violet-500 bg-violet-500/10 scale-[1.01]"
                                            : "border-white/10 hover:border-white/30 hover:bg-white/[0.02]",
                                        uploading && "opacity-50 pointer-events-none"
                                    )}
                                >
                                    {uploading ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                                            <p className="text-sm text-violet-400">Uploading...</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-14 w-14 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                                                <Upload className="h-6 w-6 text-violet-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">
                                                    Drop your logo here or <span className="text-violet-400 underline underline-offset-4">click to browse</span>
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP, or SVG · Max 2MB</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                className="hidden"
                                onChange={handleFileSelect}
                                title="Upload organization logo"
                                aria-label="Upload organization logo"
                            />
                            {/* Manual URL fallback */}
                            <div className="pt-2 border-t border-white/5">
                                <Label className="text-xs text-muted-foreground ml-1">Or paste logo URL</Label>
                                <Input
                                    value={branding.logoUrl}
                                    onChange={(e) => onBrandingChange({ ...branding, logoUrl: e.target.value })}
                                    placeholder="https://example.com/logo.png"
                                    className="rounded-xl border-white/10 bg-black/20 mt-1"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* App Name & Accent Color */}
                    <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Palette className="h-5 w-5 text-pink-500" />
                                App Identity
                            </CardTitle>
                            <CardDescription className="text-muted-foreground/80">Customize your CRM&apos;s name and brand color.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs ml-1">App Name</Label>
                                <Input
                                    value={branding.appName}
                                    onChange={(e) => onBrandingChange({ ...branding, appName: e.target.value })}
                                    className="rounded-xl border-white/10 bg-black/20"
                                    placeholder="My Organization CRM"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-xs ml-1">Accent Color</Label>
                                {/* Presets */}
                                <div className="flex flex-wrap gap-2">
                                    {ACCENT_PRESETS.map((preset) => (
                                        <AccentColorDiv color={preset.color}
                                            title={preset.name}
                                            className={cn(
                                                "h-9 w-9 rounded-xl transition-all duration-200 hover:scale-110 border-2 branding-preview",
                                                branding.accentColor === preset.color
                                                    ? "border-white shadow-lg scale-110"
                                                    : "border-transparent hover:border-white/30"
                                            )}
                                            onClick={() => onBrandingChange({ ...branding, accentColor: preset.color })}
                                        />
                                    ))}
                                </div>
                                {/* Custom picker */}
                                <div className="flex gap-3 items-center">
                                    <Input
                                        type="color"
                                        value={branding.accentColor}
                                        onChange={(e) => onBrandingChange({ ...branding, accentColor: e.target.value })}
                                        title="Pick accent color"
                                        className="h-10 w-16 p-1 rounded-xl border-white/10 bg-black/20 cursor-pointer"
                                    />
                                    <Input
                                        value={branding.accentColor}
                                        onChange={(e) => onBrandingChange({ ...branding, accentColor: e.target.value })}
                                        className="rounded-xl border-white/10 bg-black/20 font-mono flex-1"
                                        maxLength={7}
                                    />
                                </div>
                            </div>
                            <Button onClick={onSaveBranding} className="rounded-xl bg-pink-500 hover:bg-pink-600 px-8 shadow-lg shadow-pink-500/20 w-full sm:w-auto">
                                <Save className="h-4 w-4 mr-2" />Save Branding
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Right column — Live Preview */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden sticky top-24">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Eye className="h-5 w-5 text-emerald-500" />
                                Live Preview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Sidebar Preview */}
                            <div>
                                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Sidebar</p>
                                <div className="bg-[#0a0a0a] rounded-2xl p-5 border border-white/10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <AccentDiv
                                            accent={branding.accentColor}
                                            className="h-11 w-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg accent-gradient-logo"
                                        >
                                            {branding.logoUrl ? (
                                                <img src={branding.logoUrl} alt="" className="h-7 w-7 object-contain" />
                                            ) : (
                                                (branding.appName || "A").charAt(0).toUpperCase()
                                            )}
                                        </AccentDiv>
                                        <div>
                                            <p className="font-bold text-sm text-white">{branding.appName || "SMTC"}</p>
                                            <p className="text-[10px] text-white/40">Exclusive Edition</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        {["Dashboard", "Leads", "Reports"].map((item, i) => (
                                            <div key={item} className={cn("flex items-center gap-2 px-3 py-2 rounded-xl text-xs", i === 0 ? "bg-white/10 text-white" : "text-white/40")}>
                                                <div className="h-3 w-3 rounded bg-white/20" />
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Login Preview */}
                            <div>
                                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Login Page</p>
                                <div className="bg-gradient-to-br from-[#0a0a0a] to-[#1a1a2e] rounded-2xl p-5 border border-white/10 text-center">
                                    <AccentDiv
                                            accent={branding.accentColor}
                                            className="h-14 w-14 rounded-2xl mx-auto flex items-center justify-center text-white font-bold text-xl shadow-xl mb-3 accent-gradient-logo"
                                        >
                                        {branding.logoUrl ? (
                                            <img src={branding.logoUrl} alt="" className="h-9 w-9 object-contain" />
                                        ) : (
                                            (branding.appName || "A").charAt(0).toUpperCase()
                                        )}
                                    </AccentDiv>
                                    <p className="font-bold text-white text-sm">{branding.appName || "SMTC Group"}</p>
                                    <p className="text-[10px] text-white/30 mb-3">Exclusive Edition</p>
                                    <div className="space-y-2 max-w-[180px] mx-auto">
                                        <div className="h-7 bg-white/5 rounded-lg border border-white/10" />
                                        <div className="h-7 bg-white/5 rounded-lg border border-white/10" />
                                        <AccentColorDiv
                                                color={branding.accentColor}
                                                className="h-7 rounded-lg text-[10px] font-bold text-white flex items-center justify-center branding-preview"
                                            >
                                                Sign In
                                            </AccentColorDiv>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Theme Picker — Full width below */}
            <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden mt-6">
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        App Theme
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/80">Choose a theme for all users. This applies globally across the entire application.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                        {/* Violet Noir */}
                        <button
                            onClick={() => onChangeTheme("violet")}
                            className={cn(
                                "group relative rounded-2xl border-2 p-1 transition-all duration-300 hover:scale-[1.02]",
                                currentTheme === "violet" ? "border-violet-500 shadow-lg shadow-violet-500/25" : "border-white/10 hover:border-white/30"
                            )}
                        >
                            <div className="rounded-xl overflow-hidden">
                                <div className="h-24 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 relative">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent)]" />
                                    <div className="absolute bottom-2 left-3 flex gap-1">
                                        <div className="h-2 w-8 bg-white/40 rounded-full" />
                                        <div className="h-2 w-5 bg-white/25 rounded-full" />
                                    </div>
                                </div>
                                <div className="p-3 bg-card/80">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold">Violet Noir</p>
                                            <p className="text-[10px] text-muted-foreground">Premium &amp; Modern</p>
                                        </div>
                                        {currentTheme === "violet" && (
                                            <div className="h-6 w-6 rounded-full bg-violet-500 flex items-center justify-center">
                                                <Check className="h-3.5 w-3.5 text-white" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </button>

                        {/* Ocean Blue */}
                        <button
                            onClick={() => onChangeTheme("ocean")}
                            className={cn(
                                "group relative rounded-2xl border-2 p-1 transition-all duration-300 hover:scale-[1.02]",
                                currentTheme === "ocean" ? "border-blue-500 shadow-lg shadow-blue-500/25" : "border-white/10 hover:border-white/30"
                            )}
                        >
                            <div className="rounded-xl overflow-hidden">
                                <div className="h-24 bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-500 relative">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent)]" />
                                    <div className="absolute bottom-2 left-3 flex gap-1">
                                        <div className="h-2 w-8 bg-white/40 rounded-full" />
                                        <div className="h-2 w-5 bg-white/25 rounded-full" />
                                    </div>
                                </div>
                                <div className="p-3 bg-card/80">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold">Ocean Blue</p>
                                            <p className="text-[10px] text-muted-foreground">Corporate &amp; Clean</p>
                                        </div>
                                        {currentTheme === "ocean" && (
                                            <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                                                <Check className="h-3.5 w-3.5 text-white" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </button>

                        {/* Emerald Forest */}
                        <button
                            onClick={() => onChangeTheme("emerald")}
                            className={cn(
                                "group relative rounded-2xl border-2 p-1 transition-all duration-300 hover:scale-[1.02]",
                                currentTheme === "emerald" ? "border-emerald-500 shadow-lg shadow-emerald-500/25" : "border-white/10 hover:border-white/30"
                            )}
                        >
                            <div className="rounded-xl overflow-hidden">
                                <div className="h-24 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-600 relative">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent)]" />
                                    <div className="absolute bottom-2 left-3 flex gap-1">
                                        <div className="h-2 w-8 bg-white/40 rounded-full" />
                                        <div className="h-2 w-5 bg-white/25 rounded-full" />
                                    </div>
                                </div>
                                <div className="p-3 bg-card/80">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold">Emerald Forest</p>
                                            <p className="text-[10px] text-muted-foreground">Fresh &amp; Natural</p>
                                        </div>
                                        {currentTheme === "emerald" && (
                                            <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                                <Check className="h-3.5 w-3.5 text-white" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* Login Theme Picker */}
            <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden mt-6">
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Eye className="h-5 w-5 text-cyan-500" />
                        Login Page Theme
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/80">
                        Choose a creative background for the login page. Each theme uses your accent color.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {LOGIN_THEMES.map(t => (
                            <button
                                key={t.key}
                                onClick={() => {
                                    onBrandingChange({ ...branding, loginTheme: t.key });
                                }}
                                className={cn(
                                    "group relative rounded-2xl border-2 p-1 transition-all duration-300 hover:scale-[1.02] text-left",
                                    branding.loginTheme === t.key
                                        ? `border-${t.borderColor}-500 shadow-lg shadow-${t.borderColor}-500/25 ring-1 ring-${t.borderColor}-500/30`
                                        : "border-white/10 hover:border-white/30"
                                )}
                            >
                                <div className="rounded-xl overflow-hidden">
                                    <div className={cn("h-20 bg-gradient-to-br relative", t.gradient)}>
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent)]" />
                                        {/* Mini decorative elements per theme */}
                                        {t.key === "waves" && (
                                            <svg className="absolute bottom-0 left-0 w-full h-8 opacity-40" viewBox="0 0 400 40" preserveAspectRatio="none">
                                                <path d="M0,20 Q100,5 200,20 T400,20 L400,40 L0,40 Z" fill="white" opacity="0.3" />
                                            </svg>
                                        )}
                                        {t.key === "particles" && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                {[0,1,2,3,4].map(i => (
                                                    <div key={i} className="absolute w-1.5 h-1.5 bg-white/40 rounded-full" style={{ left: `${20 + i * 15}%`, top: `${30 + (i % 2) * 30}%` }} />
                                                ))}
                                            </div>
                                        )}
                                        {t.key === "neon" && (
                                            <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                                        )}
                                        {t.key === "minimal" && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-16 h-16 rounded-full bg-white/10 blur-xl" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 bg-card/80">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-bold">{t.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{t.desc}</p>
                                            </div>
                                            {branding.loginTheme === t.key && (
                                                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                                    <Check className="h-3.5 w-3.5 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                    <Button onClick={onSaveBranding} className="rounded-xl bg-cyan-500 hover:bg-cyan-600 px-8 shadow-lg shadow-cyan-500/20 mt-4">
                        <Save className="h-4 w-4 mr-2" />Save Login Theme
                    </Button>
                </CardContent>
            </Card>
        </>
    );
}

/* ─── Accent helpers: inject CSS custom properties via ref to avoid inline style warnings ─── */
function AccentDiv({ accent, className, children }: { accent: string; className?: string; children?: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => { if (ref.current) ref.current.style.setProperty("--accent", accent); }, [accent]);
    return <div ref={ref} className={className}>{children}</div>;
}

function AccentColorDiv({
    color, className, children, onClick, title,
}: {
    color: string; className?: string; children?: React.ReactNode;
    onClick?: () => void; title?: string;
}) {
    const ref = useRef<HTMLButtonElement>(null);
    useEffect(() => { if (ref.current) ref.current.style.setProperty("--accent-color", color); }, [color]);
    return <button ref={ref} className={className} onClick={onClick} title={title}>{children}</button>;
}
