"use client";

import { useState, useEffect } from "react";
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
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateLead } from "@/lib/actions/leads";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    company: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    status: z.string().min(1, "Please select a status."),
    source: z.string().optional(),
    product: z.string().optional(),
    assignedTo: z.string().optional(),
    // Note: z.any() used to avoid RHF resolver generic type conflicts; runtime coercion is handled by the HTML input[type=number] and the server action.
    value: z.any().optional(),
    website: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    zipCode: z.string().optional(),
    position: z.string().optional(),
    defaultLanguage: z.string().optional(),
    description: z.string().optional(),
    tags: z.string().optional(),
    public: z.boolean(),
    contactedToday: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function EditLeadDialog({
    lead,
    open,
    setOpen,
    settings,
    users,
    currentUserRole
}: {
    lead: any,
    open: boolean,
    setOpen: (open: boolean) => void,
    settings: any,
    users: any[],
    currentUserRole?: string
}) {
    const isAdmin = currentUserRole === 'ADMIN';
    const isSales = currentUserRole === 'SALES';
    const { toast } = useToast();
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
    });

    // Update form values when lead changes
    useEffect(() => {
        if (lead) {
            form.reset({
                name: lead.name || "",
                company: lead.company || "",
                email: lead.email || "",
                phone: lead.phone || "",
                status: lead.status || "interesting",
                source: lead.source || "",
                product: lead.product || "",
                assignedTo: typeof lead.assignedTo === 'string' ? lead.assignedTo : lead.assignedTo?._id || "",
                value: lead.value || 0,
                website: lead.website || "",
                address: lead.address?.addressLine || "",
                city: lead.address?.city || "",
                state: lead.address?.state || "",
                country: lead.address?.country || "UAE",
                zipCode: lead.address?.zipCode || "",
                position: lead.position || "",
                defaultLanguage: lead.defaultLanguage || "System Default",
                description: lead.description || "",
                tags: Array.isArray(lead.tags) ? lead.tags.join(", ") : lead.tags || "",
                public: !!lead.public,
                contactedToday: !!lead.contactedToday,
            });
        }
    }, [lead, form]);

    async function onSubmit(values: FormValues) {
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
            if (key === 'public' || key === 'contactedToday') {
                if (value === true) formData.append(key, "on");
            } else {
                formData.append(key, String(value ?? ""));
            }
        });

        formData.append("id", lead._id);
        const result = await updateLead(null, formData);
        if (result && result.message === "Invalid fields") {
            toast({ title: "Error", description: "Please check your input", variant: "destructive" });
            return;
        } else if (result && result.message) {
            toast({ title: "Note", description: result.message });
        }

        setOpen(false);
        toast({ title: "Success", description: "Lead updated successfully" });
    }

    if (!lead) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border-white/10 bg-card/95 backdrop-blur-xl shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Edit Lead: {lead.name}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground/80">
                        Update the details for this lead.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Column: Basic Info */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold flex items-center gap-2 text-primary/80">
                                    <span className="w-1 h-4 bg-primary rounded-full" />
                                    General Information
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
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
                                        name="position"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Position</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="CEO" className="rounded-xl border-white/10 bg-white/5" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="company"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Acme Inc." className="rounded-xl border-white/10 bg-white/5" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
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
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="+971..." className="rounded-xl border-white/10 bg-white/5" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="value"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Lead Value</FormLabel>
                                                <FormControl>
                                                    <Input type="number" placeholder="5000" className="rounded-xl border-white/10 bg-white/5" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="website"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Website</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://..." className="rounded-xl border-white/10 bg-white/5" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="rounded-xl border-white/10 bg-white/5">
                                                            <SelectValue placeholder="Status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                                        {settings?.statuses?.map((s: any) => (
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
                                        name="source"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Source</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="rounded-xl border-white/10 bg-white/5">
                                                            <SelectValue placeholder="Select source" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                                        {settings?.sources?.map((s: any) => (
                                                            <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="assignedTo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Assign To {isSales && <span className="text-xs text-muted-foreground">(Read-only)</span>}</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSales}>
                                                <FormControl>
                                                    <SelectTrigger className="rounded-xl border-white/10 bg-white/5">
                                                        <SelectValue placeholder="Unassigned" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                                    {users?.filter((u: any) => u.role === 'SALES').map((u: any) => (
                                                        <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Right Column: Address & Details */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold flex items-center gap-2 text-primary/80">
                                    <span className="w-1 h-4 bg-primary rounded-full" />
                                    Location & Details
                                </h3>
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Address Line</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Business Bay" className="rounded-xl border-white/10 bg-white/5" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>City</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Dubai" className="rounded-xl border-white/10 bg-white/5" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="state"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>State/Province</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Dubai" className="rounded-xl border-white/10 bg-white/5" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="country"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Country</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="UAE" className="rounded-xl border-white/10 bg-white/5" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="zipCode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Zip Code</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="00000" className="rounded-xl border-white/10 bg-white/5" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="defaultLanguage"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Default Language</FormLabel>
                                            <FormControl>
                                                <Input placeholder="English" className="rounded-xl border-white/10 bg-white/5" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="product"
                                    render={({ field }) => (
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
                                                        <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

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
                                name="tags"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tags (comma separated)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="vip, urgent" className="rounded-xl border-white/10 bg-white/5" {...field} />
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
                                                    id="edit-public-checkbox"
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                    className="w-5 h-5 rounded border-white/20 bg-white/10 text-primary focus:ring-primary/20"
                                                    aria-label="Public Lead"
                                                />
                                            </FormControl>
                                            <FormLabel htmlFor="edit-public-checkbox" className="cursor-pointer">Public Lead</FormLabel>
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
                                                    id="edit-contacted-today-checkbox"
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                    className="w-5 h-5 rounded border-white/20 bg-white/10 text-primary focus:ring-primary/20"
                                                    aria-label="Contacted Today"
                                                />
                                            </FormControl>
                                            <FormLabel htmlFor="edit-contacted-today-checkbox" className="cursor-pointer">Contacted Today</FormLabel>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end pt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-xl border-white/10">Cancel</Button>
                            <Button type="submit" className="bg-primary text-white hover:bg-primary/90 rounded-xl px-8 shadow-lg shadow-primary/20">Update Lead</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
