ö."use client";

/**
 * useAppState Hook - Centralized state management for NewLayoutMockup
 * REFACTORED: Property handlers extracted to usePropertyHandlers.ts
 * ~120 lines - within AI friendly limit
 */

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Property, Language, Theme, PropertyType, MockTemplate } from "./types";
import { DashboardTab } from "./Sidebar";
import { useAuth } from "@/components/providers/AuthProvider";
import { createPropertyHandlers } from "./usePropertyHandlers";

export type AuthScreen = "login" | "signup" | "onboarding" | "celebration" | "dashboard";
export type ViewMode = "dashboard" | "builder" | "selectMode" | "templateGallery" | "aiBuilder";

export function useAppState() {
    const { user, isLoading: authLoading, logout: firebaseLogout, needsOnboarding } = useAuth();

    // Auth flow state - starts null until we check Firebase
    const [authScreen, setAuthScreen] = useState<AuthScreen | null>(null);
    const [properties, setProperties] = useState<Property[]>([]);
    const [archivedProperties, setArchivedProperties] = useState<Property[]>([]);

    // Check Firebase auth on mount
    useEffect(() => {
        if (!authLoading) {
            setAuthScreen(user ? (needsOnboarding ? "onboarding" : "dashboard") : "login");
        }
    }, [user, authLoading, needsOnboarding]);

    // UI state
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [createPropertyOpen, setCreatePropertyOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
    const [settingsSection, setSettingsSection] = useState<string | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
    const [selectedTemplate, setSelectedTemplate] = useState<MockTemplate | null>(null);
    const [language, setLanguage] = useState<Language>("en");
    const [theme, setTheme] = useState<Theme>("light");
    const [newStoreName, setNewStoreName] = useState<string>("");
    const [newStoreUrl, setNewStoreUrl] = useState<string>("");
    const [showTutorial, setShowTutorial] = useState(false);

    // Fetch stores from API when entering dashboard
    useEffect(() => {
        if (authScreen === "dashboard") {
            fetch("/api/stores", { credentials: "include" })
                .then(r => r.json())
                .then(json => {
                    if (Array.isArray(json.stores)) {
                        const stores: Property[] = json.stores.map((s: { id: string; name: string; subdomain: string }) => ({
                            id: s.id, name: s.name || "My Store", nameAr: s.name || "Ù…ØªØ¬Ø±ÙŠ",
                            url: `${s.subdomain}.egybag.com`, emoji: "ğŸª", type: "store" as PropertyType, isLive: true,
                        }));
                        setProperties(stores);
                    }
                })
                .catch(() => console.error("Failed to load stores"));
        }
    }, [authScreen]);

    // Auth handlers
    const handleLogin = () => setAuthScreen("dashboard");
    const handleSignup = () => setAuthScreen("onboarding");
    const handleSkipOnboarding = () => setAuthScreen("dashboard");
    const handleLogout = async () => { await firebaseLogout(); setAuthScreen("login"); };
    const handleResetOnboarding = () => setAuthScreen("onboarding");

    const handleOnboardingComplete = (type: PropertyType, name: string, templateId?: string) => {
        const subdomain = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
        const storeUrl = `${subdomain}.egybag.com`;
        const newProp: Property = {
            id: Date.now().toString(), name, nameAr: name, type,
            emoji: type === "store" ? "ğŸ›’" : type === "website" ? "ğŸŒ" : "ğŸš€",
            url: storeUrl, isLive: false,
        };
        setProperties([newProp, ...properties]);
        setSelectedProperty(newProp);
        setNewStoreName(name);
        setNewStoreUrl(storeUrl);
        setAuthScreen("celebration"); // Go to celebration first!
    };

    const handleCelebrationComplete = () => {
        setAuthScreen("dashboard");
        setShowTutorial(true); // Show tutorial on dashboard
    };

    const handleTabChange = (tab: DashboardTab, section?: string) => {
        if (!selectedProperty && properties.length > 0) setSelectedProperty(properties[0]);
        setActiveTab(tab);
        setSettingsSection(section);
        setMobileMenuOpen(false);
    };

    // Property handlers from extracted module
    const propertyHandlers = useMemo(() => createPropertyHandlers({
        properties, setProperties, archivedProperties, setArchivedProperties,
        selectedProperty, setSelectedProperty, setIsLoading,
        setMobileMenuOpen, setActiveTab: setActiveTab as React.Dispatch<React.SetStateAction<string>>,
        setSelectedTemplate, setViewMode: setViewMode as React.Dispatch<React.SetStateAction<string>>,
        setCreatePropertyOpen, language,
    }), [properties, archivedProperties, selectedProperty, language]);

    return {
        // State
        authScreen, properties, archivedProperties, sidebarOpen, mobileMenuOpen, selectedProperty, createPropertyOpen,
        activeTab, settingsSection, isLoading, viewMode, selectedTemplate, language, theme,
        newStoreName, newStoreUrl, showTutorial,
        // Setters
        setSidebarOpen, setMobileMenuOpen, setCreatePropertyOpen, setViewMode, setLanguage, setTheme, setAuthScreen,
        setShowTutorial,
        // Handlers
        handleLogin, handleSignup, handleOnboardingComplete, handleSkipOnboarding, handleLogout, handleResetOnboarding,
        handleTabChange, handleCelebrationComplete, ...propertyHandlers,
        // Computed
        isRTL: language === "ar",
    };
}
] ]^^_ _|	|… …Œ
Œ ”
”• •˜
˜™ ™›
› Ÿ
Ÿ   ¦
¦§ §ª
ª« «¬
¬­ ­°
°² ²µ
µ¶ ¶½
½¿ ¿Á
ÁÄ ÄÇ
ÇŞ Şé*cascade08éò
ò 
× ×ç
çş şà
àò ò˜
˜Ô ÔÛ
Ûİ İß
ßà àé
éê êö
ö÷ ÷£
£± ±º
ºÈ ÈĞ
Ğó óô *cascade08ôß
ß
à
 *cascade08
