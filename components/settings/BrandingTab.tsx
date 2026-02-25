"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette, Sparkles, Download, Save, Check, HardDrive, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandingTabProps {
    branding: { appName: string; accentColor: string; logoUrl: string };
    currentTheme: "violet" | "ocean" | "emerald";
    onBrandingChange: (branding: { appName: string; accentColor: string; logoUrl: string }) => void;
    onSaveBranding: () => void;
    onChangeTheme: (theme: "violet" | "ocean" | "emerald") => void;
    onBackup: () => void;
}

export function BrandingTab({
    branding, currentTheme,
    onBrandingChange, onSaveBranding,
    onChangeTheme, onBackup,
}: BrandingTabProps) {
    return (
        <>
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden self-start">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Palette className="h-5 w-5 text-pink-500" />
                            App Branding
                        </CardTitle>
                        <CardDescription className="text-muted-foreground/80">Customize your CRM&apos;s appearance.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs ml-1">App Name</Label>
                            <Input value={branding.appName} onChange={(e) => onBrandingChange({ ...branding, appName: e.target.value })} className="rounded-xl border-white/10 bg-black/20" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs ml-1">Accent Color</Label>
                            <div className="flex gap-3 items-center">
                                <Input type="color" value={branding.accentColor} onChange={(e) => onBrandingChange({ ...branding, accentColor: e.target.value })} className="h-10 w-16 p-1 rounded-xl border-white/10 bg-black/20" />
                                <Input value={branding.accentColor} onChange={(e) => onBrandingChange({ ...branding, accentColor: e.target.value })} className="rounded-xl border-white/10 bg-black/20 font-mono" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs ml-1">Logo URL (optional)</Label>
                            <Input value={branding.logoUrl} onChange={(e) => onBrandingChange({ ...branding, logoUrl: e.target.value })} placeholder="https://..." className="rounded-xl border-white/10 bg-black/20" />
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                            <p className="text-xs text-muted-foreground mb-2">Preview</p>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold branding-preview" style={{ '--accent-color': branding.accentColor } as React.CSSProperties} aria-hidden="true">
                                    {branding.appName.charAt(0)}
                                </div>
                                <span className="font-bold">{branding.appName}</span>
                            </div>
                        </div>
                        <Button onClick={onSaveBranding} className="rounded-xl bg-pink-500 hover:bg-pink-600 px-8 shadow-lg shadow-pink-500/20">
                            <Save className="h-4 w-4 mr-2" />Save Branding
                        </Button>
                    </CardContent>
                </Card>

                {/* Theme Picker */}
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden self-start md:col-span-2">
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
            </div>

            {/* Data Management - separated as full width */}
            <div className="mt-6">
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden self-start">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <Download className="h-5 w-5 text-green-500" />
                            Data Management
                        </CardTitle>
                        <CardDescription className="text-muted-foreground/80">Export and backup your data.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-6 rounded-2xl bg-green-500/5 border border-green-500/10">
                            <h3 className="font-bold text-sm mb-2">Full Backup</h3>
                            <p className="text-xs text-muted-foreground mb-4">Download all leads, users, settings, notes, and actions as a JSON file.</p>
                            <Button onClick={onBackup} className="rounded-xl bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/20">
                                <Download className="h-4 w-4 mr-2" />Download Backup (.json)
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
