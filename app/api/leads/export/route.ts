import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Lead from "@/models/Lead";
import { USER_ROLES } from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Document, Packer, Table, TableRow, TableCell, Paragraph, TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle } from "docx";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        await dbConnect();

        const searchParams = req.nextUrl.searchParams;
        const format = searchParams.get("format") || "csv"; // csv | excel | word
        const query: any = { deletedAt: null };

        if (searchParams.get("status")) query.status = searchParams.get("status");
        if (searchParams.get("source")) query.source = searchParams.get("source");
        if (searchParams.get("assignedTo")) query.assignedTo = searchParams.get("assignedTo");
        if (searchParams.get("search")) {
            query.$text = { $search: searchParams.get("search") };
        }

        const leads = await Lead.find(query)
            .populate("assignedTo", "name email")
            .populate("createdBy", "name")
            .lean();

        // Common data mapping
        const rows = leads.map((lead: any) => ({
            "#": lead.serialNumber || "",
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
            Country: lead.address?.country || "",
            "Assigned To": lead.assignedTo?.name || "Unassigned",
            "Created By": lead.createdBy?.name || "System",
            Created: lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "",
            Updated: lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString() : "",
        }));

        const dateStr = new Date().toISOString().split("T")[0];

        // ─── CSV ───
        if (format === "csv") {
            const csvString = Papa.unparse(rows);
            return new NextResponse(csvString, {
                headers: {
                    "Content-Type": "text/csv",
                    "Content-Disposition": `attachment; filename="leads-export-${dateStr}.csv"`,
                },
            });
        }

        // ─── EXCEL (XLSX) ───
        if (format === "excel") {
            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Leads");

            // Auto-size columns
            const colWidths = Object.keys(rows[0] || {}).map((key) => ({
                wch: Math.max(key.length, ...rows.map((r: any) => String(r[key] || "").length)).valueOf(),
            }));
            ws["!cols"] = colWidths;

            const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
            return new NextResponse(buf, {
                headers: {
                    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    "Content-Disposition": `attachment; filename="leads-export-${dateStr}.xlsx"`,
                },
            });
        }

        // ─── WORD (DOCX) ───
        if (format === "word") {
            const headers = Object.keys(rows[0] || {});

            const headerRow = new TableRow({
                tableHeader: true,
                children: headers.map(
                    (h) =>
                        new TableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 18, font: "Arial" })] })],
                            shading: { fill: "1a73e8", color: "ffffff" },
                            width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
                        })
                ),
            });

            const dataRows = rows.map(
                (row: any) =>
                    new TableRow({
                        children: headers.map(
                            (h) =>
                                new TableCell({
                                    children: [new Paragraph({ children: [new TextRun({ text: String(row[h] || ""), size: 18, font: "Arial" })] })],
                                    width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
                                })
                        ),
                    })
            );

            const table = new Table({
                rows: [headerRow, ...dataRows],
                width: { size: 100, type: WidthType.PERCENTAGE },
            });

            const doc = new Document({
                sections: [
                    {
                        children: [
                            new Paragraph({
                                text: `Leads Manager — Export (${dateStr})`,
                                heading: HeadingLevel.HEADING_1,
                                alignment: AlignmentType.CENTER,
                                spacing: { after: 300 },
                            }),
                            new Paragraph({
                                text: `Total: ${rows.length} leads`,
                                spacing: { after: 200 },
                            }),
                            table,
                        ],
                    },
                ],
            });

            const buffer = await Packer.toBuffer(doc);
            return new NextResponse(new Uint8Array(buffer), {
                headers: {
                    "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "Content-Disposition": `attachment; filename="leads-export-${dateStr}.docx"`,
                },
            });
        }

        return NextResponse.json({ error: "Invalid format. Use csv, excel, or word." }, { status: 400 });
    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json({ error: "Failed to export leads" }, { status: 500 });
    }
}