à
× ×²
²„ „‡ *cascade08‡¼¼Ñ *cascade08Ñííî *cascade08îÿÿ“ *cascade08“¤¤Ä *cascade08ÄÈÈß *cascade08ßààá *cascade08áååê *cascade08êîî¢ *cascade08¢££¤ *cascade08¤¨¨è *cascade08èììÊ *cascade08ÊÌÌä *cascade08äææÄ *cascade08ÄÈÈõ *cascade08õùù  *cascade08 ¤¤¦ *cascade08¦ªª¸ *cascade08¸ÉÉœ *cascade08
œ‡ ‡
“ “­
­Ä ÄŒ
ŒÔ Ôé
éï ïì
ì¸ ¸¹
¹½ ½¾
¾¾  ¾ ¿ 
¿ À  À Â 
Â Æ  Æ Ç 
Ç È  È É 
É Ê  Ê Ë 
Ë Û  Û Ü 
Ü İ  İ Ş 
Ş ß  ß à 
à å  å æ 
æ ç  ç ê 
ê ì  ì í 
í î  î ï 
ï ò  ò ó 
ó ü  ü ı 
ı ÿ  ÿ …!
…!ˆ! ˆ!‹!
‹!! !!
!! !!
!‘! ‘!’!
’!”! ”!—!
—!˜! ˜!™!
™!š! š!œ!
œ!! !Ÿ!
Ÿ! !  !¢!
¢!£! £!¤!
¤!¥! ¥!©!
©!ª! ª!«!
«!¬! ¬!­!
­!®! ®!±!
±!²! ²!µ!
µ!º! º!¾!
¾!Â! Â!Å!
Å!Ç! Ç!Ì!
Ì!Î! Î!Ï!
Ï!Ò! Ò!Õ!
Õ!×! ×!Û!
Û!Ü! Ü!Ş!
Ş!à! à!ä!
ä!÷! ÷!û!
û!€" €""
"ƒ" ƒ"ˆ"
ˆ"‰" ‰"Š"
Š"‹" ‹"Œ"
Œ"›" ›"¢"
¢"£" £"¤"
¤"§" §"«"
«"¯" ¯"±"
±"²" ²"´"
´"¹" ¹"º"
º"¼" ¼"½"
½"¾" ¾"¿"
¿"Æ" Æ"È"
È"É" É"Ê"
Ê"ƒ# ƒ#„#
„#Œ# Œ##
#¤# ¤#¥# *cascade08¥#¦#¦#§# *cascade08§#¨# *cascade08¨#©#©#ª# *cascade08ª#«#«#­# *cascade08­#®# *cascade08®#°# *cascade08°#±# *cascade08
±#´# ´#¶# *cascade08¶#·# *cascade08
·#¸# ¸#¹# *cascade08¹#½# *cascade08½#Ä# *cascade08
Ä#Å# Å#Æ#Æ#Ç# *cascade08Ç#È# *cascade08
È#Ê# Ê#Ë# *cascade08
Ë#Í# Í#Î#
Î#Ï# Ï#Ñ# *cascade08Ñ#Ò#
Ò#è# è#é#
é#ì# ì#õ#
õ#ı# ı#€$ *cascade08
€$ƒ$ ƒ$„$
„$†$ †$ˆ$
ˆ$‹$ ‹$Œ$
Œ$$ $$
$“$ “$•$ *cascade08
•$$ $Ÿ$
Ÿ$¡$ ¡$§$
§$¨$ ¨$«$
«$°$ °$µ$
µ$¼$ ¼$À$ *cascade08À$Á$
Á$Ã$ Ã$Ä$
Ä$É$ É$Ê$Ê$Ì$ *cascade08Ì$Í$ *cascade08Í$Î$
Î$Ğ$ Ğ$Ô$
Ô$Õ$ Õ$×$ *cascade08×$Ø$Ø$Ù$ *cascade08
Ù$Ú$ Ú$ß$ *cascade08ß$á$á$æ$ *cascade08æ$è$è$é$ *cascade08é$ê$ê$ì$ *cascade08ì$í$í$î$ *cascade08
î$ğ$ ğ$ñ$
ñ$ò$ ò$ô$ *cascade08ô$÷$÷$ù$ *cascade08ù$ü$ü$ş$ *cascade08ş$€%€%%*cascade08%‚%‚%„% *cascade08„%…% *cascade08…%†%†%ˆ% *cascade08ˆ%‰%‰%Š% *cascade08Š%‹%‹%Œ% *cascade08Œ%%%% *cascade08
%›% ›%¤%
¤%©% ©%ª%
ª%®% ®%¶%
¶%¼% ¼%¾%
¾%¿% ¿%À%
À%Ê% Ê%Ó%
Ó%æ% æ%è%
è%ö% ö%÷%
÷%ù% ù%ú%
ú%û% û%ş%
ş%ˆ& ˆ&Š&
Š&& &&
&‘& ‘&•&
•&–& –&š&
š&›& ›&¢&
¢&»& »&¼&
¼&¿& ¿&Â&
Â&Õ& Õ&Ø&
Ø&Ú& Ú&Ü&
Ü&Ş& Ş&à&
à&ê& ê&ï&
ï&ñ& ñ&ò&
ò&ó& ó&ö&
ö&ù& ù&ú&
ú&ş& ş&'
'‚' ‚'ƒ'
ƒ'„' „'…'
…'‡' ‡'ˆ'
ˆ'Œ' Œ''
'' '‘'
‘'”' ”'•'
•'–' –'™' *cascade08™'š'
š'' '¢'
¢'¦' ¦'©'
©'­' ­'°'
°'±' ±'²'²'³' *cascade08³'¶' *cascade08¶'·'·'¸' *cascade08¸'º'º'¼' *cascade08¼'½'½'¿' *cascade08¿'À' *cascade08À'Á' *cascade08Á'Å'
Å'Ï' Ï'Ğ'*cascade08
Ğ'Ò' Ò'Ó'
Ó'Õ' Õ'Ö'Ö'×' *cascade08×'Ø' *cascade08
Ø'Ù' Ù'Ú' *cascade08Ú'Û'
Û'ç' ç'è'è'é' *cascade08é'ê'ê'ë' *cascade08ë'ì'ì'í'*cascade08í'î'
î'ï' ï'ğ'ğ'ñ' *cascade08ñ'ò'
ò'ô' ô'õ'õ'ö' *cascade08
ö'÷' ÷'ø' *cascade08ø'ù'ù'ú' *cascade08ú'û' *cascade08
û'ü' ü'ı' *cascade08ı'ÿ' *cascade08ÿ'€( *cascade08€((
(‚( ‚(ƒ( *cascade08ƒ(„(„(…( *cascade08…(ˆ(ˆ(‰( *cascade08‰(Š(Š(( *cascade08((
(’( ’(“( *cascade08
“(”( ”(–(
–(—( —(˜( *cascade08˜(™(
™(›( ›(œ(
œ(( (Ÿ(
Ÿ( (  (¢(
¢(£( £(¤(
¤(ª( ª(«(
«(¬( ¬(­(
­(¹( ¹(º(
º(Ç( Ç(É(
É(Í( Í(Î(
Î(Ğ( Ğ(Ò(
Ò(Ó( Ó(Ô(
Ô(Û( Û(İ(
İ(ß( ß(á(
á(ã( ã(ä(
ä(æ( æ(è(
è(í( í(î(
î(ï( ï(ğ(
ğ() )‘)
‘)š) š)›)
›)Ò) Ò)æ)
æ)Å* Å*Ö*
Ö*˜+ ˜+É+*cascade08
É+É, É,â,*cascade08
â,İ- İ-Ş-
Ş-ß- ß-à-
à-â- â-ã-
ã-ç- ç-è-
è-ê- ê-ì-
ì-ı- ı-„.„.Ÿ.*cascade08
Ÿ. .  .¥.
¥.¨. ¨.©.
©.«. «.¬.
¬.­. ­.®.
®.´. ´.µ.
µ.ö. "(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72•file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/useAppState.ts:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version