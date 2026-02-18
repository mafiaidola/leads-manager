"use client";

import Link from "next/link";
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
                <div className="space-y-2">
                    {leads.map((lead) => (
                        <Link
                            key={lead._id}
                            href={`/leads/${lead._id}`}
                            className="flex items-center group px-3 py-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <Avatar className="h-10 w-10 border-2 border-primary/20 group-hover:border-primary/50 transition-colors">
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                    {lead.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="ml-4 space-y-0.5 flex-1 min-w-0">
                                <p className="text-sm font-bold leading-none group-hover:text-primary transition-colors">{lead.name}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-muted-foreground truncate">
                                        {lead.phone || lead.email || "No contact"}
                                    </span>
                                    {lead.phone && <span className="inline-block w-1 h-1 rounded-full bg-green-500 animate-pulse shrink-0" />}
                                </div>
                            </div>
                            <div className="ml-auto flex flex-col items-end gap-1 shrink-0">
                                <span className="text-[10px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                    {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                    {lead.status}
                                </span>
                            </div>
                        </Link>
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
