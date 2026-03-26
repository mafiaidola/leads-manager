/**
 * @component UnsavedChangesBar
 * @description Fixed top bar that appears when settings have unsaved changes.
 * Shows a warning with a save button, plus optional discard.
 */
"use client";

import { AlertTriangle, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UnsavedChangesBarProps {
    hasChanges: boolean;
    onSave: () => void;
    onDiscard: () => void;
    saving?: boolean;
}

export function UnsavedChangesBar({ hasChanges, onSave, onDiscard, saving }: UnsavedChangesBarProps) {
    if (!hasChanges) return null;

    return (
        <div className="sticky top-0 z-40 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-xl shadow-lg shadow-amber-500/5">
                <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-amber-300">Unsaved Changes</p>
                        <p className="text-[11px] text-muted-foreground">
                            You have modified settings that haven&apos;t been saved yet.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDiscard}
                        className="rounded-xl text-xs text-muted-foreground hover:text-foreground h-8"
                    >
                        <X className="h-3 w-3 mr-1" />
                        Discard
                    </Button>
                    <Button
                        size="sm"
                        onClick={onSave}
                        disabled={saving}
                        className="rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold h-8 px-4 text-xs shadow-lg shadow-amber-500/20"
                    >
                        <Save className="h-3 w-3 mr-1" />
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
