/**
 * @component LeadEditDialog
 * @description Dialog for editing a lead's core fields inline from the detail page.
 * Pre-fills form with current values and submits via updateLead server action.
 */
"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface EditFormState {
    name: string;
    email: string;
    phone: string;
    source: string;
    product: string;
    value: string;
    description: string;
    customPrice: string;
}

interface LeadEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editForm: EditFormState;
    setEditForm: React.Dispatch<React.SetStateAction<EditFormState>>;
    sources: string[];
    products?: { key: string; label: string; price?: number }[];
    onSave: () => void;
    isPending: boolean;
}

export const LeadEditDialog = React.memo(function LeadEditDialog({
    open,
    onOpenChange,
    editForm,
    setEditForm,
    sources,
    products,
    onSave,
    isPending,
}: LeadEditDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-2xl border-white/10 bg-card/95 backdrop-blur-2xl max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Lead</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                    <div className="space-y-1.5">
                            <Label className="text-xs">Name *</Label>
                            <Input value={editForm.name} onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))} className="rounded-xl border-white/10 bg-black/20" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Phone</Label>
                            <Input value={editForm.phone} onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))} className="rounded-xl border-white/10 bg-black/20" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Email</Label>
                            <Input value={editForm.email} onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))} className="rounded-xl border-white/10 bg-black/20" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Source</Label>
                            <Select value={editForm.source || "__none"} onValueChange={v => setEditForm(prev => ({ ...prev, source: v === "__none" ? "" : v }))}>
                                <SelectTrigger className="rounded-xl border-white/10 bg-black/20"><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                    <SelectItem value="__none">None</SelectItem>
                                    {sources.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Product</Label>
                            <Select value={editForm.product || "__none"} onValueChange={v => setEditForm(prev => ({ ...prev, product: v === "__none" ? "" : v }))}>
                                <SelectTrigger className="rounded-xl border-white/10 bg-black/20"><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                    <SelectItem value="__none">None</SelectItem>
                                    {products?.map(p => <SelectItem key={p.key} value={p.key}>{p.label}{p.price ? ` — ${p.price.toLocaleString()}` : ""}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {/* ── Pricing Section ── */}
                    {(() => {
                        const selectedProd = products?.find(p => p.key === editForm.product);
                        const prodPrice = selectedProd?.price ?? 0;
                        const custPrice = parseFloat(editForm.customPrice) || 0;
                        const diff = custPrice - prodPrice;
                        const pct = prodPrice > 0 ? ((diff / prodPrice) * 100).toFixed(1) : "0";
                        return (
                            <div className="space-y-3 p-3 bg-black/5 dark:bg-white/[0.03] rounded-xl border border-black/5 dark:border-white/5">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pricing</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Original Price</Label>
                                        <div className="h-9 px-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/30 flex items-center font-mono text-sm text-emerald-600 dark:text-emerald-400">
                                            {prodPrice > 0 ? prodPrice.toLocaleString() : "—"}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] text-muted-foreground">Your Price</Label>
                                        <Input
                                            type="number" min="0" step="0.01"
                                            value={editForm.customPrice}
                                            onChange={e => setEditForm(prev => ({ ...prev, customPrice: e.target.value }))}
                                            className="rounded-xl border-black/10 dark:border-white/10 bg-white dark:bg-black/20 font-mono text-sm"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                {/* Difference display */}
                                {custPrice > 0 && prodPrice > 0 && (
                                    <div className={`flex items-center justify-between p-2 rounded-lg ${diff > 0 ? "bg-emerald-500/10" : diff < 0 ? "bg-red-500/10" : "bg-gray-500/10"}`}>
                                        <span className="text-xs text-muted-foreground">Difference</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-mono font-bold ${diff > 0 ? "text-emerald-600 dark:text-emerald-400" : diff < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                                                {diff > 0 ? "▲ +" : diff < 0 ? "▼ " : ""}{diff.toLocaleString()}
                                            </span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${diff > 0 ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : diff < 0 ? "bg-red-500/20 text-red-600 dark:text-red-400" : "bg-gray-500/20"}`}>
                                                {diff > 0 ? "+" : ""}{pct}%
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                    <div className="space-y-1.5">
                            <Label className="text-xs">Value</Label>
                            <Input type="number" value={editForm.value} onChange={e => setEditForm(prev => ({ ...prev, value: e.target.value }))} className="rounded-xl border-white/10 bg-black/20" placeholder="0" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs">Description</Label>
                        <Textarea value={editForm.description} onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))} className="rounded-xl border-white/10 bg-black/20 min-h-[80px] resize-none" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" className="rounded-xl" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button className="rounded-xl bg-primary" onClick={onSave} disabled={!editForm.name.trim() || isPending}>
                        {isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
});
