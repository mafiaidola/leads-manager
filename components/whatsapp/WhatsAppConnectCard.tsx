"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getWhatsAppConfig, disconnectWhatsApp } from "@/lib/actions/whatsapp";
import { MessageCircle, Unplug, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WhatsAppConnectCard() {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [disconnecting, setDisconnecting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        getWhatsAppConfig().then((c) => {
            setConfig(c);
            setLoading(false);
        });

        // Check for success/error in URL params
        const params = new URLSearchParams(window.location.search);
        if (params.get("wa_success")) {
            toast({ title: "✅ WhatsApp connected successfully!" });
            // Clean URL
            window.history.replaceState({}, "", window.location.pathname);
        }
        if (params.get("wa_error")) {
            toast({
                title: "WhatsApp connection failed",
                description: params.get("wa_error") || undefined,
                variant: "destructive",
            });
            window.history.replaceState({}, "", window.location.pathname);
        }
    }, [toast]);

    const handleConnect = () => {
        window.location.href = "/api/whatsapp/connect";
    };

    const handleDisconnect = async () => {
        setDisconnecting(true);
        const result = await disconnectWhatsApp();
        if (result.success) {
            setConfig(null);
            toast({ title: "WhatsApp disconnected" });
        } else {
            toast({ title: "Failed to disconnect", variant: "destructive" });
        }
        setDisconnecting(false);
    };

    if (loading) {
        return (
            <Card className="rounded-2xl border-white/10 bg-card/40 backdrop-blur-xl">
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-2xl border-white/10 bg-card/40 backdrop-blur-xl">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageCircle className="h-5 w-5 text-green-500" />
                    WhatsApp Integration
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {config?.connected ? (
                    <>
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <div>
                                <p className="text-sm font-medium text-emerald-400">Connected</p>
                                <p className="text-xs text-muted-foreground">
                                    Phone: {config.displayPhone || "N/A"}
                                </p>
                                {config.connectedAt && (
                                    <p className="text-xs text-muted-foreground">
                                        Since: {new Date(config.connectedAt).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDisconnect}
                            disabled={disconnecting}
                            className="rounded-xl border-red-500/20 text-red-400 hover:bg-red-500/10"
                        >
                            {disconnecting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                            ) : (
                                <Unplug className="h-4 w-4 mr-1.5" />
                            )}
                            Disconnect WhatsApp
                        </Button>
                    </>
                ) : (
                    <>
                        <p className="text-sm text-muted-foreground">
                            Connect your WhatsApp Business account to send messages directly from leads.
                            Each user connects their own number.
                        </p>
                        <div className="space-y-2">
                            <Button
                                onClick={handleConnect}
                                className="rounded-xl bg-green-600 hover:bg-green-700 text-white"
                            >
                                <MessageCircle className="h-4 w-4 mr-1.5" />
                                Connect WhatsApp
                                <ExternalLink className="h-3 w-3 ml-1.5" />
                            </Button>
                            <p className="text-[10px] text-muted-foreground">
                                Requires Meta Business account with WhatsApp Business API access
                            </p>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
