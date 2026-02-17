"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, User, GripVertical, Building, Mail, Phone } from "lucide-react";
import { updateLeadStatus } from "@/lib/actions/leads";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
    leads: Record<string, any[]>;
    statuses: { key: string; label: string; color: string }[];
    currentUserId?: string;
    onLeadClick: (leadId: string) => void;
}

export function KanbanBoard({ leads, statuses, currentUserId, onLeadClick }: KanbanBoardProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [draggedLead, setDraggedLead] = useState<any>(null);
    const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
    const dragCounter = useRef(0);

    const handleDragStart = (e: React.DragEvent, lead: any, fromStatus: string) => {
        setDraggedLead({ ...lead, fromStatus });
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", lead._id);
    };

    const handleDragEnter = (e: React.DragEvent, status: string) => {
        e.preventDefault();
        dragCounter.current++;
        setDragOverStatus(status);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current--;
        if (dragCounter.current === 0) {
            setDragOverStatus(null);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e: React.DragEvent, toStatus: string) => {
        e.preventDefault();
        dragCounter.current = 0;
        setDragOverStatus(null);

        if (!draggedLead || draggedLead.fromStatus === toStatus) {
            setDraggedLead(null);
            return;
        }

        const result = await updateLeadStatus(draggedLead._id, toStatus);
        if (result?.success) {
            toast({
                title: "Status Updated",
                description: `${draggedLead.name} moved to ${statuses.find(s => s.key === toStatus)?.label || toStatus}`,
            });
            router.refresh();
        } else {
            toast({
                title: "Error",
                description: result?.message || "Failed to update status",
                variant: "destructive",
            });
        }
        setDraggedLead(null);
    };

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
            {statuses.map((status) => {
                const statusLeads = leads[status.key] || [];
                const isDragOver = dragOverStatus === status.key;

                return (
                    <div
                        key={status.key}
                        className={cn(
                            "flex-shrink-0 w-[300px] rounded-2xl border border-white/10 bg-card/30 backdrop-blur-xl transition-all",
                            isDragOver && "border-primary/50 bg-primary/5 scale-[1.01] shadow-lg shadow-primary/10"
                        )}
                        onDragEnter={(e) => handleDragEnter(e, status.key)}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, status.key)}
                    >
                        {/* Column Header */}
                        <div className="p-4 border-b border-white/10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span
                                        className="w-3 h-3 rounded-full status-dot"
                                        style={{ '--status-color': status.color } as React.CSSProperties}
                                    />
                                    <h3 className="font-semibold text-sm">{status.label}</h3>
                                </div>
                                <Badge variant="secondary" className="rounded-full text-xs px-2 py-0.5 bg-white/10">
                                    {statusLeads.length}
                                </Badge>
                            </div>
                        </div>

                        {/* Cards */}
                        <div className="p-3 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                            {statusLeads.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground text-xs">
                                    No leads
                                </div>
                            )}
                            {statusLeads.map((lead) => {
                                const isStarred = currentUserId && lead.starred?.includes(currentUserId);
                                return (
                                    <div
                                        key={lead._id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, lead, status.key)}
                                        onClick={() => onLeadClick(lead._id)}
                                        className={cn(
                                            "group rounded-xl border border-white/5 bg-card/60 backdrop-blur-sm p-3.5 cursor-grab active:cursor-grabbing",
                                            "hover:border-white/20 hover:bg-card/80 hover:shadow-md transition-all",
                                            draggedLead?._id === lead._id && "opacity-40"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <span className="font-medium text-sm truncate">{lead.name}</span>
                                            </div>
                                            {isStarred && (
                                                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                                            )}
                                        </div>

                                        {lead.company && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                                                <Building className="h-3 w-3" />
                                                <span className="truncate">{lead.company}</span>
                                            </div>
                                        )}

                                        {lead.email && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                                                <Mail className="h-3 w-3" />
                                                <span className="truncate">{lead.email}</span>
                                            </div>
                                        )}

                                        {lead.phone && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                                                <Phone className="h-3 w-3" />
                                                <span>{lead.phone}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                                            <div className="flex items-center gap-1.5">
                                                {lead.assignedTo && (
                                                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-white/10 rounded-lg">
                                                        <User className="h-2.5 w-2.5 mr-0.5" />
                                                        {lead.assignedTo.name}
                                                    </Badge>
                                                )}
                                            </div>
                                            {lead.value && (
                                                <span className="text-xs font-mono text-emerald-400">
                                                    ${Number(lead.value).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
