ûM"use client";

/**
 * Promotions Tab - CONNECTED TO REAL API
 * Uses /api/discounts for CRUD operations
 * ~120 lines - AI friendly
 */

import { useState, useEffect, useCallback } from "react";
import { Language } from "./types";
import { toast } from "sonner";

interface PromotionsTabProps { language: Language; }

interface Discount {
    id: string;
    code: string;
    name?: string;
    type: "percentage" | "fixed" | "free_shipping";
    value: number;
    usage_count?: number;
    usage_limit?: number;
    ends_at?: string;
    is_active: boolean;
}

export function PromotionsTab({ language }: PromotionsTabProps) {
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCode, setNewCode] = useState("");
    const [newType, setNewType] = useState<"percentage" | "fixed" | "free_shipping">("percentage");
    const [newValue, setNewValue] = useState("");
    const isRTL = language === "ar";

    // Fetch discounts from API
    const fetchDiscounts = useCallback(async () => {
        try {
            const res = await fetch("/api/discounts?includeInactive=true", { credentials: "include" });
            const json = await res.json();
            if (json.success) setDiscounts(json.data || []);
        } catch { toast.error("Failed to load discounts"); }
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => { fetchDiscounts(); }, [fetchDiscounts]);

    // Create discount
    const handleCreate = async () => {
        if (!newCode.trim()) return toast.error(isRTL ? "Ø£Ø¯Ø®Ù„ Ø§Ù„ÙƒÙˆØ¯" : "Enter code");
        try {
            const res = await fetch("/api/discounts", {
                method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
                body: JSON.stringify({ code: newCode, type: newType, value: Number(newValue) || 0 }),
            });
            const json = await res.json();
            if (json.success) { toast.success(isRTL ? "ØªÙ… Ø§Ù„Ø¥Ø¶Ø§ÙØ©" : "Coupon created"); setShowAddModal(false); setNewCode(""); fetchDiscounts(); }
            else toast.error(json.error || "Failed");
        } catch { toast.error("Failed"); }
    };

    // Delete discount
    const handleDelete = async (id: string) => {
        if (!confirm(isRTL ? "Ø­Ø°Ù Ø§Ù„ÙƒÙˆØ¨ÙˆÙ†ØŸ" : "Delete this coupon?")) return;
        try {
            const res = await fetch(`/api/discounts/${id}`, { method: "DELETE", credentials: "include" });
            if (res.ok) { toast.success(isRTL ? "ØªÙ… Ø§Ù„Ø­Ø°Ù" : "Deleted"); fetchDiscounts(); }
        } catch { toast.error("Failed"); }
    };

    // Toggle active status
    const toggleActive = async (d: Discount) => {
        try {
            await fetch(`/api/discounts/${d.id}`, {
                method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
                body: JSON.stringify({ isActive: !d.is_active }),
            });
            fetchDiscounts();
        } catch { toast.error("Failed"); }
    };

    const filtered = discounts.filter(d => statusFilter === "all" || (statusFilter === "active" ? d.is_active : !d.is_active));
    const statusConfig: Record<string, { color: string; label: string; labelAr: string }> = {
        active: { color: "bg-green-100 text-green-700", label: "Active", labelAr: "Ù†Ø´Ø·" },
        inactive: { color: "bg-gray-100 text-gray-600", label: "Inactive", labelAr: "ØºÙŠØ± Ù†Ø´Ø·" },
    };

    if (isLoading) return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className={`flex items-center justify-between flex-wrap gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{isRTL ? "Ø§Ù„Ø¹Ø±ÙˆØ¶ ÙˆØ§Ù„Ø£ÙƒÙˆØ§Ø¯" : "Promotions & Coupons"} <span className="text-gray-400 font-normal">({discounts.length})</span></h2>
                <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium text-sm shadow-md">
                    {isRTL ? "â• ÙƒÙˆØ¨ÙˆÙ† Ø¬Ø¯ÙŠØ¯" : "â• New Coupon"}
                </button>
            </div>
            {/* Filter */}
            <div className="flex gap-2">
                {["all", "active", "inactive"].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-2 rounded-xl font-medium ${statusFilter === s ? "bg-amber-500 text-white" : ""}`} style={statusFilter !== s ? { backgroundColor: "var(--bg-hover)", color: "var(--text-secondary)" } : {}}>
                        {s === "all" ? (isRTL ? "Ø§Ù„ÙƒÙ„" : "All") : s === "active" ? (isRTL ? "Ù†Ø´Ø·" : "Active") : (isRTL ? "ØºÙŠØ± Ù†Ø´Ø·" : "Inactive")}
                    </button>
                ))}
            </div>
            {/* Empty State */}
            {filtered.length === 0 && <div className="text-center py-12"><span className="text-5xl block mb-4">ğŸŸï¸</span><p className="text-gray-500">{isRTL ? "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø£ÙƒÙˆØ§Ø¯ Ø®ØµÙ…" : "No discount codes yet"}</p></div>}
            {/* Coupons List */}
            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
                {filtered.map((d, i) => (
                    <div key={d.id} className={`p-4 flex items-center gap-4 hover:bg-amber-50/50 dark:hover:bg-gray-700/30 ${isRTL ? "flex-row-reverse" : ""} ${i !== filtered.length - 1 ? "border-b" : ""}`} style={{ borderColor: "var(--border)" }}>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                            <span className="text-xl">{d.type === "percentage" ? "%" : d.type === "fixed" ? "$" : "ğŸšš"}</span>
                        </div>
                        <div className={`flex-1 ${isRTL ? "text-right" : ""}`}>
                            <p className="font-bold font-mono" style={{ color: "var(--text-primary)" }}>{d.code}</p>
                            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{d.type === "percentage" ? `${d.value}%` : d.type === "fixed" ? `$${d.value}` : "Free Shipping"} {d.ends_at ? `â€¢ ${isRTL ? "ÙŠÙ†ØªÙ‡ÙŠ" : "Expires"} ${new Date(d.ends_at).toLocaleDateString()}` : ""}</p>
                        </div>
                        <div className="text-center"><p className="font-bold" style={{ color: "var(--text-primary)" }}>{d.usage_count || 0}/{d.usage_limit || "âˆ"}</p><p className="text-xs" style={{ color: "var(--text-secondary)" }}>{isRTL ? "Ø§Ø³ØªØ®Ø¯Ø§Ù…" : "uses"}</p></div>
                        <button onClick={() => toggleActive(d)} className={`px-2 py-1 rounded-full text-xs font-medium ${d.is_active ? statusConfig.active.color : statusConfig.inactive.color}`}>{d.is_active ? (isRTL ? statusConfig.active.labelAr : statusConfig.active.label) : (isRTL ? statusConfig.inactive.labelAr : statusConfig.inactive.label)}</button>
                        <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-600">ğŸ—‘ï¸</button>
                    </div>
                ))}
            </div>
            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>{isRTL ? "Ø¥Ø¶Ø§ÙØ© ÙƒÙˆØ¨ÙˆÙ†" : "Add Coupon"}</h3>
                        <input type="text" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} placeholder={isRTL ? "ÙƒÙˆØ¯ Ø§Ù„ÙƒÙˆØ¨ÙˆÙ†" : "Coupon Code"} className="w-full p-3 rounded-xl border mb-3 font-mono" style={{ backgroundColor: "var(--bg-hover)", borderColor: "var(--border)", color: "var(--text-primary)" }} />
                        <select value={newType} onChange={e => setNewType(e.target.value as typeof newType)} className="w-full p-3 rounded-xl border mb-3" style={{ backgroundColor: "var(--bg-hover)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
                            <option value="percentage">{isRTL ? "Ø®ØµÙ… Ù†Ø³Ø¨Ø© %" : "Percentage %"}</option>
                            <option value="fixed">{isRTL ? "Ù…Ø¨Ù„Øº Ø«Ø§Ø¨Øª $" : "Fixed Amount $"}</option>
                            <option value="free_shipping">{isRTL ? "Ø´Ø­Ù† Ù…Ø¬Ø§Ù†ÙŠ" : "Free Shipping"}</option>
                        </select>
                        {newType !== "free_shipping" && <input type="number" value={newValue} onChange={e => setNewValue(e.target.value)} placeholder={isRTL ? "Ù‚ÙŠÙ…Ø© Ø§Ù„Ø®ØµÙ…" : "Discount Value"} className="w-full p-3 rounded-xl border mb-4" style={{ backgroundColor: "var(--bg-hover)", borderColor: "var(--border)", color: "var(--text-primary)" }} />}
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl" style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-primary)" }}>{isRTL ? "Ø¥Ù„ØºØ§Ø¡" : "Cancel"}</button>
                            <button onClick={handleCreate} className="px-4 py-2 bg-amber-500 text-white rounded-xl">{isRTL ? "Ø¥Ø¶Ø§ÙØ©" : "Add"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
( (CCE EFFG GJJT TWWX Xaab bffg ghhi ijjk kqqu uzz{ {||~ ~	€ €ƒ
ƒš š²
²Ô ÔÛ
ÛÜ Üß
ßà àë
ëì ìğ
ğò òó
óô ôõ
õş ş‚
‚ƒ ƒ„
„¾ ¾¿
¿Á ÁÇ
ÇÈ ÈË
ËÏ ÏĞ
ĞÑ ÑÒ
ÒÛ Ûæ
æí íÿ
ÿ€ €ƒ
ƒ… …ˆ
ˆ‰ ‰‹
‹š š
 Ò
ÒØ ØÚ
ÚŞ Şß
ßá áú
úû ûı
ış şŒ
Œ ‘
‘’ ’
Ÿ Ÿ¦
¦¨ ¨´
´· ·À
ÀÁ ÁÅ
ÅÆ ÆÛ
ÛÜ Üé
éê êş
ş€ €†
†‡ ‡Š
Š 
 –
–˜ ˜™
™š š¡
¡¢ ¢¨
¨© ©¾
¾¿ ¿Á
ÁÂ ÂÍ
ÍÎ ÎÙ
ÙÚ Úë
ëğ ğõ
õö öş
şÿ ÿ„
„… …¡
¡¢ ¢¥
¥¦ ¦¬
¬¯ ¯¹
¹º º»
»¼ ¼À
ÀÂ ÂÊ
ÊË Ëá
áâ âê
êí íî
îğ ğ‘
‘“ “¨
¨ª ª¬
¬­ ­±
±´ ´Ï
Ï× ×Ù
ÙÚ Úà
àá áó
óö öÿ
ÿ ‚
‚„ „
 –
–— —Ÿ
Ÿ¡ ¡³
³´ ´»
»¼ ¼½
½¾ ¾Å
ÅÆ ÆÍ
ÍÎ ÎÚ
ÚÛ Ûá
áâ âî
îï ïú
úü ü	
	‚	 ‚		
		 		
	Ÿ	 Ÿ	©	
©	ª	 ª	Ä	
Ä	Æ	 Æ	Í	
Í	Î	 Î	Ñ	
Ñ	Ò	 Ò	ä	
ä	å	 å	ç	
ç	è	 è	ò	
ò	ø	 ø	—

—
š
 š
œ

œ
¡
 ¡
¤

¤
¥
 ¥
¹

¹
º
 º
Ñ

Ñ
Ò
 Ò
å

å
æ
 æ
ì

ì
î
 î
ø

ø
ù
 ù
ˆ
ˆ‰ ‰£
£¥ ¥²
²» »Æ
ÆÇ ÇÉ
ÉÊ ÊĞ
ĞÑ ÑÕ
ÕÖ Öè
èé éş
şÿ ÿƒ
ƒ„ „
 ™
™› ›¡
¡£ £®
®¯ ¯±
±² ²Á
ÁÂ ÂÃ
ÃÄ ÄÉ
ÉÍ ÍÎ
ÎĞ ĞÕ
ÕÖ Öİ
İŞ Şè
èé éü
üı ıÿ
ÿ€ €ƒ
ƒ„ „Œ
Œ ’
’– –˜
˜š š›
›œ œ
 ¦
¦§ §Ã
ÃÆ ÆÉ
ÉË ËÏ
ÏÑ ÑÙ
ÙÚ Úá
áæ æù
ùú úı
ış şÿ
ÿ€ €†
†‡ ‡•
•˜ ˜®
®´ ´·
·º º½
½¾ ¾À
ÀÁ ÁÇ
ÇÈ ÈË
ËÍ ÍÓ
ÓÖ Ö×
×Ù ÙÚ
ÚÛ Ûå
åç çé
éë ëí
íî îö
öû û€
€‚ ‚‡
‡ˆ ˆ
Ÿ Ÿ£
£¤ ¤­
­® ®³
³µ µ¹
¹º º½
½¿ ¿Æ
ÆÈ ÈÑ
ÑÒ ÒÚ
ÚÛ Ûİ
İŞ Şß
ßà àã
ãä äç
çè èü
üı ı™
™š š°
°± ±½
½¿ ¿Ä
ÄÅ Åğ
ğó óˆ
ˆ‰ ‰™
™š šœ
œ ©
©ª ª¬
¬­ ­´
´µ µ¹
¹º ºÔ
ÔÕ ÕÖ
Ö× ×ß
ßà àë
ëí íî
îï ï
‚ ‚ƒ
ƒ„ „˜
˜™ ™š
š› ›œ
œ Ÿ
Ÿ¢ ¢§
§ª ª²
²³ ³µ
µ¶ ¶·
·¸ ¸»
»½ ½¾
¾À ÀÆ
ÆÉ ÉÌ
ÌÍ ÍÙ
ÙÛ Ûİ
İŞ Şß
ßà àã
ãå åç
çè è€
€ …
…† †‡
‡‰ ‰Š
Š‹ ‹¹
¹º º»
»¼ ¼Á
ÁÃ Ã×
×İ İå
åë ëí
íî îõ
õö öÿ
ÿ€ €ˆ
ˆ‰ ‰‹
‹Œ Œ
 ˜
˜™ ™§
§© ©³
³´ ´½
½¾ ¾Ş
Şß ßà
àá áâ
âã ãå
åæ æé
éê êì
ìí í‹
‹Œ Œ
 “
“” ”
Ÿ Ÿ¡
¡¢ ¢º
º» »¼
¼½ ½¾
¾¿ ¿À
ÀÁ ÁÅ
ÅÇ ÇÈ
ÈÉ ÉÊ
ÊË ËÍ
ÍĞ Ğö
ö ‚
‚ƒ ƒ‡
‡ˆ ˆ—
—˜ ˜
Ÿ ŸÅ
ÅÆ ÆÈ
ÈÉ ÉÊ
ÊÌ ÌÍ
ÍÎ ÎÙ
ÙÚ Úá
áâ âä
äå åÿ
ÿ 
 ”
”• •–
–— —œ
œ 
Ÿ Ÿ®
®° °¿
¿À ÀÅ
ÅÈ ÈÑ
ÑÒ ÒÔ
ÔÙ Ùæ
æç çô
ôõ õı
ış ş€
€ …
…† †‰
‰‹ ‹§
§© ©½
½¾ ¾Ğ
ĞÑ ÑÔ
ÔÕ ÕÖ
Ö× ×ã
ãä äå
åæ æê
êë ëõ
õ 
” ”•
• Ÿ
Ÿ½ ½¾
¾Ä ÄÊ
ÊÏ ÏĞ
ĞÑ ÑÒ
ÒÓ Óİ
İŞ Şâ
âã ãğ
ğñ ñó
óô ôõ
õ¼ ¼Á
ÁÂ ÂÃ
Ãô ôù
ùú úû
û‰ ‰
’ ’–
–¦ ¦å
åÀ  À ˆ!
ˆ!¥$ ¥$ª$
ª$«$ «$¬$
¬$Ó' Ó'Ú'
Ú'Ü' Ü'à'
à'å' å'ê'
ê'ë' ë'ì'
ì'¶( ¶(À*
À*, ,,
,·, ·,¸,
¸,Ø/ Ø/Ù/
Ù/ë/ ë/î/
î/ø/ ø/ù/
ù/ú1 ú1û1
û1å2 å2ô2
ô2õ2 õ2‡3
‡3ˆ3 ˆ3“3
“3”3 ”3À3
À3Á3 Á3Ç3
Ç3È3 È3Ê3
Ê3Ì3 Ì3Î3
Î3Ğ3 Ğ3Ó3
Ó3×3 ×3Ø3
Ø3û3 û3ü3
ü3ÿ3 ÿ3„4
„4…4 …4‹4
‹4Œ4 Œ44
44 4¬4
¬4É5 É5Ê5
Ê5Ğ5 Ğ5Ò5
Ò5Ö5 Ö5Û5
Û5Ş5 Ş5à5
à5á5 á5â5
â5ã5 ã5ä5
ä5å5 å5ô5
ô5‚7 ‚7‡7
‡7ˆ7 ˆ7¨7
¨7â7 â7ğ7
ğ7ü7 ü7„8
„8†8 †8‡8
‡8ˆ8 ˆ8Œ8
Œ8’8 ’8¡8
¡8¬8 ¬8»8
»8Ñ8 Ñ8Ò8
Ò8Ó8 Ó8Ö8
Ö8ï8 ï8ğ8
ğ8ñ8 ñ8ô8
ô8ú8 ú8û8
û8ü8 ü8ı8
ı8ş8 ş8„9
„9…9 …9†9
†9‡9 ‡9ˆ9
ˆ9‰9 ‰9Š9
Š9‹9 ‹99
99 9—9
—9˜9 ˜99
9Ÿ9 Ÿ9 9
 9¡9 ¡9¦9
¦9§9 §9«9
«9¬9 ¬9¯9
¯9°9 °9²9
²9³9 ³9º9
º9¼9 ¼9½9
½9¾9 ¾9¿9
¿9Á9 Á9Ä9
Ä9í9 í9:
:¶? ¶?ÿ?
ÿ?‚B ‚BÏB
ÏBD D D
 DüD üDŠE
ŠEêE êE€F
€FôF ôF”G
”G¨G ¨GåG
åGÀI ÀIÁI
ÁIŠL ŠL¡L
¡LûM "(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72˜file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/PromotionsTab.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version