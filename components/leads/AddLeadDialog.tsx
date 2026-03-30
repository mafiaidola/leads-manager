/**
 * @component AddLeadDialog
 * @description Dialog form for creating a new lead.
 *
 * Features:
 * - Zod-validated form fields: name, email, phone (with country code), company,
 *   status, source, product, value, currency, follow-up date, notes, tags
 * - Real-time phone duplicate detection
 * - Admin-only: assignee selection dropdown
 * - Custom field rendering from org settings
 */
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createLead, checkDuplicatePhone } from "@/lib/actions/leads";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Ban } from "lucide-react";
import { PhoneInputWithCountry } from "@/components/ui/PhoneInputWithCountry";

const formSchema = z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().regex(/^\d*$/, "Phone number must contain only digits (no spaces, dashes or special characters)").optional(),
    countryCode: z.string().optional(),
    status: z.string().min(1, "Please select a status."),
    source: z.string().optional(),
    product: z.string().optional(),
    assignedTo: z.string().optional(),
    value: z.any().optional(),
    customPrice: z.any().optional(),
    description: z.string().optional(),
    public: z.boolean(),
    contactedToday: z.boolean(),
    followUpDate: z.string().optional(),
});

export function AddLeadDialog({ settings, users }: { settings: any, users: any[] }) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const [duplicateWarning, setDuplicateWarning] = useState<{ exists: boolean; leadName?: string } | null>(null);
    const [checkingPhone, setCheckingPhone] = useState(false);
    const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
    const currency = settings?.defaultCurrency || "AED";

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            countryCode: "971",
            status: "interesting",
            source: "",
            product: "",
            assignedTo: "",
            value: 0,
            customPrice: "",
            description: "",
            public: false,
            contactedToday: false,
            followUpDate: "",
        },
    });

    const isPhoneBlocked = duplicateWarning?.exists === true || checkingPhone;

    const handlePhoneDuplicateStatus = useCallback((status: { exists: boolean; leadName?: string } | null, checking: boolean) => {
        setDuplicateWarning(status);
        setCheckingPhone(checking);
    }, []);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        // Final duplicate guard — hard-block
        if (isPhoneBlocked) {
            toast({ title: "Blocked", description: "Cannot create lead: duplicate phone number detected", variant: "destructive" });
            return;
        }

        // Resolve productPrice from the selected product
        const selectedProd = settings?.products?.find((p: any) => p.key === values.product);
        const productPrice = selectedProd?.price ?? 0;

        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
            if (key === 'public' || key === 'contactedToday') {
                if (value === true) formData.append(key, "on");
            } else if (key === 'phone') {
                // Store full international number: countryCode + localDigits
                const fullPhone = (values.countryCode || "971") + String(value ?? "").replace(/[^0-9]/g, "");
                formData.append(key, fullPhone);
            } else {
                formData.append(key, String(value ?? ""));
            }
        });

        // Append pricing fields
        if (productPrice > 0) formData.set('productPrice', String(productPrice));
        if (values.customPrice) formData.set('customPrice', String(values.customPrice));

        // Add custom fields
        if (Object.keys(customFieldValues).length > 0) {
            formData.append('customFields', JSON.stringify(customFieldValues));
        }

        const result = await createLead(null, formData);
        if (result && result.message === "Invalid fields") {
            toast({ title: "Error", description: "Please check your input", variant: "destructive" });
            return;
        } else if (result && (result as any).duplicate) {
            toast({ title: "Duplicate Detected", description: result.message, variant: "destructive" });
            return;
        } else if (!result || !(result as any).success) {
            toast({ title: "Error", description: result?.message || "Failed to create lead", variant: "destructive" });
            return;
        }

        setOpen(false);
        setDuplicateWarning(null);
        setCustomFieldValues({});
        toast({ title: "Success", description: "Lead created successfully" });
        form.reset();
        router.refresh();
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setDuplicateWarning(null); }}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white rounded-xl shadow-lg transition-all active:scale-95 px-6">
                    Add Lead
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto rounded-3xl border-white/10 bg-card/95 backdrop-blur-2xl p-0">
                <div className="p-6 border-b border-white/10 bg-white/5">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Add New Lead</DialogTitle>
                        <DialogDescription className="text-muted-foreground/80">
                            Fill in the details to create a new lead in the system.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
                        {/* Top Row: Meta Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status *</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl border-white/10 bg-white/5 focus:ring-primary/20">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                                {settings?.statuses.map((s: any) => (
                                                    <SelectItem key={s.key} value={s.key} className="focus:bg-primary/20">{s.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="source"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl border-white/10 bg-white/5">
                                                    <SelectValue placeholder="Select source" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                                {settings?.sources.map((s: any) => (
                                                    <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="assignedTo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned To</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl border-white/10 bg-white/5">
                                                    <SelectValue placeholder="Unassigned" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                                {users?.filter((u: any) => u.active !== false).map((u: any) => (
                                                    <SelectItem key={u._id} value={u._id}>{u.name} ({u.role})</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Column: Core Info */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold flex items-center gap-2 text-primary/80">
                                    <span className="w-1 h-4 bg-primary rounded-full" />
                                    Basic Information
                                </h3>
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="John Doe" className="rounded-xl border-white/10 bg-white/5" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input placeholder="john@example.com" className="rounded-xl border-white/10 bg-white/5" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="space-y-1.5">
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone</FormLabel>
                                                <FormControl>
                                                    <PhoneInputWithCountry
                                                        value={field.value || ""}
                                                        countryCode={form.watch("countryCode") || "971"}
                                                        onChange={(phone, cc) => {
                                                            field.onChange(phone);
                                                            form.setValue("countryCode", cc);
                                                        }}
                                                        checkDuplicate={(fullPhone) => checkDuplicatePhone(fullPhone)}
                                                        onDuplicateStatus={handlePhoneDuplicateStatus}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Expected Value ({currency})</FormLabel>
                                            <FormControl>
                                                <Input type="number" className="rounded-xl border-white/10 bg-white/5" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Right Column: Details */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold flex items-center gap-2 text-primary/80">
                                    <span className="w-1 h-4 bg-primary rounded-full" />
                                    Details
                                </h3>
                                <FormField
                                    control={form.control}
                                    name="product"
                                    render={({ field }) => {
                                        const selectedProduct = settings?.products?.find((p: any) => p.key === field.value);
                                        const pPrice = selectedProduct?.price ?? 0;
                                        return (
                                        <FormItem>
                                            <FormLabel>Product/Interest</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="rounded-xl border-white/10 bg-white/5">
                                                        <SelectValue placeholder="Select product" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                                    {settings?.products?.map((p: any) => (
                                                        <SelectItem key={p.key} value={p.key}>
                                                            {p.label}{p.price ? ` — ${p.price.toLocaleString()} ${currency}` : ""}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                        );
                                    }}
                                />

                                {/* ── Pricing Comparison Widget ── */}
                                {(() => {
                                    const selProd = settings?.products?.find((p: any) => p.key === form.watch("product"));
                                    const origPrice = selProd?.price ?? 0;
                                    const custPrice = parseFloat(form.watch("customPrice")) || 0;
                                    const diff = custPrice - origPrice;
                                    const pct = origPrice > 0 ? ((diff / origPrice) * 100).toFixed(1) : "0";
                                    if (!form.watch("product") || origPrice <= 0) return null;
                                    return (
                                        <div className="space-y-3 p-3 bg-white/[0.03] rounded-xl border border-white/5">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pricing</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-muted-foreground">Original Price</label>
                                                    <div className="h-9 px-3 rounded-xl border border-white/10 bg-black/30 flex items-center font-mono text-sm text-emerald-400">
                                                        {origPrice.toLocaleString()} {currency}
                                                    </div>
                                                </div>
                                                <FormField
                                                    control={form.control}
                                                    name="customPrice"
                                                    render={({ field }) => (
                                                        <FormItem className="space-y-1">
                                                            <label className="text-[10px] text-muted-foreground">Your Selling Price</label>
                                                            <FormControl>
                                                                <Input
                                                                    type="number" min="0" step="0.01"
                                                                    placeholder="0"
                                                                    className="rounded-xl border-white/10 bg-black/20 font-mono text-sm"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            {custPrice > 0 && origPrice > 0 && (
                                                <div className={`flex items-center justify-between p-2 rounded-lg ${diff > 0 ? "bg-emerald-500/10" : diff < 0 ? "bg-red-500/10" : "bg-gray-500/10"}`}>
                                                    <span className="text-xs text-muted-foreground">Difference</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm font-mono font-bold ${diff > 0 ? "text-emerald-400" : diff < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                                                            {diff > 0 ? "▲ +" : diff < 0 ? "▼ " : ""}{diff.toLocaleString()} {currency}
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${diff > 0 ? "bg-emerald-500/20 text-emerald-400" : diff < 0 ? "bg-red-500/20 text-red-400" : "bg-gray-500/20"}`}>
                                                            {diff > 0 ? "+" : ""}{pct}%
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Dynamic Custom Fields */}
                        {settings?.customFields?.length > 0 && (
                            <div className="space-y-4 pt-4 border-t border-white/10">
                                <h3 className="text-sm font-bold flex items-center gap-2 text-primary/80">
                                    <span className="w-1 h-4 bg-amber-500 rounded-full" />
                                    Custom Fields
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {settings.customFields.map((cf: any) => (
                                        <div key={cf.key} className="space-y-1.5">
                                            <label className="text-sm font-medium">{cf.label}</label>
                                            {cf.type === 'select' ? (
                                                <select
                                                    title={`Select ${cf.label}`}
                                                    value={customFieldValues[cf.key] || ''}
                                                    onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.key]: e.target.value }))}
                                                    className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm"
                                                >
                                                    <option value="">Select...</option>
                                                    {cf.options?.map((opt: string) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <Input
                                                    type={cf.type === 'number' ? 'number' : cf.type === 'date' ? 'date' : 'text'}
                                                    placeholder={cf.label}
                                                    value={customFieldValues[cf.key] || ''}
                                                    onChange={e => setCustomFieldValues(prev => ({ ...prev, [cf.key]: e.target.value }))}
                                                    className="rounded-xl border-white/10 bg-white/5"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 pt-4 border-t border-white/10">
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes / Description</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Additional details..." className="rounded-xl border-white/10 bg-white/5 min-h-[100px]" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="followUpDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Follow-up Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" className="rounded-xl border-white/10 bg-white/5" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex flex-wrap gap-8 items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                <FormField
                                    control={form.control}
                                    name="public"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center gap-2 space-y-0">
                                            <FormControl>
                                                <input
                                                    type="checkbox"
                                                    id="public-checkbox"
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                    className="w-5 h-5 rounded border-white/20 bg-white/10 text-primary focus:ring-primary/20"
                                                    aria-label="Public Lead"
                                                />
                                            </FormControl>
                                            <FormLabel htmlFor="public-checkbox" className="cursor-pointer">Public Lead</FormLabel>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="contactedToday"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center gap-2 space-y-0">
                                            <FormControl>
                                                <input
                                                    type="checkbox"
                                                    id="contacted-today-checkbox"
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                    className="w-5 h-5 rounded border-white/20 bg-white/10 text-primary focus:ring-primary/20"
                                                    aria-label="Contacted Today"
                                                />
                                            </FormControl>
                                            <FormLabel htmlFor="contacted-today-checkbox" className="cursor-pointer">Contacted Today</FormLabel>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl border-white/10">Cancel</Button>
                            <Button
                                type="submit"
                                disabled={isPhoneBlocked}
                                className={`bg-primary text-white hover:bg-primary/90 rounded-xl px-8 shadow-lg shadow-primary/20 ${isPhoneBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {checkingPhone ? "Checking..." : "Save Lead"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog >
    );
}
