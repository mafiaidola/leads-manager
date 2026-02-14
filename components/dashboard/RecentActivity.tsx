"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

export function RecentActivity({ activities }: { activities: any[] }) {
    return (
        <Card className="col-span-1 lg:col-span-3 rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden self-start">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-violet-500 rounded-full" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-6">
                        {activities.map((activity) => (
                            <div key={activity._id} className="flex gap-4 group">
                                <Avatar className="h-10 w-10 mt-0.5 border-2 border-white/10 group-hover:border-violet-500/30 transition-colors">
                                    <AvatarFallback className="bg-muted/30 text-muted-foreground text-[10px] font-bold">
                                        {(activity.authorId?.name || "SYS").slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1 bg-white/5 p-3 rounded-2xl border border-white/5 flex-1 group-hover:bg-white/10 transition-colors">
                                    <p className="text-sm">
                                        <span className="text-primary font-bold">{activity.authorId?.name || "System"}</span>
                                        <span className="text-muted-foreground">
                                            {" "}
                                            {activity.type === "STATUS_CHANGE"
                                                ? "changed status of"
                                                : activity.type === "COMMENT"
                                                    ? "commented on"
                                                    : "updated"}{" "}
                                        </span>
                                        <span className="font-bold text-foreground">{activity.leadId?.name || "Unknown Lead"}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground/80 line-clamp-2 italic">
                                        "{activity.message}"
                                    </p>
                                    <div className="flex justify-end pt-2">
                                        <span className="text-[10px] text-muted-foreground bg-black/20 px-2 py-0.5 rounded-full border border-white/5">
                                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {activities.length === 0 && (
                            <div className="text-center text-muted-foreground py-8 italic bg-white/5 rounded-2xl border border-dashed border-white/10">
                                No recent activity
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
