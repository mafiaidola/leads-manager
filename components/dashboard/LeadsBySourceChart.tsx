"use client";

import React from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#6366f1", "#14b8a6", "#f43f5e"];

export const LeadsBySourceChart = React.memo(function LeadsBySourceChart({ data }: { data: any[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground italic bg-white/5 rounded-2xl border border-dashed border-white/10">
                No source data available
            </div>
        );
    }

    return (
        <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <defs>
                        {COLORS.map((color, i) => (
                            <linearGradient key={i} id={`pieGrad-${i}`} x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                                <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                            </linearGradient>
                        ))}
                    </defs>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="count"
                        nameKey="source"
                        animationBegin={200}
                        animationDuration={800}
                    >
                        {data.map((_entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={`url(#pieGrad-${index % COLORS.length})`}
                                stroke="transparent"
                                strokeWidth={0}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: "rgba(0,0,0,0.85)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                            backdropFilter: "blur(12px)",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                        }}
                        labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                        itemStyle={{ color: "white" }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        formatter={(value: string) => (
                            <span className="text-xs text-muted-foreground capitalize">{value}</span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
});
