"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

export function RecentLeads({ leads }: { leads: any[] }) {
    return (
        <Card className="col-span-1 lg:col-span-3 rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden self-start">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-primary rounded-full" />
                    Recent Leads
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {leads.map((lead) => (
                        <div key={lead._id} className="flex items-center group">
                            <Avatar className="h-10 w-10 border-2 border-primary/20 group-hover:border-primary/50 transition-colors">
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                    {lead.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-0.5">
                                <p className="text-sm font-bold leading-none">{lead.name}</p>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={`https://wa.me/${lead.phone?.replace(/[^0-9]/g, "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[11px] text-muted-foreground hover:text-green-500 transition-colors flex items-center gap-1 bg-white/5 py-0.5 px-1.5 rounded-md border border-white/5"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {lead.phone || "No phone"}
                                        {lead.phone && <span className="inline-block w-1 h-1 rounded-full bg-green-500 animate-pulse" />}
                                    </a>
                                </div>
                            </div>
                            <div className="ml-auto flex flex-col items-end gap-1">
                                <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                    {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                                </span>
                            </div>
                        </div>
                    ))}
                    {leads.length === 0 && (
                        <div className="text-center text-muted-foreground py-8 italic bg-white/5 rounded-2xl border border-dashed border-white/10">
                            No recent leads found
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
