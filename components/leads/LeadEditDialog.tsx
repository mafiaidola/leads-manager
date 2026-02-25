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
    company: string;
    email: string;
    phone: string;
    source: string;
    product: string;
    value: string;
    description: string;
    tags: string;
}

interface LeadEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editForm: EditFormState;
    setEditForm: React.Dispatch<React.SetStateAction<EditFormState>>;
    sources: string[];
    onSave: () => void;
    isPending: boolean;
}

export const LeadEditDialog = React.memo(function LeadEditDialog({
    open,
    onOpenChange,
    editForm,
    setEditForm,
    sources,
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
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Name *</Label>
                            <Input value={editForm.name} onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))} className="rounded-xl border-white/10 bg-black/20" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Company</Label>
                            <Input value={editForm.company} onChange={e => setEditForm(prev => ({ ...prev, company: e.target.value }))} className="rounded-xl border-white/10 bg-black/20" />
                        </div>
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
                            <Input value={editForm.product} onChange={e => setEditForm(prev => ({ ...prev, product: e.target.value }))} className="rounded-xl border-white/10 bg-black/20" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Value</Label>
                            <Input type="number" value={editForm.value} onChange={e => setEditForm(prev => ({ ...prev, value: e.target.value }))} className="rounded-xl border-white/10 bg-black/20" placeholder="0" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Tags (comma separated)</Label>
                            <Input value={editForm.tags} onChange={e => setEditForm(prev => ({ ...prev, tags: e.target.value }))} className="rounded-xl border-white/10 bg-black/20" placeholder="tag1, tag2" />
                        </div>
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
