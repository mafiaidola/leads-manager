"use client";

import React from "react";
import { DollarSign } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LeadDealCardProps {
    lead: any;
    formatDate: (dateStr: string) => string;
}

export const LeadDealCard = React.memo(function LeadDealCard({ lead, formatDate }: LeadDealCardProps) {
    return (
        <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Deal Details
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {(lead.value !== undefined && lead.value !== null) && (
                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/5">
                        <span className="text-xs text-muted-foreground">Value</span>
                        <span className="text-sm font-bold text-emerald-400">{lead.currency} {Number(lead.value).toLocaleString()}</span>
                    </div>
                )}
                {lead.source && (
                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/5">
                        <span className="text-xs text-muted-foreground">Source</span>
                        <Badge variant="outline" className="rounded-full text-xs border-white/10">{lead.source}</Badge>
                    </div>
                )}
                {lead.product && (
                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/5">
                        <span className="text-xs text-muted-foreground">Product</span>
                        <span className="text-sm font-medium">{lead.product}</span>
                    </div>
                )}
                {lead.lastContactAt && (
                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/5">
                        <span className="text-xs text-muted-foreground">Last Contact</span>
                        <span className="text-sm font-medium">{formatDate(lead.lastContactAt)}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
});
