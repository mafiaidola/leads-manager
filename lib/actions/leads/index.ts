// Barrel re-export — backward-compatible with `import { ... } from "@/lib/actions/leads"`
export {
    checkDuplicatePhone,
    checkDuplicateLead,
    getLeadsByStatus,
    getLeadTimeline,
    getLeads,
    getLeadsStats,
    searchLeads,
    getLeadDetails,
} from "./queries";

export {
    createLead,
    updateLead,
    updateLeadStatus,
    deleteLead,
    toggleStarLead,
    transferLead,
} from "./mutations";

export {
    bulkUpdateStatus,
    bulkAssign,
    bulkSoftDelete,
    restoreLead,
    permanentDeleteLead,
} from "./bulk";

export {
    addNote,
    addLeadAction,
} from "./notes";
