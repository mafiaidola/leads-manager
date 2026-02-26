"use client";

import React from "react";
import { Phone, Mail, Globe, MapPin, MessageSquare, ExternalLink, Bell } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPhoneDisplay } from "@/lib/constants/countryCodes";

interface LeadContactCardProps {
    lead: any;
}

export const LeadContactCard = React.memo(function LeadContactCard({ lead }: LeadContactCardProps) {
    return (
        <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Hash className="h-4 w-4 text-primary" />
                    Contact Information
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {lead.phone && (
                    <a href={`tel:${lead.phone}`} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center"><Phone className="h-4 w-4 text-emerald-400" /></div>
                        <div>
                            <div className="text-xs text-muted-foreground">Phone</div>
                            <div className="text-sm font-medium group-hover:text-primary transition-colors">{formatPhoneDisplay(lead.phone)}</div>
                        </div>
                        <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                )}
                {lead.email && (
                    <a href={`mailto:${lead.email}`} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/15 flex items-center justify-center"><Mail className="h-4 w-4 text-blue-400" /></div>
                        <div>
                            <div className="text-xs text-muted-foreground">Email</div>
                            <div className="text-sm font-medium group-hover:text-primary transition-colors">{lead.email}</div>
                        </div>
                        <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                )}
                {lead.website && (
                    <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                        <div className="h-8 w-8 rounded-lg bg-purple-500/15 flex items-center justify-center"><Globe className="h-4 w-4 text-purple-400" /></div>
                        <div>
                            <div className="text-xs text-muted-foreground">Website</div>
                            <div className="text-sm font-medium group-hover:text-primary transition-colors truncate max-w-[180px]">{lead.website}</div>
                        </div>
                        <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                )}
                {lead.phone && (
                    <a href={`https://wa.me/${lead.phone}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                        <div className="h-8 w-8 rounded-lg bg-green-500/15 flex items-center justify-center"><MessageSquare className="h-4 w-4 text-green-400" /></div>
                        <div>
                            <div className="text-xs text-muted-foreground">WhatsApp</div>
                            <div className="text-sm font-medium group-hover:text-primary transition-colors">Send Message</div>
                        </div>
                        <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                )}
                {(lead.address?.city || lead.address?.country) && (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5">
                        <div className="h-8 w-8 rounded-lg bg-amber-500/15 flex items-center justify-center"><MapPin className="h-4 w-4 text-amber-400" /></div>
                        <div>
                            <div className="text-xs text-muted-foreground">Location</div>
                            <div className="text-sm font-medium">
                                {[lead.address?.addressLine, lead.address?.city, lead.address?.state, lead.address?.country].filter(Boolean).join(", ")}
                            </div>
                        </div>
                    </div>
                )}
                {lead.followUpDate && (() => {
                    const fDate = new Date(lead.followUpDate);
                    const isOverdue = fDate <= new Date();
                    return (
                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5">
                            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", isOverdue ? "bg-red-500/15" : "bg-amber-500/15")}>
                                <Bell className={cn("h-4 w-4", isOverdue ? "text-red-400" : "text-amber-400")} />
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground">Follow-up Date</div>
                                <div className={cn("text-sm font-medium flex items-center gap-1.5", isOverdue ? "text-red-400" : "text-amber-400")}>
                                    {fDate.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                                    {isOverdue && <span className="text-[10px] bg-red-500/20 px-1.5 py-0.5 rounded-full font-semibold">OVERDUE</span>}
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </CardContent>
        </Card>
    );
});
