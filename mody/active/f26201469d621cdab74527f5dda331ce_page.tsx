ğd"use client";
// Template Builder Page - Enhanced with footer-pages integration

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBuilderState } from "./useBuilderState";
import { BuilderCanvas } from "./BuilderCanvas";
import { MobileToolbar } from "./MobileToolbar";
import { MobileBottomSheets } from "./MobileBottomSheets";
import { DeviceMode, getCanvasWidth } from "./DeviceToggle";
import { ImagePicker } from "./ImagePicker";
import { LeftSidebar } from "./LeftSidebar";
import { useThemeState } from "./theme";
import { useSaveState } from "./storage/useSaveState";
import { useInitialLoad } from "./useInitialLoad";
import { BuilderAIAssistant, useAIAssistantProps } from "./ai-assistant";
import { BuilderToast } from "./BuilderToast";
import { DesktopHeader } from "./DesktopHeader";
import { CategoriesProvider } from "./CategoriesContext";
import { BuilderModals } from "./BuilderModals";
import { SettingsPanel } from "./SettingsPanel";

export default function TemplateBuilderPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get storeId from URL - when present, enables API mode
    const storeId = searchParams.get("storeId");

    const { pages, addPage, deletePage, duplicatePage, renamePage, reorderPages, togglePageVisibility, updatePageSEO, sections, allPageSections, selectedId, selectedSection, currentPageId, activeNavId, setSelectedId, handleNavClick, moveSection, updateSettings, deleteSection, addSection, reorderSection, duplicateSection, selectedElementId, hoveredElementId, handleElementSelect, handleElementHover, undo, redo, canUndo, canRedo, loadState } = useBuilderState();
    const { theme, applyPreset, setTheme } = useThemeState();

    const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
    const [mobileSheet, setMobileSheet] = useState<"sections" | "theme" | "settings" | null>(null);
    const [sidebarTab, setSidebarTab] = useState<"pages" | "sections" | "theme">("pages");
    const [showPublish, setShowPublish] = useState(false);
    const [showSectionLib, setShowSectionLib] = useState(false);
    const [showImagePicker, setShowImagePicker] = useState(false);
    const [imageSectionId, setImageSectionId] = useState<string | null>(null);
    const [aiTrigger, setAiTrigger] = useState(0);
    const [seoPageId, setSeoPageId] = useState<string | null>(null);
    const [subdomain, setSubdomain] = useState("luxe-kicks");
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [deletePageId, setDeletePageId] = useState<string | null>(null);
    const [pendingSubdomain, setPendingSubdomain] = useState<string | null>(null);

    // Calculate pages linked from footer
    const footerLinkedPages = useMemo(() => {
        const footer = sections.find(s => s.type === "footer");
        if (!footer) return [];
        const extractUrls = (linksJson: unknown): string[] => {
            if (typeof linksJson !== "string") return [];
            try { return (JSON.parse(linksJson) as { url: string }[]).map(l => l.url.replace(/^\//, "")).filter(Boolean); } catch { return []; }
        };
        return [...extractUrls(footer.settings.shopLinks), ...extractUrls(footer.settings.supportLinks), ...extractUrls(footer.settings.companyLinks)];
    }, [sections]);

    const { aiAssistantProps } = useAIAssistantProps({ selectedId, selectedSectionName: selectedSection?.name, updateSettings, addSection: (t, n) => addSection(t as import("./types").SectionType, n) });
    const seoPage = seoPageId ? pages.find(p => p.id === seoPageId) || null : null;

    // Pass storeId to enable API mode - when storeId is present, saves to Supabase instead of localStorage
    const { save, publish, lastSaved, isSaving, isDirty, isPublishing, isApiMode } = useSaveState({
        pages, allPageSections, theme, currentPageId, subdomain,
        storeId: storeId || undefined,  // Enable API mode when storeId is in URL
        autoSave: false
    });

    const requestSubdomainChange = (newSubdomain: string) => { if (newSubdomain !== subdomain) setPendingSubdomain(newSubdomain); };
    const confirmSubdomainChange = () => { if (!pendingSubdomain) return; setSubdomain(pendingSubdomain); setToastMessage(`âœ“ Domain updated to ${pendingSubdomain}.egybag.store`); try { window.history.pushState({}, "", `?subdomain=${pendingSubdomain}`); } catch (e) { } save(); setPendingSubdomain(null); };
    const openImagePicker = (id: string) => { setImageSectionId(id); setShowImagePicker(true); };
    const triggerAI = (id: string) => { setSelectedId(id); setAiTrigger(t => t + 1); };
    const triggerPageAI = (pageId: string) => { handleNavClick(pageId.toUpperCase(), pageId); setAiTrigger(t => t + 1); setToastMessage(`ğŸª„ AI ready for ${pageId} page`); };
    const handleImageSelect = (url: string) => { if (imageSectionId === "navigation") { const nav = sections.find(s => s.type === "navigation"); if (nav) updateSettings(nav.id, "logoUrl", url); } else { const tid = imageSectionId || selectedId; if (tid) { const sec = sections.find(s => s.id === tid); updateSettings(tid, sec?.type === "hero" ? "imageUrl" : "backgroundImage", url); } } };

    // Enhanced: Add section with feedback
    const addSectionWithFeedback = (type: string) => {
        const sectionType = type as import("./types").SectionType;
        // Check for protected types
        if (type === "footer" || type === "navigation") {
            const exists = sections.some(s => s.type === type);
            if (exists) {
                setToastMessage(`âš ï¸ ${type.charAt(0).toUpperCase() + type.slice(1)} already exists`);
                return;
            }
        }
        addSection(sectionType, type);
        setToastMessage(`âœ… ${type.charAt(0).toUpperCase() + type.slice(1)} section added`);
    };

    // Enhanced: Delete section with feedback for protected types
    const deleteSectionWithFeedback = (id: string) => {
        const section = sections.find(s => s.id === id);
        if (section && (section.type === "footer" || section.type === "navigation")) {
            setToastMessage(`â›” ${section.type.charAt(0).toUpperCase() + section.type.slice(1)} cannot be deleted, only customized`);
            return;
        }
        deleteSection(id);
    };

    // Use extracted hook for initial data loading
    const { isLoading, loadError } = useInitialLoad({
        storeId,
        onLoad: loadState,
        onThemeLoad: setTheme,
        onSubdomainLoad: (s) => { setSubdomain(s); try { window.history.replaceState({}, "", `?subdomain=${s}`); } catch { } },
    });
    useEffect(() => { if (loadError) setToastMessage(`âš ï¸ ${loadError}`); }, [loadError]);
    useEffect(() => { const h = (e: BeforeUnloadEvent) => { if (isDirty) { e.preventDefault(); e.returnValue = ""; } }; window.addEventListener("beforeunload", h); return () => window.removeEventListener("beforeunload", h); }, [isDirty]);

    // Lock body scroll to prevent browser scrollbar - scroll should only happen INSIDE canvas
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    return (
        <CategoriesProvider>
            <div className="h-screen bg-gray-100 flex flex-col md:flex-row overflow-hidden">
                <LeftSidebar theme={theme} pages={pages} currentPageId={currentPageId} sections={sections} selectedId={selectedId} activeTab={sidebarTab} onTabChange={setSidebarTab} onBack={() => router.push("/newlayout1")} onPageSelect={(id, name) => handleNavClick(name.toUpperCase(), id)} onPageAdd={() => addPage(`page-${Date.now()}`, "New Page")} onPageDelete={setDeletePageId} onPageDuplicate={duplicatePage} onPageRename={renamePage} onPageReorder={reorderPages} onPageToggleVisibility={togglePageVisibility} onSectionSelect={setSelectedId} onAddSection={addSectionWithFeedback} onSectionDragStart={(e, type) => e.dataTransfer.setData("sectionType", type)} onThemePreset={applyPreset} onPageSEO={setSeoPageId} onPageAIGenerate={triggerPageAI} footerLinkedPages={footerLinkedPages} />

                <div id="builder-canvas-container" className="flex-1 flex flex-col overflow-hidden">
                    <div className="shrink-0 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
                        <DesktopHeader isSaving={isSaving} isDirty={isDirty} lastSaved={lastSaved} save={save} canUndo={canUndo} canRedo={canRedo} undo={undo} redo={redo} deviceMode={deviceMode} setDeviceMode={setDeviceMode} subdomain={subdomain} onSubdomainChange={requestSubdomainChange} onPublish={() => setShowPublish(true)} onAddSection={() => setShowSectionLib(true)} />
                        <div className="md:hidden flex items-center justify-between mt-2"><button onClick={() => router.push("/newlayout1")} className="text-gray-600">â† Back</button><h1 className="font-bold text-gray-800">Edit Template</h1><button onClick={() => setShowSectionLib(true)} className="text-red-500">+ Add</button></div>
                    </div>
                    <div className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50">
                        <BuilderCanvas sections={sections} selectedId={selectedId} currentPageId={currentPageId} activeNavId={activeNavId} pages={pages} onNavClick={handleNavClick} onSelect={setSelectedId} onMoveUp={id => moveSection(id, "up")} onMoveDown={id => moveSection(id, "down")} onDelete={deleteSectionWithFeedback} onDuplicate={duplicateSection} onImagePick={openImagePicker} canvasWidth={getCanvasWidth(deviceMode)} deviceMode={deviceMode} onUpdateSettings={updateSettings} onReorder={reorderSection} onSectionDrop={addSectionWithFeedback} selectedElementId={selectedElementId} hoveredElementId={hoveredElementId} onElementSelect={handleElementSelect} onElementHover={handleElementHover} subdomain={subdomain} theme={theme} />
                    </div>
                </div>

                <SettingsPanel selectedSection={selectedSection} onClose={() => setSelectedId(null)} onUpdate={(k, v) => updateSettings(selectedSection!.id, k, v)} onLogoUpload={() => openImagePicker("navigation")} onNavigateToPage={(pageId) => handleNavClick(pageId.toUpperCase(), pageId)} onCreatePage={(pageId) => { addPage(pageId, pageId.charAt(0).toUpperCase() + pageId.slice(1)); handleNavClick(pageId.toUpperCase(), pageId); }} existingPages={pages.map(p => p.id)} />

                <MobileToolbar onSections={() => setMobileSheet("sections")} onTheme={() => setMobileSheet("theme")} onSettings={() => setMobileSheet("settings")} onPublish={() => setShowPublish(true)} selectedSection={selectedId} />
                <MobileBottomSheets sheet={mobileSheet} onClose={() => setMobileSheet(null)} sections={sections} selectedId={selectedId} onSelectSection={setSelectedId} selectedSection={selectedSection} theme={theme} onApplyTheme={applyPreset} onUpdateSettings={(k, v) => selectedSection && updateSettings(selectedSection.id, k, v as string | number | boolean)} onLogoUpload={() => openImagePicker("navigation")} />

                <ImagePicker isOpen={showImagePicker} onClose={() => { setShowImagePicker(false); setImageSectionId(null); }} onSelect={handleImageSelect} currentImage={(imageSectionId ? sections.find(s => s.id === imageSectionId)?.settings.imageUrl || sections.find(s => s.id === imageSectionId)?.settings.backgroundImage : selectedSection?.settings.imageUrl || selectedSection?.settings.backgroundImage) as string} />
                <BuilderModals showSectionLib={showSectionLib} onCloseSectionLib={() => setShowSectionLib(false)} onAddSection={addSectionWithFeedback} showPublish={showPublish} onClosePublish={() => setShowPublish(false)} onSave={save} onPublish={async () => { if (isApiMode) { const ok = await publish(); setToastMessage(ok ? "âœ… Published to store!" : "âš ï¸ Publish failed"); } router.push("/newlayout1"); }} lastSaved={lastSaved} isDirty={isDirty} isSaving={isSaving} storeUrl={`${subdomain}.egybag.store`} deletePageId={deletePageId} pages={pages} onConfirmDelete={() => { if (deletePageId) { deletePage(deletePageId); setDeletePageId(null); } }} onCancelDelete={() => setDeletePageId(null)} pendingSubdomain={pendingSubdomain} subdomain={subdomain} onConfirmDomain={confirmSubdomainChange} onCancelDomain={() => setPendingSubdomain(null)} seoPageId={seoPageId} seoPage={seoPage} onCloseSEO={() => setSeoPageId(null)} onUpdateSEO={(f, v) => updatePageSEO(seoPageId!, f, v)} />

                <BuilderAIAssistant storeName={subdomain.toUpperCase().replace(/-/g, ' ')} currentPage={currentPageId} sections={sections.map(s => s.name)} pages={pages.map(p => p.name)} {...aiAssistantProps} triggerOpen={aiTrigger} />
                <BuilderToast message={toastMessage} onClose={() => setToastMessage(null)} />
            </div>
        </CategoriesProvider>
    );
}
) *cascade08),*cascade08,- *cascade08-.*cascade08.2 *cascade0824*cascade0845*cascade0858*cascade0889 *cascade089C*cascade08CF *cascade08FG*cascade08GH *cascade08HO*cascade08Om *cascade08mv*cascade08v™ *cascade08™ª*cascade08ª‹ *cascade08‹¾¾ô *cascade08ô€*cascade08€ *cascade08ƒ*cascade08ƒ„ *cascade08„†*cascade08†‘ *cascade08‘’*cascade08’“ *cascade08“¢*cascade08¢¥ *cascade08¥® *cascade08®°*cascade08°± *cascade08±´*cascade08´º *cascade08º»*cascade08»Æ *cascade08ÆÈ*cascade08ÈÉ *cascade08ÉÌ*cascade08ÌÒ *cascade08ÒÓ*cascade08ÓÖ *cascade08Öß *cascade08ßâ*cascade08âã *cascade08ãå*cascade08åè *cascade08èê*cascade08êë *cascade08ëì*cascade08ì÷ *cascade08÷ú*cascade08úû *cascade08ûı*cascade08ıÿ *cascade08ÿ*cascade08ƒ *cascade08ƒ„*cascade08„‡ *cascade08‡× *cascade08×ó	*cascade08ó	¥ *cascade08¥··ì *cascade08ìù*cascade08ù÷ *cascade08÷ÂÂå *cascade08å¸*cascade08¸¹ *cascade08¹´*cascade08´Ã *cascade08ÃË*cascade08ËÓ *cascade08ÓÀ*cascade08ÀĞ *cascade08ĞÙ*cascade08Ù÷ *cascade08÷*cascade08£ *cascade08£«*cascade08«ä *cascade08ä¾*cascade08¾É *cascade08ÉÊ*cascade08ÊË *cascade08ËÍ*cascade08ÍÎ *cascade08ÎÒ*cascade08ÒÜ *cascade08ÜŞ *cascade08Şß *cascade08ßã*cascade08ãä *cascade08äé*cascade08é—  *cascade08— · *cascade08· º  *cascade08º Á *cascade08Á Ú  *cascade08Ú Æ! *cascade08Æ!Ø! *cascade08Ø!Ü!*cascade08Ü!ğ! *cascade08ğ!õ!*cascade08õ!ö! *cascade08ö!÷!*cascade08÷!Ç" *cascade08Ç"È"*cascade08È"É" *cascade08É"Î"*cascade08Î"í" *cascade08í"ï"*cascade08ï"ğ" *cascade08ğ"ô" *cascade08ô"õ" *cascade08õ"ø"*cascade08ø"ù" *cascade08ù"‡#*cascade08‡#ˆ# *cascade08ˆ#Œ#*cascade08Œ#Ì$ *cascade08Ì$ü%*cascade08ü%€& *cascade08€&ƒ&*cascade08ƒ&„& *cascade08„&‹&*cascade08‹&Œ& *cascade08Œ&”&*cascade08”&—& *cascade08—&š&*cascade08š&›& *cascade08›&¦&*cascade08¦&­& *cascade08­&¯&*cascade08¯&°& *cascade08°&¿&*cascade08¿&À& *cascade08À&Ã&*cascade08Ã&Ä& *cascade08Ä&Ñ&*cascade08Ñ&Ò& *cascade08Ò&Ó&*cascade08Ó&Ú& *cascade08Ú&Û&*cascade08Û&İ& *cascade08İ&á&*cascade08á&â& *cascade08â&ì&*cascade08ì&í& *cascade08í&ï&*cascade08ï&ñ& *cascade08ñ&ò&*cascade08ò&ó& *cascade08ó&‡'*cascade08‡'ˆ' *cascade08ˆ'’'*cascade08’'“' *cascade08“'˜'*cascade08˜'™' *cascade08™'¡'*cascade08¡'¢' *cascade08¢'©'*cascade08©'ª' *cascade08ª'Ë'*cascade08Ë'Ì' *cascade08Ì'Ó'*cascade08Ó'Ô' *cascade08Ô'Õ'*cascade08Õ'Ö' *cascade08Ö'Ø'*cascade08Ø'Ù' *cascade08Ù'Û'*cascade08Û'Ü' *cascade08Ü'ê'*cascade08ê'ì' *cascade08ì'ô'*cascade08ô'õ' *cascade08õ'ø'*cascade08ø'ú' *cascade08ú'û'*cascade08û'ü' *cascade08ü'(*cascade08(‚( *cascade08‚(…(*cascade08…(†( *cascade08†(‡(*cascade08‡(ˆ( *cascade08ˆ(—(*cascade08—(˜( *cascade08˜(š(*cascade08š(›( *cascade08›(Ÿ(*cascade08Ÿ( ( *cascade08 (¥(*cascade08¥(¦( *cascade08¦(©(*cascade08©(ª( *cascade08ª(¸(*cascade08¸(¹( *cascade08¹(¾(*cascade08¾(¿( *cascade08¿(Ø(*cascade08Ø(Ù( *cascade08Ù(Ú(*cascade08Ú(Û( *cascade08Û(ì(*cascade08ì(í( *cascade08í(ø(*cascade08ø(ù( *cascade08ù(ú(*cascade08ú(û( *cascade08û(‚)*cascade08‚)‡) *cascade08‡)Œ.*cascade08Œ.Ş1*cascade08Ş1á1 *cascade08á1â1*cascade08â1æ1 *cascade08æ1ç1*cascade08ç1ï1 *cascade08ï1ğ1*cascade08ğ1ò1 *cascade08ò1ó1*cascade08ó1€2 *cascade08€2‚2*cascade08‚2ƒ2 *cascade08ƒ2„2*cascade08„2…2 *cascade08…2†2*cascade08†2ˆ2 *cascade08ˆ2‰2*cascade08‰2‹2 *cascade08‹2Œ2*cascade08Œ2›2 *cascade08›2œ2*cascade08œ2Ÿ2 *cascade08Ÿ2¡2*cascade08¡2¥2 *cascade08¥2¦2*cascade08¦2§2 *cascade08§2©2*cascade08©2°2 *cascade08°2±2*cascade08±2²2 *cascade08²2³2*cascade08³2µ2 *cascade08µ2·2*cascade08·2¹2 *cascade08¹2º2*cascade08º2Ë2 *cascade08Ë2Ì2*cascade08Ì2Ğ2 *cascade08Ğ2Ó2*cascade08Ó2Ü2 *cascade08Ü2Ş2 *cascade08Ş2à2*cascade08à2â2 *cascade08â2ã2*cascade08ã2ä2 *cascade08ä2í2 *cascade08í2î2*cascade08î2÷2 *cascade08÷2ù2 *cascade08ù2û2*cascade08û2ü2 *cascade08ü2ı2*cascade08ı2ş2 *cascade08ş2€3*cascade08€3‚3 *cascade08‚3ƒ3*cascade08ƒ3Œ3 *cascade08Œ33*cascade083–3 *cascade08–3™3™3¡3 *cascade08¡3©3©3«3 *cascade08«3®3*cascade08®3Œ4 *cascade08Œ44*cascade084’4 *cascade08’4“4 *cascade08“4”4*cascade08”4š4 *cascade08š4¦4*cascade08¦4§4 *cascade08§4©4*cascade08©4ª4 *cascade08ª4«4*cascade08«4¬4 *cascade08¬4®4*cascade08®4¯4*cascade08¯4°4*cascade08°4´4 *cascade08´4¹4*cascade08
¹4»4 »4¼4*cascade08
¼4½4 ½4Á4*cascade08
Á4Â4 Â4Ã4 *cascade08Ã4Æ4*cascade08Æ4È4 *cascade08È4É4*cascade08É4Ê4 *cascade08Ê4Ò4*cascade08Ò4Ó4 *cascade08Ó4Ö4*cascade08Ö4×4 *cascade08×4Ø4 *cascade08Ø4Ù4 *cascade08Ù4â4*cascade08â4ç4 *cascade08ç4è4*cascade08è4é4 *cascade08é4ê4*cascade08ê4ë4 *cascade08ë4ğ4*cascade08ğ4ô4 *cascade08ô4è6 *cascade08è6Ø8Ø8ê8 *cascade08ê8‹9‹9È9 *cascade08È9Ø9*cascade08Ø9Û9 *cascade08Û9ß9*cascade08ß9É< *cascade08É<Í<*cascade08Í<Ö< *cascade08Ö<Ø<*cascade08Ø<> *cascade08>‘>*cascade08‘>’> *cascade08’>“>*cascade08“>”> *cascade08”>•>*cascade08•>–> *cascade08–>—> *cascade08—>˜>*cascade08˜>š> *cascade08š>œ>*cascade08œ>> *cascade08>> *cascade08>¡>*cascade08¡>¢> *cascade08¢>£>*cascade08£>ñ>ñ>¦? *cascade08¦?í?*cascade08í?ÿ? *cascade08ÿ?ƒ@*cascade08ƒ@¸@ *cascade08¸@¼@*cascade08¼@½@ *cascade08½@Á@*cascade08Á@Â@ *cascade08Â@Å@*cascade08Å@Ï@ *cascade08Ï@Ñ@*cascade08Ñ@Ò@ *cascade08Ò@Õ@*cascade08Õ@Ø@ *cascade08Ø@ÕA *cascade08ÕAÇC *cascade08ÇCËC*cascade08ËCÌC *cascade08ÌCÎC*cascade08ÎC‹D *cascade08‹DŒD*cascade08ŒDD *cascade08DD*cascade08DD *cascade08D’D*cascade08’D¶D *cascade08¶D¹D*cascade08¹DÉD *cascade08ÉDÊD*cascade08ÊDÎD*cascade08ÎDŠE *cascade08ŠEŒE*cascade08ŒEE *cascade08EE*cascade08EÿF *cascade08ÿFšG *cascade08šG G *cascade08 G¡G *cascade08¡G¢G*cascade08¢G²G *cascade08²GµG*cascade08µGäG *cascade08äGïG*cascade08ïGòG *cascade08òGöG*cascade08öGúG *cascade08úG©J *cascade08©JµJ*cascade08µJ¹J *cascade08¹J½J½J¾J *cascade08¾JÀJÀJÁJ *cascade08ÁJÂJÂJÄJ *cascade08ÄJÈJÈJÉJ *cascade08ÉJÎJÎJÏJ *cascade08ÏJÔJÔJK *cascade08KµK*cascade08µKòK *cascade08òK‹L *cascade08‹LŒL*cascade08ŒLL *cascade08LL*cascade08L’L *cascade08’L•L*cascade08•L–L *cascade08–L—L*cascade08—L™L *cascade08™LÃM *cascade08ÃMÑM*cascade08ÑMÒM *cascade08
ÒMäM äMèM*cascade08
èMíM íMïM *cascade08ïMóM*cascade08óM“N *cascade08“N—N*cascade08—N˜N *cascade08˜N¦N *cascade08¦N©N *cascade08©N«N *cascade08«N®N *cascade08®N¯N*cascade08¯N°N *cascade08°N±N*cascade08±N´N *cascade08´NµN *cascade08µNÌN *cascade08ÌNÏN*cascade08ÏNO *cascade08OŸO*cascade08ŸOŞO *cascade08ŞOßQ*cascade08ßQàQ *cascade08
àQáQ áQãQ *cascade08ãQçQ*cascade08çQÍS *cascade08ÍSÑS*cascade08ÑSúV *cascade08úVşV*cascade08şVöW *cascade08öW÷W*cascade08÷WüW *cascade08üWZ *cascade08Z¢Z*cascade08¢Z£Z *cascade08£Z¤Z*cascade08¤Z¥Z *cascade08¥Z¾Z*cascade08¾Z¿Z *cascade08¿ZÔZ*cascade08ÔZÕZ *cascade08ÕZÜZ*cascade08ÜZİZ *cascade08İZêZ*cascade08êZëZ *cascade08ëZîZ*cascade08îZïZ *cascade08ïZöZ*cascade08öZ÷Z *cascade08÷ZıZ*cascade08ıZÿZ *cascade08ÿZƒ[*cascade08ƒ[„[ *cascade08„[[*cascade08[[ *cascade08[œ[ *cascade08œ[[*cascade08[Ÿ[ *cascade08Ÿ[¡[*cascade08¡[¢[ *cascade08¢[£[ *cascade08£[¦[*cascade08¦[§[ *cascade08§[¨[*cascade08¨[µ[ *cascade08µ[Ë[ *cascade08Ë[Ò[*cascade08Ò[Š\ *cascade08Š\\*cascade08\–\ *cascade08–\’]*cascade08’]] *cascade08]Ÿ]*cascade08Ÿ] ] *cascade08 ]ª] *cascade08ª]«]*cascade08«]¬] *cascade08¬]¯]*cascade08¯]ë] *cascade08ë]’^*cascade08’^¡^ *cascade08¡^£^*cascade08£^¬^ *cascade08¬^­^*cascade08­^®^ *cascade08®^¯^*cascade08¯^¶^ *cascade08¶^·^*cascade08·^À^ *cascade08À^Á^*cascade08Á^©_ *cascade08©_¯_*cascade08¯_Ì_ *cascade08Ì_Î_ *cascade08Î_Ğ_*cascade08Ğ_Ñ_ *cascade08Ñ_Ò_*cascade08Ò_Ó_ *cascade08Ó_Ù_*cascade08Ù_Ú_ *cascade08Ú_Û_*cascade08Û_û_ *cascade08û_ü_*cascade08ü_ı_ *cascade08ı_ş_*cascade08ş_Š` *cascade08Š`‹`*cascade08‹`¹` *cascade08¹`¿`*cascade08¿`â` *cascade08â`ø` *cascade08ø`ü`*cascade08ü`‘a *cascade08‘a”a*cascade08”a¸a *cascade08¸a»a*cascade08»aŞa *cascade08Şaßa*cascade08ßaìa *cascade08ìağa*cascade08ğašb *cascade08šb§b*cascade08§b¨b *cascade08¨b¬b*cascade08¬b­b *cascade08­bÆb*cascade08Æbäc *cascade08äcèc*cascade08èc¶d *cascade08¶d¹d*cascade08¹dÁd *cascade08ÁdÂd*cascade08ÂdÇd *cascade08Çdådådğd *cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72Ÿfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/preview/builder/page.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version