"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { sendWhatsAppMessage, sendWhatsAppTemplate } from "@/lib/actions/whatsapp";
import { MessageCircle, Send, Loader2, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WhatsAppSendDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    leadId: string;
    leadName: string;
    leadPhone?: string;
}

export default function WhatsAppSendDialog({
    open,
    onOpenChange,
    leadId,
    leadName,
    leadPhone,
}: WhatsAppSendDialogProps) {
    const [mode, setMode] = useState<"text" | "template">("text");
    const [message, setMessage] = useState("");
    const [templateName, setTemplateName] = useState("");
    const [templateLang, setTemplateLang] = useState("en");
    const [templateParams, setTemplateParams] = useState("");
    const [sending, setSending] = useState(false);
    const { toast } = useToast();

    const handleSendText = async () => {
        if (!message.trim()) return;
        setSending(true);
        const result = await sendWhatsAppMessage(leadId, message.trim());
        if (result.success) {
            toast({ title: "✅ WhatsApp message sent!" });
            setMessage("");
            onOpenChange(false);
        } else {
            toast({ title: "Failed to send", description: result.error, variant: "destructive" });
        }
        setSending(false);
    };

    const handleSendTemplate = async () => {
        if (!templateName.trim()) return;
        setSending(true);
        const params = templateParams
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean);
        const result = await sendWhatsAppTemplate(leadId, templateName.trim(), templateLang, params);
        if (result.success) {
            toast({ title: "✅ Template message sent!" });
            setTemplateName("");
            setTemplateParams("");
            onOpenChange(false);
        } else {
            toast({ title: "Failed to send template", description: result.error, variant: "destructive" });
        }
        setSending(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md rounded-2xl border-white/10 bg-card/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-green-500" />
                        Send WhatsApp to {leadName}
                    </DialogTitle>
                    <DialogDescription>
                        {leadPhone ? `Phone: ${leadPhone}` : "⚠️ No phone number on this lead"}
                    </DialogDescription>
                </DialogHeader>

                {!leadPhone ? (
                    <p className="text-sm text-red-400 py-4 text-center">
                        This lead has no phone number. Please add one first.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {/* Mode Toggle */}
                        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-0.5">
                            <button
                                onClick={() => setMode("text")}
                                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === "text" ? "bg-green-600 text-white shadow" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                <Send className="h-3 w-3 inline mr-1" /> Free Text
                            </button>
                            <button
                                onClick={() => setMode("template")}
                                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === "template" ? "bg-green-600 text-white shadow" : "text-muted-foreground hover:text-foreground"}`}
                            >
                                <FileText className="h-3 w-3 inline mr-1" /> Template
                            </button>
                        </div>

                        {mode === "text" ? (
                            <div className="space-y-2">
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    rows={4}
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-green-500/50 resize-none"
                                    aria-label="WhatsApp message"
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    ⚠️ Free-form messages only work within 24h of last customer reply (Meta policy)
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">
                                        Template Name
                                    </label>
                                    <input
                                        value={templateName}
                                        onChange={(e) => setTemplateName(e.target.value)}
                                        placeholder="e.g. hello_world"
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-green-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">
                                        Language
                                    </label>
                                    <select
                                        value={templateLang}
                                        onChange={(e) => setTemplateLang(e.target.value)}
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none bg-card"
                                        aria-label="Template language"
                                    >
                                        <option value="en">English</option>
                                        <option value="ar">Arabic</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">
                                        Parameters (comma-separated)
                                    </label>
                                    <input
                                        value={templateParams}
                                        onChange={(e) => setTemplateParams(e.target.value)}
                                        placeholder="e.g. John, Premium Plan"
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-green-500/50"
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                    Templates must be pre-approved in your Meta Business Manager
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl"
                    >
                        Cancel
                    </Button>
                    {leadPhone && (
                        <Button
                            size="sm"
                            onClick={mode === "text" ? handleSendText : handleSendTemplate}
                            disabled={sending || (mode === "text" ? !message.trim() : !templateName.trim())}
                            className="rounded-xl bg-green-600 hover:bg-green-700 text-white"
                        >
                            {sending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                            ) : (
                                <Send className="h-4 w-4 mr-1.5" />
                            )}
                            {sending ? "Sending..." : "Send via WhatsApp"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
