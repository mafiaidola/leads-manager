"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Target, Save } from "lucide-react";

interface GeneralTabProps {
    statuses: any[];
    sources: any[];
    goals: { monthlyLeadTarget: number; monthlyConversionTarget: number };
    onStatusChange: (index: number, field: string, value: string) => void;
    onAddStatus: () => void;
    onRemoveStatus: (index: number) => void;
    onSourcesChange: (sources: any[]) => void;
    onGoalsChange: (goals: { monthlyLeadTarget: number; monthlyConversionTarget: number }) => void;
    onSaveSettings: () => void;
    onSaveGoals: () => void;
}

export function GeneralTab({
    statuses, sources, goals,
    onStatusChange, onAddStatus, onRemoveStatus,
    onSourcesChange, onGoalsChange,
    onSaveSettings, onSaveGoals,
}: GeneralTabProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden self-start">
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <span className="w-1.5 h-5 bg-primary rounded-full" />
                        Lead Statuses
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/80">Configure possible lead stages.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        {statuses.map((status, index) => (
                            <div key={index} className="flex items-center gap-2 group bg-white/5 p-2 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex-1 space-y-1">
                                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Label</Label>
                                    <Input
                                        value={status.label}
                                        onChange={(e) => onStatusChange(index, 'label', e.target.value)}
                                        placeholder="Label"
                                        className="h-9 rounded-xl border-white/10 bg-black/20"
                                    />
                                </div>
                                <div className="w-20 space-y-1">
                                    <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Color</Label>
                                    <div className="relative h-9 rounded-xl border border-white/10 overflow-hidden" style={{ backgroundColor: status.color || '#8b5cf6' }}>
                                        <Input
                                            type="color"
                                            value={status.color}
                                            onChange={(e) => onStatusChange(index, 'color', e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => onRemoveStatus(index)} className="h-9 w-9 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity mt-5">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button onClick={onAddStatus} variant="outline" size="sm" className="rounded-xl border-white/10 hover:bg-primary/10 hover:text-primary transition-colors">
                        Add New Status
                    </Button>
                    <div className="pt-6 border-t border-white/5">
                        <Button onClick={onSaveSettings} className="rounded-xl bg-primary hover:bg-primary/80 px-8 shadow-lg shadow-primary/20">Save Status Changes</Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden self-start">
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <span className="w-1.5 h-5 bg-blue-500 rounded-full" />
                        Lead Sources
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/80">Where your leads come from.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        {sources.map((source, index) => (
                            <div key={index} className="flex items-center gap-2 group bg-white/5 p-2 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex-1">
                                    <Input
                                        value={source.label}
                                        onChange={(e) => {
                                            const newSources = [...sources];
                                            newSources[index] = { ...source, label: e.target.value, key: e.target.value.toLowerCase().replace(/\s/g, '_') };
                                            onSourcesChange(newSources);
                                        }}
                                        className="h-9 rounded-xl border-white/10 bg-black/20"
                                    />
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => {
                                    const newSources = [...sources];
                                    newSources.splice(index, 1);
                                    onSourcesChange(newSources);
                                }} className="h-9 w-9 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button onClick={() => onSourcesChange([...sources, { key: `source_${Date.now()}`, label: "New Source" }])} variant="outline" size="sm" className="rounded-xl border-white/10 hover:bg-blue-500/10 hover:text-blue-500 transition-colors">
                        Add New Source
                    </Button>
                    <div className="pt-6 border-t border-white/5">
                        <Button onClick={onSaveSettings} className="rounded-xl bg-blue-500 hover:bg-blue-600 px-8 shadow-lg shadow-blue-500/20">Save Source Changes</Button>
                    </div>
                </CardContent>
            </Card>

            {/* Goals */}
            <Card className="md:col-span-2 rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Target className="h-5 w-5 text-amber-500" />
                        Monthly Goals
                    </CardTitle>
                    <CardDescription className="text-muted-foreground/80">Set targets for the Reports &quot;Goal vs Actual&quot; chart.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-xs ml-1">Monthly Lead Target</Label>
                            <Input type="number" value={goals.monthlyLeadTarget} onChange={(e) => onGoalsChange({ ...goals, monthlyLeadTarget: Number(e.target.value) })} className="rounded-xl border-white/10 bg-black/20" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs ml-1">Monthly Conversion Target</Label>
                            <Input type="number" value={goals.monthlyConversionTarget} onChange={(e) => onGoalsChange({ ...goals, monthlyConversionTarget: Number(e.target.value) })} className="rounded-xl border-white/10 bg-black/20" />
                        </div>
                    </div>
                    <div className="pt-6">
                        <Button onClick={onSaveGoals} className="rounded-xl bg-amber-500 hover:bg-amber-600 px-8 shadow-lg shadow-amber-500/20">
                            <Save className="h-4 w-4 mr-2" />Save Goals
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
