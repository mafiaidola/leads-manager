import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import { USER_ROLES } from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        await dbConnect();

        const searchParams = req.nextUrl.searchParams;
        const query: any = { deletedAt: null }; // Exclude soft-deleted leads

        if (searchParams.get("status")) query.status = searchParams.get("status");
        if (searchParams.get("source")) query.source = searchParams.get("source");
        if (searchParams.get("assignedTo")) query.assignedTo = searchParams.get("assignedTo");
        if (searchParams.get("search")) {
            query.$text = { $search: searchParams.get("search") };
        }

        // Fetch leads
        const leads = await Lead.find(query).populate("assignedTo", "name email").lean();

        // Map to CSV format
        const csvData = leads.map((lead: any) => ({
            ID: lead._id.toString(),
            Name: lead.name,
            Email: lead.email || "",
            Phone: lead.phone || "",
            Company: lead.company || "",
            Position: lead.position || "",
            Website: lead.website || "",
            Status: lead.status,
            Source: lead.source || "",
            Product: lead.product || "",
            Value: lead.value || "",
            Currency: lead.currency || "AED",
            Tags: lead.tags?.join(", ") || "",
            Description: lead.description || "",
            Address: lead.address?.addressLine || "",
            City: lead.address?.city || "",
            State: lead.address?.state || "",
            ZipCode: lead.address?.zipCode || "",
            Country: lead.address?.country || "",
            Language: lead.defaultLanguage || "",
            AssignedTo: lead.assignedTo?.name || "Unassigned",
            AssignedEmail: lead.assignedTo?.email || "",
            Starred: (lead.starred?.length || 0) > 0 ? "Yes" : "No",
            Created: lead.createdAt ? lead.createdAt.toISOString() : "",
            Updated: lead.updatedAt ? lead.updatedAt.toISOString() : "",
        }));

        const csvString = Papa.unparse(csvData);

        return new NextResponse(csvString, {
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="leads-export-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json({ error: "Failed to export leads" }, { status: 500 });
    }
}
