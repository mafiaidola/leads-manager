°="use client";

/**
 * EditableElement - In-place inline editing with AI magic
 * SEO suggestions extracted to seoSuggestions.ts
 * ~115 lines - Under limit âœ…
 */

import { ReactNode, cloneElement, isValidElement, ReactElement, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useBuilderMode } from "./BuilderModeContext";
import { useEditableState } from "./useEditableState";
import { getSEOSuggestions, SEOSuggestion } from "./seoSuggestions";

interface EditableElementProps {
    elementId: string;
    elementType: "heading" | "text" | "button" | "image" | "link";
    children: ReactNode;
    value?: string;
    onValueChange?: (newValue: string) => void;
    textColor?: string;
    bgColor?: string;
    onTextColorChange?: (color: string) => void;
    onBgColorChange?: (color: string) => void;
    disabled?: boolean;
}

export function EditableElement({ elementId, elementType, children, value = "", onValueChange, bgColor = "transparent", disabled = false }: EditableElementProps) {
    const { isBuilderMode, selectedElementId, hoveredElementId, onElementSelect, onElementHover } = useBuilderMode();
    const { isSelected, isEditing, elementRef, editableRef, lastTapRef, startEditing, cancelEditing, saveEditing } = useEditableState({ elementId, selectedElementId, value, onValueChange });
    const [aiState, setAIState] = useState<"idle" | "generating" | "ready" | "typing">("idle");
    const [visibleSuggestions, setVisibleSuggestions] = useState<SEOSuggestion[]>([]);

    const startAIGeneration = useCallback(async () => {
        setAIState("generating");
        setVisibleSuggestions([]);
        const suggestions = getSEOSuggestions(elementType);
        await new Promise(r => setTimeout(r, 1200));
        for (let i = 0; i < suggestions.length; i++) {
            await new Promise(r => setTimeout(r, 150));
            setVisibleSuggestions(prev => [...prev, suggestions[i]]);
        }
        setAIState("ready");
    }, [elementType]);

    const applyAIWithMagic = useCallback(async (text: string) => {
        setAIState("typing");
        if (!editableRef.current) return;
        editableRef.current.innerText = "";
        for (let i = 0; i <= text.length; i++) {
            await new Promise(r => setTimeout(r, 20 + Math.random() * 20));
            if (editableRef.current) editableRef.current.innerText = text.slice(0, i);
        }
        setAIState("idle");
        if (onValueChange) onValueChange(text);
    }, [onValueChange, editableRef]);

    if (!isBuilderMode || disabled) return <>{children}</>;

    const isHovered = hoveredElementId === elementId && !isSelected;
    const canEdit = ["heading", "text", "button"].includes(elementType);
    const rect = elementRef.current?.getBoundingClientRect();
    const toolbarPos = rect ? { top: rect.top - 45, left: rect.left } : { top: 0, left: 0 };

    const handleClick = (e: React.MouseEvent) => { e.stopPropagation(); onElementSelect(elementId); };
    const handleDoubleClick = (e: React.MouseEvent) => { e.stopPropagation(); if (canEdit) { startEditing(); setAIState("idle"); } };
    const handleTouchEnd = (e: React.TouchEvent) => { const now = Date.now(); if (now - lastTapRef.current < 300) { e.preventDefault(); if (canEdit) startEditing(); } else onElementSelect(elementId); lastTapRef.current = now; };
    const handleKeyDown = (e: React.KeyboardEvent) => { if (aiState === "typing" || aiState === "generating") { e.preventDefault(); return; } if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEditing(); } if (e.key === "Escape") { cancelEditing(); setAIState("idle"); } };

    const getStyle = (): React.CSSProperties => {
        const base: React.CSSProperties = { backgroundColor: bgColor !== "transparent" ? bgColor : undefined };
        if (isEditing) return { ...base, outline: `2px solid ${aiState === "typing" || aiState === "generating" ? "#a855f7" : "#3b82f6"}`, outlineOffset: "2px", borderRadius: "4px" };
        if (isSelected) return { ...base, boxShadow: "inset 0 0 0 2px rgba(59, 130, 246, 0.9)", borderRadius: "2px" };
        if (isHovered) return { ...base, boxShadow: "inset 0 0 0 1px rgba(59, 130, 246, 0.4)", borderRadius: "2px" };
        return base;
    };

    const renderContent = () => {
        if (!isValidElement(children)) return children;
        const child = children as ReactElement<{ style?: React.CSSProperties }>;
        const props: Record<string, unknown> = { style: { ...(child.props.style || {}), cursor: isEditing ? "text" : "pointer", outline: "none" } };
        if (isEditing) { props.contentEditable = true; props.suppressContentEditableWarning = true; props.onKeyDown = handleKeyDown; props.ref = editableRef; }
        return cloneElement(child, props);
    };

    return (
        <>
            <div ref={elementRef} onClick={handleClick} onDoubleClick={handleDoubleClick} onTouchEnd={handleTouchEnd} onMouseEnter={() => onElementHover(elementId)} onMouseLeave={() => onElementHover(null)} className="relative transition-all duration-150 cursor-pointer" style={getStyle()}>
                {renderContent()}
                {isSelected && !isEditing && <div className="absolute -top-5 left-0 px-1.5 py-0.5 bg-blue-500 text-white text-[9px] rounded z-30">{canEdit ? "Double-click to edit" : elementType}</div>}
            </div>
            {isEditing && canEdit && typeof document !== "undefined" && createPortal(
                <div className={`fixed z-[9999] rounded-lg shadow-xl border px-2 py-1.5 flex items-center gap-2 transition-all ${aiState !== "idle" ? "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300" : "bg-white"}`} style={{ top: Math.max(10, toolbarPos.top), left: toolbarPos.left }} onMouseDown={e => e.preventDefault()}>
                    {aiState === "generating" && <span className="text-xs text-purple-600 font-medium flex items-center gap-1"><span className="animate-spin">âš¡</span> SEO AI analyzing...</span>}
                    {aiState === "typing" && <span className="text-xs text-purple-600 font-medium flex items-center gap-1"><span className="animate-bounce">âœ¨</span> Optimizing copy...</span>}
                    {(aiState === "idle" || aiState === "ready") && (<><span className="text-xs text-gray-500">Enter â€¢ Esc</span><button onClick={startAIGeneration} className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 transition-all ${aiState === "ready" ? "bg-purple-500 text-white" : "hover:bg-purple-50 text-purple-500"}`}>âœ¨ SEO AI</button><button onClick={saveEditing} className="p-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs">âœ“</button><button onClick={() => { cancelEditing(); setAIState("idle"); }} className="p-1 bg-gray-200 hover:bg-gray-300 rounded text-xs">âœ•</button></>)}
                    {aiState === "ready" && visibleSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-purple-200 py-1 z-[9999] min-w-[320px]" onMouseDown={e => e.stopPropagation()}>
                            <div className="px-3 py-1.5 text-xs font-medium text-purple-700 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 flex items-center gap-2"><span>ğŸ¯</span> SEO-Optimized Copy</div>
                            {visibleSuggestions.map((s, i) => (<button key={i} onClick={() => applyAIWithMagic(s.text)} className="w-full text-left px-3 py-2 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all border-b border-gray-50 last:border-0"><div className="text-sm font-medium text-gray-800">{s.text}</div><div className="text-[10px] text-purple-500 mt-0.5">ğŸ’¡ {s.seoTip}</div></button>))}
                        </div>
                    )}
                </div>, document.body
            )}
        </>
    );
}
( *cascade08(+*cascade08+- *cascade08-/*cascade08/0 *cascade0806*cascade0868 *cascade088:*cascade08:; *cascade08;?*cascade08?@ *cascade08@E EG*cascade08GH HJ*cascade08JK KL *cascade08LM*cascade08MN*cascade08NO *cascade08OP*cascade08PQ *cascade08QT*cascade08TU *cascade08UYYZ *cascade08Z[[\ *cascade08\] *cascade08]^^_ *cascade08_``a *cascade08ab bg*cascade08gk kl *cascade08lm *cascade08mn *cascade08no*cascade08op *cascade08pr*cascade08rs *cascade08su*cascade08uv *cascade08vw wy*cascade08y{ {}*cascade08}~ *cascade08~ „ *cascade08„…*cascade08…† *cascade08†‡*cascade08‡ˆ *cascade08ˆ‰ *cascade08‰Š*cascade08Š‹ *cascade08‹*cascade08 *cascade08“*cascade08“” *cascade08”–*cascade08–˜ *cascade08˜š*cascade08šœ *cascade08œŸ*cascade08Ÿ¹ *cascade08
¹Î ÎÜ*cascade08
Üã ãú *cascade08úˆ *cascade08ˆ²*cascade08²ì *cascade08ì£*cascade08£è*cascade08èÅ *cascade08Åİ*cascade08İí *cascade08íÍ*cascade08ÍÓ *cascade08Ó³ *cascade08³¸*cascade08¸È *cascade08Èá *cascade08áò *cascade08òó*cascade08ó	 *cascade08		 *cascade08	›	*cascade08›	œ	 *cascade08œ	§	 *cascade08§	±	 *cascade08±	²	*cascade08
²	³	 ³	³	*cascade08³	À	*cascade08À	Â	*cascade08
Â	Ä	 Ä	Å	 *cascade08
Å	Æ	 Æ	Ê	*cascade08Ê	Ë	 *cascade08
Ë	Í	 Í	Î	*cascade08
Î	Ï	 Ï	Ñ	*cascade08Ñ	Ò	 *cascade08Ò	Ô	*cascade08Ô	Ö	 *cascade08Ö	Ù	*cascade08Ù	Û	 *cascade08Û	Ü	*cascade08Ü	İ	 *cascade08İ	Ş	*cascade08Ş	à	 *cascade08
à	ç	 ç	è	*cascade08
è	é	 é	ê	*cascade08
ê	í	 í	ô	 *cascade08ô	ô	*cascade08ô	õ	 *cascade08õ	ö	*cascade08ö	÷	 *cascade08÷	ø	*cascade08ø	ù	 *cascade08ù	ú	*cascade08ú	ü	 *cascade08ü	ÿ	*cascade08ÿ	€
 *cascade08€

*cascade08
„
 *cascade08„
‡
*cascade08‡
‰
 *cascade08‰
‹
*cascade08‹
•
 *cascade08•
–
*cascade08–
¨
 *cascade08¨
©
*cascade08©
ª
 *cascade08ª
¬
*cascade08¬
¯
 *cascade08¯
°
*cascade08°
³
 *cascade08³
µ
*cascade08µ
¹
 *cascade08¹
»
 *cascade08»
½
*cascade08½
À
 *cascade08À
Ã
 *cascade08Ã
Î
 *cascade08Î
Õ
*cascade08Õ
Ü
 *cascade08Ü
á
*cascade08á
í
 *cascade08í
™*cascade08™š *cascade08š*cascade08Ÿ *cascade08Ÿ *cascade08 ­ *cascade08­® *cascade08®¯*cascade08¯² *cascade08²¸*cascade08¸¹ *cascade08¹À*cascade08ÀÄ *cascade08ÄÅ *cascade08ÅÇ*cascade08ÇÈ *cascade08ÈÓ*cascade08ÓÔ *cascade08ÔÕ*cascade08ÕÖ *cascade08Ö×*cascade08×Ø *cascade08ØŞ *cascade08Şâ*cascade08âã *cascade08ãä *cascade08äë*cascade08
ëì ìï *cascade08
ïğ ğ÷ *cascade08÷ÿ *cascade08ÿ… *cascade08…‡*cascade08‡ˆ *cascade08ˆŠ*cascade08ŠŒ *cascade08Œ‘*cascade08‘’ *cascade08’“*cascade08“” *cascade08”–*cascade08–¥ *cascade08¥«*cascade08«» *cascade08»À *cascade08ÀÅ*cascade08ÅÆ *cascade08ÆÌ*cascade08ÌÍ *cascade08Íİ*cascade08İß *cascade08ßõ*cascade08õ€ *cascade08€ƒ*cascade08ƒ„ *cascade08„Š*cascade08Š‹ *cascade08‹Œ*cascade08Œ *cascade08” *cascade08”—*cascade08—šš› *cascade08›¦*cascade08¦­ *cascade08­° *cascade08°± *cascade08±²*cascade08²³ *cascade08³¼ *cascade08¼¿*cascade08¿À *cascade08ÀÁ*cascade08ÁÂ *cascade08ÂÍ*cascade08ÍÎ *cascade08ÎÔ*cascade08ÔÕ *cascade08Õ×*cascade08×Ø *cascade08ØÜ*cascade08Üİ *cascade08İè *cascade08èö *cascade08öø *cascade08ø‰*cascade08‰Š *cascade08Š*cascade08‘ *cascade08‘’*cascade08’” *cascade08”•*cascade08•– *cascade08–œ*cascade08œ *cascade08·*cascade08·¸ *cascade08¸Ä*cascade08ÄÆ *cascade08ÆË*cascade08ËÌ *cascade08ÌÎ*cascade08ÎÏ *cascade08ÏÖ*cascade08Öà *cascade08àâ*cascade08âã *cascade08ãì*cascade08ìî *cascade08îû*cascade08ûü *cascade08üş*cascade08şÿ *cascade08ÿ•*cascade08•– *cascade08–¿*cascade08¿À *cascade08ÀÅ*cascade08ÅÆ *cascade08ÆÓ*cascade08ÓÔ *cascade08ÔÕ*cascade08ÕØ *cascade08Øİ*cascade08İñ *cascade08ñò *cascade08òó*cascade08óô *cascade08ô‚*cascade08‚„ *cascade08„*cascade08 *cascade08•*cascade08•– *cascade08–š*cascade08š› *cascade08›*cascade08 *cascade08¯*cascade08¯° *cascade08°Ï*cascade08ÏĞ *cascade08Ğ×*cascade08×Ø *cascade08Øİ*cascade08İŞ *cascade08Şá*cascade08áâ *cascade08âä*cascade08äå *cascade08åè*cascade08èğ *cascade08ğ *cascade08±*cascade08±µ *cascade08µ¼*cascade08¼½ *cascade08½Ä*cascade08ÄÅ *cascade08ÅÉ*cascade08ÉÑ *cascade08ÑÔ*cascade08ÔÕ *cascade08ÕÖ*cascade08Ö× *cascade08×â*cascade08âã *cascade08ãï*cascade08ïñ *cascade08ñ÷ *cascade08÷øøş *cascade08şÿ *cascade08ÿ*cascade08ƒ *cascade08ƒŒ *cascade08Œ *cascade08® *cascade08®¯ *cascade08¯±*cascade08±² *cascade08²º*cascade08º» *cascade08»Ç*cascade08ÇÈ *cascade08ÈÍ*cascade08ÍÎ *cascade08ÎÖ*cascade08ÖÚ *cascade08Úå*cascade08åğ *cascade08ğú *cascade08úı *cascade08ış*cascade08şÿ *cascade08ÿ*cascade08‚ *cascade08‚ˆ*cascade08ˆŠ *cascade08Š‹*cascade08‹»*cascade08»ä *cascade08äå *cascade08å° *cascade08°Ÿ *cascade08Ÿ *cascade08 Ë *cascade08Ë *cascade08*cascade08‘ *cascade08
‘• •–*cascade08–œ *cascade08
œŸ Ÿ¥ *cascade08¥§*cascade08§¨ *cascade08¨®*cascade08®° *cascade08°±*cascade08±µ *cascade08
µ¸ ¸½ *cascade08½Ğ *cascade08ĞÓ*cascade08Óİ *cascade08İß*cascade08
ßà à *cascade08*cascade08Õ *cascade08ÕÚ *cascade08ÚÛ*cascade08ÛÜ *cascade08Üè*cascade08èí *cascade08íŠ*cascade08Š« *cascade08«‘ *cascade08‘“*cascade08“£ *cascade08£¹*cascade08¹½ *cascade08½¾ *cascade08¾Â *cascade08Âğ *cascade08ğğ*cascade08ğø *cascade08øè*cascade08èî *cascade08
î÷ ÷ş*cascade08ş€ *cascade08€ˆ*cascade08ˆ‰ *cascade08‰‘*cascade08‘’ *cascade08’–*cascade08–— *cascade08—˜ *cascade08˜™ *cascade08
™š šœ*cascade08œ *cascade08Ÿ*cascade08Ÿ  *cascade08
 ¡ ¡¥*cascade08
¥¦ ¦ª*cascade08
ª« «­*cascade08­² *cascade08²³*cascade08³´ *cascade08´¶*cascade08¶· *cascade08·¾*cascade08¾¿ *cascade08¿Ë*cascade08ËÌ *cascade08ÌÑ*cascade08ÑÒ *cascade08ÒÓ*cascade08ÓŞ *cascade08
Şß ßç *cascade08çé *cascade08
é¦ ¦¹ *cascade08¹Â*cascade08Â¯  *cascade08¯ ¸ *cascade08¸ ! *cascade08!”! *cascade08”!˜!*cascade08˜!™!*cascade08™!! *cascade08!¢!*cascade08
¢!¬! ¬!®!*cascade08®!±! *cascade08±!²!*cascade08²!µ! *cascade08µ!¹!*cascade08¹!Ğ! *cascade08Ğ!Ó!*cascade08Ó!Ö! *cascade08Ö!Ú!*cascade08Ú!Û! *cascade08Û!İ!*cascade08İ!Ş! *cascade08Ş!æ!*cascade08æ!ç! *cascade08ç!é!*cascade08é!ë! *cascade08ë!…"*cascade08…"‡" *cascade08‡"›"*cascade08›"œ" *cascade08œ"¤"*cascade08¤"¦" *cascade08¦"­" *cascade08­"±" *cascade08±"²" *cascade08²"¶"*cascade08¶"¸" *cascade08¸"Â"*cascade08Â"Ã" *cascade08Ã"Ë"*cascade08Ë"Õ" *cascade08Õ"Ø"*cascade08Ø"Ù" *cascade08Ù"Û"*cascade08Û"ã"*cascade08ã"ä" *cascade08ä"ç"*cascade08ç"è" *cascade08è"ê"*cascade08ê"ë" *cascade08ë"ì"*cascade08ì"ñ" *cascade08ñ"õ"*cascade08õ"÷" *cascade08÷"ù"*cascade08ù"ú" *cascade08ú"#*cascade08#‚# *cascade08‚#Š# *cascade08Š##*cascade08## *cascade08#•#*cascade08•#–# *cascade08–#˜#*cascade08˜#›# *cascade08›#œ# *cascade08œ#£#*cascade08£#¯#*cascade08¯#³# *cascade08³#Á#*cascade08Á#Â# *cascade08Â#Å#*cascade08Å#Æ# *cascade08Æ#Ç#*cascade08Ç#È# *cascade08È#Ì#*cascade08Ì#Í# *cascade08Í#Î#*cascade08Î#Ğ# *cascade08Ğ#Ñ#*cascade08Ñ#Ò# *cascade08Ò#Ø#*cascade08Ø#Ú# *cascade08Ú#á#*cascade08á#÷# *cascade08÷#ø#*cascade08ø#ù# *cascade08ù#ú# *cascade08ú#$ *cascade08$‚$ *cascade08‚$ƒ$*cascade08ƒ$„$ *cascade08„$ˆ$*cascade08ˆ$Œ$ *cascade08Œ$$*cascade08$‘$ *cascade08‘$˜$*cascade08˜$™$ *cascade08™$£$*cascade08£$¥$ *cascade08¥$ª$*cascade08ª$«$ *cascade08«$¸$*cascade08¸$º$ *cascade08º$½$*cascade08½$¾$ *cascade08¾$Å$*cascade08Å$Æ$ *cascade08Æ$Õ$*cascade08Õ$Ö$ *cascade08Ö$×$*cascade08×$Ø$ *cascade08Ø$Ú$*cascade08Ú$Û$ *cascade08Û$Ü$*cascade08Ü$İ$ *cascade08İ$ß$*cascade08ß$à$ *cascade08à$â$*cascade08â$ã$ *cascade08ã$æ$*cascade08æ$ç$ *cascade08ç$ğ$*cascade08ğ$ñ$ *cascade08ñ$ò$*cascade08ò$ó$ *cascade08ó$ÿ$ *cascade08ÿ$€% *cascade08€%‚%*cascade08‚%Š% *cascade08Š%%*cascade08%‘% *cascade08‘%“%*cascade08“%•% *cascade08•%—%*cascade08—%™% *cascade08™%›%*cascade08›%œ% *cascade08œ% %*cascade08 %¡% *cascade08¡%¦%*cascade08¦%§% *cascade08§%±%*cascade08±%²% *cascade08²%´%*cascade08´%¹% *cascade08¹%Â%*cascade08Â%Ê% *cascade08Ê%Í%*cascade08Í%Õ% *cascade08Õ%ï%*cascade08ï%ò% *cascade08ò%ù%*cascade08ù%û% *cascade08û%&*cascade08&‚& *cascade08‚&Œ&*cascade08Œ&& *cascade08&&*cascade08&& *cascade08&’&*cascade08’&”& *cascade08”&£&*cascade08£&¤& *cascade08¤&´&*cascade08´&¶& *cascade08¶&¼&*cascade08¼&½& *cascade08½&É&*cascade08É&Ê& *cascade08Ê&Ú&*cascade08Ú&Û& *cascade08Û&ˆ'*cascade08ˆ'‰' *cascade08‰'¿'*cascade08¿'À' *cascade08À'Ã'*cascade08Ã'Å' *cascade08Å'Æ'*cascade08Æ'Ç' *cascade08Ç'ã'*cascade08ã'ä' *cascade08ä'í'*cascade08í'î' *cascade08î'ï'*cascade08ï'€( *cascade08€(‚(*cascade08‚(ƒ( *cascade08ƒ(…(*cascade08…(†( *cascade08†(‰(*cascade08‰(( *cascade08((*cascade08(¢( *cascade08¢(­(*cascade08­(®( *cascade08®(°(*cascade08°(±( *cascade08±(²(*cascade08²(´( *cascade08´(µ(*cascade08µ(·( *cascade08·(¹(*cascade08¹(»( *cascade08»(Å(*cascade08Å(Æ( *cascade08Æ(Ë(*cascade08Ë(Í( *cascade08Í(Õ(*cascade08Õ(Ø( *cascade08Ø(Ş(*cascade08Ş(ß( *cascade08ß(à(*cascade08à(á( *cascade08á(å(*cascade08å(æ( *cascade08æ(ì(*cascade08ì(í( *cascade08í(ó(*cascade08ó(ô( *cascade08ô(ÿ(*cascade08ÿ(€) *cascade08€)Š)*cascade08Š)‹) *cascade08‹)•)*cascade08•)–) *cascade08–))*cascade08)) *cascade08)¬)*cascade08¬)­) *cascade08­)®)*cascade08®)¯) *cascade08¯)¼)*cascade08¼)½) *cascade08½)¿)*cascade08¿)À) *cascade08À)Å)*cascade08Å)Æ) *cascade08Æ)Ç)*cascade08Ç)È) *cascade08È)Õ)*cascade08Õ)Ö) *cascade08Ö)Ù)*cascade08Ù)Ú) *cascade08Ú)Û)*cascade08Û)è) *cascade08è)î)*cascade08î)ï) *cascade08
ï)÷) ÷)ı)*cascade08ı)ş)*cascade08ş)**cascade08
*‚* ‚*ˆ**cascade08ˆ*Š* *cascade08Š***cascade08** *cascade08*›**cascade08›*œ* *cascade08œ*£**cascade08£*¤* *cascade08¤*¦**cascade08¦*¨* *cascade08¨*«**cascade08
«*­* ­*¯**cascade08
¯*°* °*³**cascade08
³*´* ´*¶**cascade08
¶*·* ·*¹**cascade08
¹*½* ½*À**cascade08
À*Á* Á*Ä**cascade08Ä*Î* *cascade08Î*×**cascade08×*Ø* *cascade08Ø*Ú* *cascade08Ú*ã**cascade08ã*ä* *cascade08ä*æ**cascade08æ*ô* *cascade08ô*÷* *cascade08÷*ÿ**cascade08ÿ*€+ *cascade08€+‚+*cascade08‚+ƒ+ *cascade08ƒ+‰+*cascade08‰+Š+ *cascade08Š+‹+*cascade08‹++ *cascade08++*cascade08++ *cascade08+š+ *cascade08š+œ+*cascade08œ+¢+ *cascade08¢+£+ *cascade08£+ª+*cascade08ª+«+ *cascade08«+¯+*cascade08¯+°+ *cascade08°+´+ *cascade08´+Æ+ *cascade08Æ+Ç+*cascade08Ç+È+ *cascade08È+Ó+*cascade08Ó+Ô+ *cascade08Ô+Ø+*cascade08Ø+Û+ *cascade08Û+Ü+ *cascade08Ü+©,*cascade08©,ª, *cascade08ª,¯, *cascade08¯,²,*cascade08²,³, *cascade08³,·,*cascade08·,¸, *cascade08¸,¹,*cascade08¹,», *cascade08»,¼,*cascade08¼,½, *cascade08½,Ë,*cascade08Ë,Ì, *cascade08Ì,Ñ,*cascade08Ñ,Ó, *cascade08Ó,×,*cascade08×,Ø, *cascade08Ø,Ù,*cascade08Ù,Ú, *cascade08Ú,å,*cascade08å,æ, *cascade08æ,ë,*cascade08ë,ì, *cascade08ì,î,*cascade08
î,ï, ï,ó,*cascade08ó,ô, *cascade08ô,ù,*cascade08ù,ú, *cascade08ú,ü,*cascade08ü,ı, *cascade08ı,ˆ-*cascade08ˆ-‰- *cascade08‰-‹-*cascade08‹-Œ- *cascade08Œ-•-*cascade08
•-- -ª- *cascade08ª-«- *cascade08«-¬-*cascade08¬-­- *cascade08­-¿-*cascade08¿-Â- *cascade08Â-Ã-*cascade08Ã-Ä- *cascade08Ä-Æ-*cascade08Æ-•. *cascade08•.¿. *cascade08¿.Ã.Ã.Æ. *cascade08Æ.Ç.Ç.È. *cascade08È.Ì.Ì.Ú. *cascade08Ú.ï. *cascade08ï.÷.*cascade08÷.ø. *cascade08ø.û.*cascade08û.ü. *cascade08ü.„/*cascade08„/…/ *cascade08…/‡/*cascade08‡/ˆ/ *cascade08ˆ//*cascade08// *cascade08/ /*cascade08 /¡/ *cascade08¡/°/*cascade08°/±/ *cascade08±/Á/*cascade08Á/Â/ *cascade08Â/Ö/*cascade08Ö/‚0 *cascade08‚0‡0‡0ˆ0 *cascade08ˆ0‰0‰0‹0 *cascade08‹0Œ0Œ00 *cascade080000 *cascade080‘0‘0”0 *cascade08”0œ0*cascade08œ0±0 *cascade08±0º0*cascade08º0»0 *cascade08»0¾0*cascade08¾0¿0 *cascade08¿0Å0*cascade08Å0Æ0 *cascade08Æ0È0*cascade08È0Ê0 *cascade08Ê0Ğ0*cascade08Ğ0Ñ0 *cascade08Ñ0Ô0*cascade08Ô0Õ0 *cascade08Õ0Ü0*cascade08Ü0Ş0 *cascade08Ş0à0*cascade08à0ä0 *cascade08ä0ò0 *cascade08
ò0ó0 ó0õ0*cascade08
õ0ö0 ö0ƒ1*cascade08
ƒ1„1 „11*cascade08
11 1‘1*cascade08
‘1’1 ’1˜1 *cascade08˜1™1 *cascade08™11*cascade081Ÿ1 *cascade08Ÿ1 1 *cascade08 1±1 *cascade08±1³1 *cascade08³1¶1*cascade08¶1¸1 *cascade08¸1À1*cascade08À1Á1 *cascade08Á1Â1*cascade08Â1Å1 *cascade08Å1Æ1 *cascade08Æ1Ì1*cascade08Ì1Í1 *cascade08Í1Ô1*cascade08Ô1Õ1 *cascade08Õ1á1*cascade08á1â1 *cascade08â1ã1*cascade08ã1å1*cascade08å1æ1 *cascade08æ1ì1*cascade08ì1î1 *cascade08î1õ1*cascade08õ1÷1 *cascade08÷1ø1*cascade08ø1ù1 *cascade08ù1ÿ1*cascade08ÿ1€2 *cascade08€2„2*cascade08„2…2 *cascade08…2Œ2 *cascade08Œ2›2*cascade08›22 *cascade082°2*cascade08°2¹2 *cascade08¹2º2*cascade08º2¾2 *cascade08¾2¿2*cascade08¿2Ç2 *cascade08Ç2Ë2*cascade08Ë2Î2 *cascade08
Î2Ğ2 Ğ2Ñ2 *cascade08Ñ2Ò2*cascade08Ò2Ó2 *cascade08Ó2ä2*cascade08ä2å2*cascade08
å2æ2 æ2ë2*cascade08ë2ì2 *cascade08ì2ó2*cascade08ó2õ2 *cascade08õ2ø2*cascade08
ø2ÿ2 ÿ2‚3 *cascade08‚3‰3*cascade08‰3Š3 *cascade08Š3‹3*cascade08‹3‹5 *cascade08‹5¥5 *cascade08¥5¦5 *cascade08¦5¹5*cascade08¹5½5 *cascade08½5À5*cascade08À5Á5 *cascade08Á5É5*cascade08É5Ê5 *cascade08Ê5Ë5*cascade08Ë5Ì5 *cascade08Ì5Ò5*cascade08Ò5Ô5 *cascade08Ô5Ú5*cascade08Ú5ß5 *cascade08ß5ë5*cascade08ë5ì5 *cascade08ì5÷5 *cascade08÷5ø5 *cascade08ø5ù5*cascade08ù5ú5 *cascade08ú5†6*cascade08†6‡6 *cascade08‡6ˆ6*cascade08ˆ6‰6 *cascade08‰6Œ6*cascade08Œ66 *cascade0866*cascade0866 *cascade086’6*cascade08’6“6 *cascade08“6–6*cascade08–6—6 *cascade08—6™6*cascade08™6š6 *cascade08š6 6*cascade08 6¡6 *cascade08¡6¥6*cascade08¥6¦6 *cascade08¦6®6*cascade08®6¯6 *cascade08¯6¹6*cascade08¹6º6 *cascade08º6Ã6*cascade08Ã6Ä6 *cascade08Ä6Ê6*cascade08Ê6Ë6 *cascade08Ë6Ü6*cascade08Ü6İ6 *cascade08İ6á6*cascade08á6â6 *cascade08â6ê6*cascade08ê6ë6 *cascade08ë6ò6 *cascade08ò6ó6ó6ô6*cascade08ô6ù6 *cascade08ù67 *cascade087„7*cascade08„7…7 *cascade08…7‡7 *cascade08‡7ˆ7*cascade08ˆ7‰7 *cascade08‰7‹7*cascade08‹7Œ7 *cascade08Œ77 *cascade0877*cascade087‘7 *cascade08‘7“7*cascade08“7”7 *cascade08”7™7*cascade08™7š7 *cascade08š77*cascade087 7 *cascade08 7¡7*cascade08¡7­7*cascade08­7®7 *cascade08®7°7 *cascade08°7»7 *cascade08»7¼7 *cascade08¼7Ã7*cascade08Ã7Î7 *cascade08Î7Ú7*cascade08Ú7Ü7 *cascade08Ü7İ7*cascade08İ7Ş7 *cascade08Ş7à7*cascade08à7á7 *cascade08á7ã7*cascade08ã7ä7 *cascade08ä7å7 *cascade08å7æ7*cascade08æ7ç7 *cascade08ç7÷7*cascade08÷7ø7 *cascade08ø7ı7*cascade08ı7ş7 *cascade08ş78*cascade088‚8 *cascade08‚88*cascade0888 *cascade088‘8 *cascade08‘8”8*cascade08”8–8 *cascade08–8—8*cascade08—8™8 *cascade08™8œ8 *cascade08œ8¯8*cascade08¯8°8 *cascade08°8³8 *cascade08³8´8*cascade08´8µ8 *cascade08µ8¸8*cascade08¸8â8 *cascade08â8ã8 *cascade08ã8ç8ç8î8*cascade08î8ï8 *cascade08ï8õ8õ8ö8 *cascade08ö8ú8ú8ı8 *cascade08ı8ş8ş8ÿ8 *cascade08ÿ899‡9 *cascade08‡9“9*cascade08“9”9 *cascade08”9¥9 *cascade08¥9§9*cascade08§9¨9 *cascade08¨9­9*cascade08­9±9 *cascade08±9³9 *cascade08³9Ñ9 *cascade08Ñ9Ò9 *cascade08Ò9Ú9*cascade08Ú9Û9 *cascade08Û9í9 *cascade08í9ö9*cascade08ö9ø9 *cascade08ø9ı9ı9ˆ: *cascade08ˆ:Š: *cascade08Š:“:*cascade08“:”: *cascade08”:•:*cascade08•:–: *cascade08–:š:*cascade08š:›: *cascade08›:¢:*cascade08¢:£: *cascade08£:¯: *cascade08¯:È:*cascade08È:Ì: *cascade08Ì:Î: *cascade08Î:Ñ: *cascade08Ñ:ò: *cascade08
ò:ö: ö:÷: *cascade08÷:ø:ø:ù: *cascade08ù:ş:ş:€; *cascade08€;‰;‰;Š; *cascade08Š;Œ;Œ;; *cascade08
;Ÿ; Ÿ; ; *cascade08 ;¦;¦;¨; *cascade08¨;°;°;±; *cascade08±;³;³;´; *cascade08´;¹;¹;º; *cascade08º;»;»;¼; *cascade08¼;½;½;¾; *cascade08¾;¿; *cascade08¿;Ä;Ä;Æ; *cascade08Æ;È;È;É; *cascade08É;Í;Í;Î; *cascade08Î;Ó;Ó;Ô; *cascade08Ô;Ù;Ù;Ú; *cascade08Ú;Û; *cascade08Û;Ş;Ş;ê; *cascade08ê;î;î;ï; *cascade08ï;ğ;ğ;ñ; *cascade08ñ;õ;õ;÷; *cascade08÷;ù;*cascade08ù;ü; *cascade08ü;‚< *cascade08‚<ƒ<ƒ<…< *cascade08…<Œ<Œ<< *cascade08<“<“<•< *cascade08•<œ<œ<< *cascade08<£<£<­< *cascade08­<®< *cascade08®<¯< *cascade08¯<¸<*cascade08¸<¼<*cascade08¼<½< *cascade08½<È< *cascade08È<Ê<*cascade08Ê<Ë< *cascade08Ë<Î<*cascade08Î<Û< *cascade08Û<İ< *cascade08İ<á<*cascade08á<ã< *cascade08ã<ä< *cascade08ä<å<*cascade08å<ö<*cascade08ö<ü< *cascade08ü<ı< *cascade08ı<ı<*cascade08ı<‹= *cascade08‹=™=*cascade08™=š= *cascade08š=£= *cascade08£=¥= *cascade08¥=¥=*cascade08¥=¯= *cascade08¯=¯=¯=°= *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72¢file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/EditableElement.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version