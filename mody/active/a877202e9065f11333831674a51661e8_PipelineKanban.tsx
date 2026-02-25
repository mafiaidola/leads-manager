«=/**
 * Pipeline Kanban Board Component
 * 
 * Drag-and-drop Kanban view for leads pipeline.
 */

"use client";

import { usePipelineStages } from "@/hooks/leads";
import { useLeads, useUpdateLead, Lead } from "@/hooks/leads";
import { LeadTemperatureIndicator } from "./LeadTemperatureIndicator";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks";
import { useUIStore } from "@/store";

export function PipelineKanban() {
    const router = useRouter();
    const { data: stagesData, isLoading: stagesLoading } = usePipelineStages();
    const { data: leadsData, isLoading: leadsLoading } = useLeads({ limit: 100 });
    const updateLead = useUpdateLead();
    const { t, isRtl } = useTranslation();
    const language = useUIStore((state) => state.language);

    const stages = stagesData?.data || [];
    const leads = leadsData?.data || [];

    const isLoading = stagesLoading || leadsLoading;

    const getLeadsByStage = (stageId: string) => {
        return leads.filter((lead) => lead.pipeline_stage_id === stageId);
    };

    // Get localized stage name
    const getStageName = (stage: { name: string; name_ar?: string | null }) => {
        return language === 'ar' && stage.name_ar ? stage.name_ar : stage.name;
    };

    // Get localized source label
    const getSourceLabel = (sourceType: string) => {
        const sourceKey = `leads.source.${sourceType}`;
        const translated = t(sourceKey);
        // If translation key doesn't exist, show source type
        return translated !== sourceKey ? translated : sourceType;
    };

    const handleLeadClick = (leadId: string) => {
        router.push(`/dashboard/leads/${leadId}`);
    };

    const handleDragStart = (e: React.DragEvent, leadId: string) => {
        e.dataTransfer.setData("leadId", leadId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, stageId: string) => {
        e.preventDefault();
        const leadId = e.dataTransfer.getData("leadId");
        if (leadId) {
            updateLead.mutate({
                id: leadId,
                data: { pipeline_stage_id: stageId },
            });
        }
    };

    if (isLoading) {
        return <PipelineKanbanSkeleton />;
    }

    return (
        <div className="h-full p-6 overflow-x-auto">
            <div className={`flex gap-4 min-w-max h-full ${isRtl ? 'flex-row-reverse' : ''}`}>
                {stages.map((stage) => {
                    const stageLeads = getLeadsByStage(stage.id);
                    return (
                        <div
                            key={stage.id}
                            className="w-72 flex flex-col bg-muted/30 rounded-lg"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, stage.id)}
                        >
                            {/* Column Header */}
                            <div
                                className="p-3 border-b-2 rounded-t-lg"
                                style={{ borderColor: stage.color }}
                            >
                                <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: stage.color }}
                                        />
                                        <span className="font-medium">{getStageName(stage)}</span>
                                    </div>
                                    <span className="text-sm text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                                        {stageLeads.length}
                                    </span>
                                </div>
                            </div>

                            {/* Cards */}
                            <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                                {stageLeads.map((lead) => (
                                    <div
                                        key={lead.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, lead.id)}
                                        onClick={() => handleLeadClick(lead.id)}
                                        className="p-3 bg-background rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                                    >
                                        <div className={`flex items-start justify-between mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                            <span className="font-medium truncate">
                                                {lead.name || t("common.noName")}
                                            </span>
                                            <LeadTemperatureIndicator
                                                temperature={lead.temperature}
                                                showLabel={false}
                                            />
                                        </div>
                                        <div className={`text-sm text-muted-foreground truncate ${isRtl ? 'text-right' : ''}`}>
                                            {lead.email || lead.phone || t("common.noContact")}
                                        </div>
                                        {lead.source_type && (
                                            <div className={`flex items-center gap-1 mt-2 text-xs text-muted-foreground ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                {lead.source_type === "funnel" && "üöÄ"}
                                                {lead.source_type === "popup" && "üìã"}
                                                {lead.source_type === "form" && "üìù"}
                                                {lead.source_type === "manual" && "‚úèÔ∏è"}
                                                <span>{lead.source_name || getSourceLabel(lead.source_type)}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {stageLeads.length === 0 && (
                                    <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                                        {t("leads.pipeline.dropHere")}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


function PipelineKanbanSkeleton() {
    return (
        <div className="h-full p-6 overflow-x-auto">
            <div className="flex gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-72 bg-muted/30 rounded-lg">
                        <div className="p-3 border-b">
                            <Skeleton className="h-6 w-24" />
                        </div>
                        <div className="p-2 space-y-2">
                            {[1, 2, 3].map((j) => (
                                <Skeleton key={j} className="h-20 w-full rounded-lg" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
«="(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72õfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/components/leads/PipelineKanban.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version