"use client";

import React from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export const LeadTrendsChart = React.memo(function LeadTrendsChart({ data }: { data: any[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground italic bg-white/5 rounded-2xl border border-dashed border-white/10">
                No trend data available yet
            </div>
        );
    }

    return (
        <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                            <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.1} />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 12 }}
                        allowDecimals={false}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "rgba(0,0,0,0.85)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                            backdropFilter: "blur(12px)",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                        }}
                        labelStyle={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}
                        itemStyle={{ color: "#8b5cf6" }}
                    />
                    <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#8b5cf6"
                        strokeWidth={2.5}
                        fill="url(#leadGradient)"
                        dot={{ r: 4, fill: "#8b5cf6", stroke: "#09090b", strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: "#8b5cf6", stroke: "white", strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
});
