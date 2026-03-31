/**
 * @component LeadDealCard
 * @description Lead detail card showing deal/interest info — product,
 * expected value, assigned user, and status with inline edit support.
 */
"use client";

import React from "react";
import { DollarSign } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSourceIconComponent } from "@/lib/iconMap";

interface LeadDealCardProps {
    lead: any;
    formatDate: (dateStr: string) => string;
    sourceLabelMap?: Record<string, string>;
    sourceIconMap?: Record<string, string>;
    productLabelMap?: Record<string, string>;
}

export const LeadDealCard = React.memo(function LeadDealCard({ lead, formatDate, sourceLabelMap = {}, sourceIconMap = {}, productLabelMap = {} }: LeadDealCardProps) {
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
                        <Badge variant="outline" className="rounded-full text-xs border-white/10 flex items-center gap-1">
                            {(() => { const IC = sourceIconMap[lead.source] ? getSourceIconComponent(sourceIconMap[lead.source]) : null; return IC ? <IC className="h-3 w-3" /> : null; })()}
                            {sourceLabelMap[lead.source] || lead.source}
                        </Badge>
                    </div>
                )}
                {lead.product && (
                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-white/5">
                        <span className="text-xs text-muted-foreground">Product</span>
                        <span className="text-sm font-medium">{productLabelMap[lead.product] || lead.product}</span>
                    </div>
                )}
                {/* Pricing Breakdown */}
                {(lead.productPrice != null || lead.customPrice != null) && (
                    <div className="space-y-1.5 p-3 rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.02] dark:from-white/[0.04] dark:to-white/[0.02] border border-black/5 dark:border-white/5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Pricing</p>
                        {lead.productPrice != null && (
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Original Price</span>
                                <span className="text-sm font-mono text-emerald-500 dark:text-emerald-400">{lead.currency} {Number(lead.productPrice).toLocaleString()}</span>
                            </div>
                        )}
                        {lead.customPrice != null && (
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Your Price</span>
                                <span className="text-sm font-mono font-bold">{lead.currency} {Number(lead.customPrice).toLocaleString()}</span>
                            </div>
                        )}
                        {lead.productPrice != null && lead.customPrice != null && lead.productPrice > 0 && (() => {
                            const diff = Number(lead.customPrice) - Number(lead.productPrice);
                            const pct = ((diff / Number(lead.productPrice)) * 100).toFixed(1);
                            return diff !== 0 ? (
                                <div className="flex justify-between items-center pt-1.5 border-t border-black/5 dark:border-white/5">
                                    <span className="text-xs text-muted-foreground">Difference</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-mono font-bold ${diff > 0 ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                                            {diff > 0 ? "▲" : "▼"} {diff > 0 ? "+" : ""}{lead.currency} {Math.abs(diff).toLocaleString()}
                                        </span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${diff > 0 ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400" : "bg-red-500/10 text-red-500 dark:text-red-400"}`}>
                                            {diff > 0 ? "+" : ""}{pct}%
                                        </span>
                                    </div>
                                </div>
                            ) : null;
                        })()}
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
