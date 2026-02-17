"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, FileSpreadsheet, Loader2 } from "lucide-react";
import { previewCSVImport, importLeadsWithMapping } from "@/lib/actions/import";
import { LEAD_FIELD_OPTIONS } from "@/lib/constants/leadFields";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface ImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type Step = "upload" | "mapping" | "preview" | "result";

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
    const { toast } = useToast();
    const router = useRouter();
    const fileRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState<Step>("upload");
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [preview, setPreview] = useState<any[]>([]);
    const [totalRows, setTotalRows] = useState(0);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const reset = () => {
        setStep("upload");
        setFile(null);
        setHeaders([]);
        setPreview([]);
        setTotalRows(0);
        setMapping({});
        setResult(null);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        setLoading(true);

        const formData = new FormData();
        formData.append("file", f);
        const res = await previewCSVImport(formData);

        if (res.error) {
            toast({ title: "Error", description: res.error, variant: "destructive" });
            setLoading(false);
            return;
        }

        setHeaders(res.headers || []);
        setPreview(res.preview || []);
        setTotalRows(res.totalRows || 0);

        // Auto-map: try matching CSV headers to lead fields
        const autoMap: Record<string, string> = {};
        for (const h of res.headers || []) {
            const lower = h.toLowerCase().replace(/[\s_-]/g, "");
            const match = LEAD_FIELD_OPTIONS.find((f) => {
                const fLower = f.value.toLowerCase();
                const fLabel = f.label.toLowerCase().replace(/[\s_-]/g, "");
                return lower === fLower || lower === fLabel || lower.includes(fLower);
            });
            if (match) autoMap[h] = match.value;
        }
        setMapping(autoMap);
        setLoading(false);
        setStep("mapping");
    };

    const handleImport = async () => {
        if (!file) return;
        setLoading(true);

        const formData = new FormData();
        formData.append("file", file);
        const res = await importLeadsWithMapping(formData, mapping);

        setResult(res);
        setLoading(false);
        setStep("result");

        if (res.success) {
            router.refresh();
        }
    };

    // Get mapped preview data
    const mappedPreview = preview.map((row) => {
        const mapped: any = {};
        for (const [csvCol, leadField] of Object.entries(mapping)) {
            if (leadField) mapped[leadField] = row[csvCol];
        }
        return mapped;
    });

    const mappedFields = Object.values(mapping).filter(Boolean);
    const hasNameMapping = mappedFields.includes("name");

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border-white/10 bg-card/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                        Import Leads from CSV
                    </DialogTitle>
                    <DialogDescription>
                        {step === "upload" && "Upload a CSV file to get started."}
                        {step === "mapping" && "Map your CSV columns to lead fields."}
                        {step === "preview" && "Review mapped data before importing."}
                        {step === "result" && "Import complete."}
                    </DialogDescription>
                </DialogHeader>

                {/* Step Indicator */}
                <div className="flex items-center gap-2 text-xs mb-4">
                    {(["upload", "mapping", "preview", "result"] as Step[]).map((s, i) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === s ? "bg-primary text-white" :
                                (["upload", "mapping", "preview", "result"].indexOf(step) > i)
                                    ? "bg-emerald-500 text-white" : "bg-white/10 text-muted-foreground"
                                }`}>
                                {["upload", "mapping", "preview", "result"].indexOf(step) > i ? "✓" : i + 1}
                            </div>
                            {i < 3 && <div className="w-8 h-0.5 bg-white/10" />}
                        </div>
                    ))}
                </div>

                {/* Step 1: Upload */}
                {step === "upload" && (
                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-white/10 rounded-2xl">
                        <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-sm text-muted-foreground mb-4">Drop a CSV file here or click to browse</p>
                        <Button onClick={() => fileRef.current?.click()} className="rounded-xl">
                            Choose CSV File
                        </Button>
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".csv"
                            className="hidden"
                            aria-label="Choose CSV file to import"
                            onChange={handleFileUpload}
                        />
                        {loading && <Loader2 className="h-5 w-5 animate-spin mt-4 text-primary" />}
                    </div>
                )}

                {/* Step 2: Column Mapping */}
                {step === "mapping" && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                <strong>{totalRows}</strong> rows found in <strong>{file?.name}</strong>
                            </p>
                            {!hasNameMapping && (
                                <Badge variant="destructive" className="rounded-lg">
                                    <AlertTriangle className="h-3 w-3 mr-1" /> Name mapping required
                                </Badge>
                            )}
                        </div>

                        <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                            {headers.map((h) => (
                                <div key={h} className="flex items-center gap-3">
                                    <div className="w-40 truncate text-sm font-mono bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                                        {h}
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <Select
                                        value={mapping[h] || "__skip__"}
                                        onValueChange={(v) => setMapping({ ...mapping, [h]: v === "__skip__" ? "" : v })}
                                    >
                                        <SelectTrigger className="rounded-xl border-white/10 bg-white/5">
                                            <SelectValue placeholder="Skip this column" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                            <SelectItem value="__skip__" className="text-muted-foreground">Skip this column</SelectItem>
                                            {LEAD_FIELD_OPTIONS.map((f) => (
                                                <SelectItem key={f.value} value={f.value}>
                                                    {f.label} {"required" in f && f.required ? "*" : ""}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Preview */}
                {step === "preview" && (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Preview of first {mappedPreview.length} rows after mapping:
                        </p>
                        <div className="overflow-x-auto rounded-xl border border-white/10">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/10">
                                        {mappedFields.map((f) => (
                                            <TableHead key={f} className="text-xs whitespace-nowrap">
                                                {LEAD_FIELD_OPTIONS.find((o) => o.value === f)?.label || f}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mappedPreview.map((row, i) => (
                                        <TableRow key={i} className="border-white/5">
                                            {mappedFields.map((f) => (
                                                <TableCell key={f} className="text-xs truncate max-w-[150px]">
                                                    {row[f] || "—"}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total: <strong>{totalRows}</strong> rows will be processed. Duplicates (matching email or phone) will be skipped.
                        </p>
                    </div>
                )}

                {/* Step 4: Result */}
                {step === "result" && result && (
                    <div className="text-center py-8 space-y-4">
                        {result.success ? (
                            <>
                                <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
                                <h3 className="text-xl font-bold">Import Complete!</h3>
                                <div className="flex justify-center gap-6 text-sm">
                                    <div>
                                        <div className="text-2xl font-bold text-emerald-400">{result.importedCount}</div>
                                        <div className="text-muted-foreground">Imported</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-amber-400">{result.skippedCount}</div>
                                        <div className="text-muted-foreground">Skipped</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-red-400">{result.duplicateCount}</div>
                                        <div className="text-muted-foreground">Duplicates</div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" />
                                <h3 className="text-xl font-bold">Import Failed</h3>
                                <p className="text-muted-foreground">{result.message}</p>
                            </>
                        )}
                    </div>
                )}

                {/* Footer Navigation */}
                <DialogFooter className="gap-2">
                    {step === "mapping" && (
                        <>
                            <Button variant="outline" onClick={() => { reset(); }} className="rounded-xl border-white/10">
                                <ArrowLeft className="h-4 w-4 mr-1" /> Back
                            </Button>
                            <Button
                                onClick={() => setStep("preview")}
                                disabled={!hasNameMapping}
                                className="rounded-xl"
                            >
                                Preview <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </>
                    )}
                    {step === "preview" && (
                        <>
                            <Button variant="outline" onClick={() => setStep("mapping")} className="rounded-xl border-white/10">
                                <ArrowLeft className="h-4 w-4 mr-1" /> Back
                            </Button>
                            <Button onClick={handleImport} disabled={loading} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                                Import {totalRows} Leads
                            </Button>
                        </>
                    )}
                    {step === "result" && (
                        <Button onClick={() => { reset(); onOpenChange(false); }} className="rounded-xl">
                            Done
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
