"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface ProductsTabProps {
    products: any[];
    customFields: any[];
    onProductsChange: (products: any[]) => void;
    onCustomFieldsChange: (fields: any[]) => void;
    onSaveSettings: () => void;
}

export function ProductsTab({
    products, customFields,
    onProductsChange, onCustomFieldsChange,
    onSaveSettings,
}: ProductsTabProps) {
    return (
        <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
            <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                    Products / Services
                </CardTitle>
                <CardDescription className="text-muted-foreground/80">Manage the offerings your leads are interested in.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                    {products.map((product, index) => (
                        <div key={index} className="flex items-center gap-2 group bg-white/5 p-3 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="flex-1">
                                <Input
                                    value={product.label}
                                    onChange={(e) => {
                                        const newProducts = [...products];
                                        newProducts[index] = { ...product, label: e.target.value, key: e.target.value.toLowerCase().replace(/\s/g, '_') };
                                        onProductsChange(newProducts);
                                    }}
                                    className="h-9 rounded-xl border-white/10 bg-black/20"
                                />
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => {
                                const newProducts = [...products];
                                newProducts.splice(index, 1);
                                onProductsChange(newProducts);
                            }} className="h-9 w-9 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
                <Button onClick={() => onProductsChange([...products, { key: `product_${Date.now()}`, label: "New Product" }])} variant="outline" size="sm" className="rounded-xl border-white/10 hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors">
                    Add New Product
                </Button>
                <div className="pt-6 border-t border-white/5 flex gap-3">
                    <Button onClick={onSaveSettings} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-8 shadow-lg shadow-emerald-500/20">Save Product Changes</Button>
                </div>

                {/* Custom Fields */}
                <div className="pt-6 border-t border-white/5">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2"><span className="w-1.5 h-4 bg-cyan-500 rounded-full" />Custom Lead Fields</h3>
                    <div className="space-y-3">
                        {customFields.map((field, index) => (
                            <div key={index} className="flex items-center gap-2 group bg-white/5 p-3 rounded-2xl border border-white/5">
                                <Input
                                    value={field.label}
                                    onChange={(e) => {
                                        const newFields = [...customFields];
                                        newFields[index] = { ...field, label: e.target.value, key: e.target.value.toLowerCase().replace(/\s/g, '_') };
                                        onCustomFieldsChange(newFields);
                                    }}
                                    placeholder="Field name"
                                    className="h-9 flex-1 rounded-xl border-white/10 bg-black/20"
                                />
                                <Select value={field.type} onValueChange={(v) => {
                                    const newFields = [...customFields];
                                    newFields[index] = { ...field, type: v };
                                    onCustomFieldsChange(newFields);
                                }}>
                                    <SelectTrigger className="w-28 h-9 rounded-xl border-white/10 bg-black/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                        <SelectItem value="text">Text</SelectItem>
                                        <SelectItem value="number">Number</SelectItem>
                                        <SelectItem value="date">Date</SelectItem>
                                        <SelectItem value="select">Select</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="ghost" size="icon" onClick={() => {
                                    const newFields = [...customFields];
                                    newFields.splice(index, 1);
                                    onCustomFieldsChange(newFields);
                                }} className="h-9 w-9 text-red-400">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button onClick={() => onCustomFieldsChange([...customFields, { key: `cf_${Date.now()}`, label: "", type: "text" }])} variant="outline" size="sm" className="mt-3 rounded-xl border-white/10 hover:bg-cyan-500/10 hover:text-cyan-500 transition-colors">
                        Add Custom Field
                    </Button>
                    <div className="pt-4">
                        <Button onClick={onSaveSettings} className="rounded-xl bg-cyan-500 hover:bg-cyan-600 px-8 shadow-lg shadow-cyan-500/20">Save Fields</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
