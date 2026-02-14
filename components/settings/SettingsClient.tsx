"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateSettings } from "@/lib/actions/settings";
import { createUser } from "@/lib/actions/users";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function SettingsClient({ settings, users }: { settings: any, users: any[] }) {
    const [statuses, setStatuses] = useState<any[]>(settings?.statuses || []);
    const [sources, setSources] = useState<any[]>(settings?.sources || []);
    const [products, setProducts] = useState<any[]>(settings?.products || []);
    const { toast } = useToast();

    const handleSaveSettings = async () => {
        const result = await updateSettings({
            statuses,
            sources,
            products
        });
        if (result?.message === "Settings updated") {
            toast({ title: "Settings saved" });
        } else {
            toast({ title: "Error saving settings", variant: "destructive" });
        }
    };

    const handleAddStatus = () => {
        setStatuses([...statuses, { key: `status_${Date.now()}`, label: "New Status", color: "gray" }]);
    }

    const handleRemoveStatus = (index: number) => {
        const newStatuses = [...statuses];
        newStatuses.splice(index, 1);
        setStatuses(newStatuses);
    }

    const handleStatusChange = (index: number, field: string, value: string) => {
        const newStatuses = [...statuses];
        newStatuses[index] = { ...newStatuses[index], [field]: value };
        setStatuses(newStatuses);
    }

    // User creation state
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "SALES" });

    const handleCreateUser = async () => {
        const formData = new FormData();
        formData.append("name", newUser.name);
        formData.append("email", newUser.email);
        formData.append("password", newUser.password);
        formData.append("role", newUser.role);

        const result = await createUser(null, formData);
        if (result?.message === "User created successfully") {
            toast({ title: "User created", description: `${newUser.role} user created successfully.` });
            setNewUser({ name: "", email: "", password: "", role: "SALES" });
        } else {
            toast({ title: result?.message || "Error", variant: "destructive" });
        }
    }

    return (
        <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="bg-card/40 backdrop-blur-xl border border-white/10 p-1 rounded-2xl h-12">
                <TabsTrigger value="general" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">General</TabsTrigger>
                <TabsTrigger value="products" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Products</TabsTrigger>
                <TabsTrigger value="users" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white transition-all">Team</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
                <div className="grid gap-6 md:grid-cols-2">
                    <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden self-start">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-primary rounded-full" />
                                Lead Statuses
                            </CardTitle>
                            <CardDescription className="text-muted-foreground/80">Configure possible lead stages.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                {statuses.map((status, index) => (
                                    <div key={index} className="flex items-center gap-2 group bg-white/5 p-2 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Label</Label>
                                            <Input
                                                value={status.label}
                                                onChange={(e) => handleStatusChange(index, 'label', e.target.value)}
                                                placeholder="Label"
                                                className="h-9 rounded-xl border-white/10 bg-black/20"
                                            />
                                        </div>
                                        <div className="w-[100px] space-y-1">
                                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Key</Label>
                                            <Input
                                                value={status.key}
                                                onChange={(e) => handleStatusChange(index, 'key', e.target.value)}
                                                placeholder="Key"
                                                className="h-9 rounded-xl border-white/10 bg-black/20"
                                            />
                                        </div>
                                        <div className="w-[80px] space-y-1">
                                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Color</Label>
                                            <Input
                                                value={status.color}
                                                onChange={(e) => handleStatusChange(index, 'color', e.target.value)}
                                                placeholder="Color"
                                                className="h-9 rounded-xl border-white/10 bg-black/20"
                                            />
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveStatus(index)} className="mt-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button onClick={handleAddStatus} variant="outline" size="sm" className="rounded-xl border-white/10 hover:bg-primary/10 hover:text-primary transition-colors">
                                Add New Status
                            </Button>
                            <div className="pt-6 border-t border-white/5">
                                <Button onClick={handleSaveSettings} className="w-full rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">Save General Settings</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden self-start">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-blue-500 rounded-full" />
                                Lead Sources
                            </CardTitle>
                            <CardDescription className="text-muted-foreground/80">Manage where leads come from.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                {sources.map((source, index) => (
                                    <div key={index} className="flex items-center gap-2 group bg-white/5 p-2 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="flex-1 space-y-1">
                                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Label</Label>
                                            <Input
                                                value={source.label}
                                                onChange={(e) => {
                                                    const newSources = [...sources];
                                                    newSources[index] = { ...newSources[index], label: e.target.value };
                                                    setSources(newSources);
                                                }}
                                                placeholder="Label"
                                                className="h-9 rounded-xl border-white/10 bg-black/20"
                                            />
                                        </div>
                                        <div className="w-[120px] space-y-1">
                                            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Key</Label>
                                            <Input
                                                value={source.key}
                                                onChange={(e) => {
                                                    const newSources = [...sources];
                                                    newSources[index] = { ...newSources[index], key: e.target.value };
                                                    setSources(newSources);
                                                }}
                                                placeholder="Key"
                                                className="h-9 rounded-xl border-white/10 bg-black/20"
                                            />
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => {
                                            const newSources = [...sources];
                                            newSources.splice(index, 1);
                                            setSources(newSources);
                                        }} className="mt-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button onClick={() => setSources([...sources, { key: `source_${Date.now()}`, label: "New Source" }])} variant="outline" size="sm" className="rounded-xl border-white/10 hover:bg-blue-500/10 hover:text-blue-500 transition-colors">
                                Add New Source
                            </Button>
                            <div className="pt-6 border-t border-white/5">
                                <Button onClick={handleSaveSettings} className="w-full rounded-xl bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/20">Update Source List</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <TabsContent value="products">
                <Card className="rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden max-w-2xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                            Products & Tags
                        </CardTitle>
                        <CardDescription className="text-muted-foreground/80">Configure products or specialization tags.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            {products.map((product, index) => (
                                <div key={index} className="flex items-center gap-2 group bg-white/5 p-2 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Label</Label>
                                        <Input
                                            value={product.label}
                                            onChange={(e) => {
                                                const newProducts = [...products];
                                                newProducts[index] = { ...newProducts[index], label: e.target.value };
                                                setProducts(newProducts);
                                            }}
                                            placeholder="Label"
                                            className="h-9 rounded-xl border-white/10 bg-black/20"
                                        />
                                    </div>
                                    <div className="w-[140px] space-y-1">
                                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1">Key</Label>
                                        <Input
                                            value={product.key}
                                            onChange={(e) => {
                                                const newProducts = [...products];
                                                newProducts[index] = { ...newProducts[index], key: e.target.value };
                                                setProducts(newProducts);
                                            }}
                                            placeholder="Key"
                                            className="h-9 rounded-xl border-white/10 bg-black/20"
                                        />
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => {
                                        const newProducts = [...products];
                                        newProducts.splice(index, 1);
                                        setProducts(newProducts);
                                    }} className="mt-5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button onClick={() => setProducts([...products, { key: `product_${Date.now()}`, label: "New Product" }])} variant="outline" size="sm" className="rounded-xl border-white/10 hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors">
                            Add New Product
                        </Button>
                        <div className="pt-6 border-t border-white/5">
                            <Button onClick={handleSaveSettings} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-8 shadow-lg shadow-emerald-500/20">Save Product Changes</Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="users">
                <div className="grid gap-6 md:grid-cols-5">
                    <Card className="md:col-span-2 rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden self-start">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-violet-500 rounded-full" />
                                Team Member Management
                            </CardTitle>
                            <CardDescription className="text-muted-foreground/80">Add new team members (Sales or Marketing).</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4 bg-primary/5 p-6 rounded-3xl border border-primary/10">
                                <h3 className="text-sm font-bold text-primary">Create User Profile</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs ml-1">Full Name</Label>
                                        <Input
                                            value={newUser.name}
                                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                            className="rounded-xl border-white/10 bg-black/20"
                                            placeholder="Jane Doe"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs ml-1">Work Email</Label>
                                        <Input
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                            type="email"
                                            className="rounded-xl border-white/10 bg-black/20"
                                            placeholder="jane@company.com"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs ml-1">Initial Password</Label>
                                        <Input
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            type="password"
                                            className="rounded-xl border-white/10 bg-black/20"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs ml-1">Role</Label>
                                        <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                                            <SelectTrigger className="rounded-xl border-white/10 bg-black/20">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-white/10 bg-card/95 backdrop-blur-xl">
                                                <SelectItem value="SALES">Sales</SelectItem>
                                                <SelectItem value="MARKETING">Marketing</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleCreateUser}
                                    disabled={!newUser.name || !newUser.email || !newUser.password}
                                    className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/20 transition-all font-bold"
                                >
                                    Register Team Member
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-3 rounded-3xl border-white/10 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold">Existing Team Members</CardTitle>
                            <CardDescription>View and manage current access roles.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {users.map((user) => (
                                    <div key={user._id} className="flex items-center justify-between p-4 border border-white/5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-500 font-bold border border-violet-500/10">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold group-hover:text-primary transition-colors">{user.name}</div>
                                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={cn(
                                            "rounded-full text-[10px] font-bold border-white/10 uppercase tracking-widest px-2 h-6",
                                            user.role === 'ADMIN' ? 'bg-violet-500/15 text-violet-500 border-violet-500/30'
                                                : user.role === 'MARKETING' ? 'bg-teal-500/15 text-teal-500 border-teal-500/30'
                                                    : 'bg-primary/15 text-primary border-primary/30'
                                        )}>
                                            {user.role}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
        </Tabs>
    );
}
