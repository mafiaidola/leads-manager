®9"use client";

/**
 * New Layout Mockup - Full Interactive Experience
 * REFACTORED: State logic moved to useAppState.ts hook
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toaster } from "sonner";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { MainContent } from "./MainContent";
import { AuthLayout } from "./AuthLayout";
import { MockLoginPage } from "./MockLoginPage";
import { MockSignupPage } from "./MockSignupPage";
import { MockOnboardingPage } from "./MockOnboardingPage";
import { MockSelectModePage } from "./MockSelectModePage";
import { MockTemplateGallery } from "./MockTemplateGallery";
import { MockAIBuilderPage } from "./MockAIBuilderPage";
import { EditStoreModal } from "./EditStoreModal";
import { StoreCreatedCelebration } from "./StoreCreatedCelebration";
import { DashboardTutorial } from "./DashboardTutorial";
import { themeStyles, Property } from "./types";
import { useAppState } from "./useAppState";

export default function NewLayoutMockup() {
    const state = useAppState();
    const router = useRouter();
    const currentTheme = themeStyles[state.theme];
    const [editingStore, setEditingStore] = useState<Property | null>(null);

    // FIXED: Redirect to new builder instead of rendering old MockBuilderPage
    useEffect(() => {
        if (state.viewMode === "builder" && state.selectedProperty) {
            const storeId = state.selectedProperty.id;
            router.push(`/newlayout1/preview/builder${storeId ? `?storeId=${storeId}` : ""}`);
        }
    }, [state.viewMode, state.selectedProperty, router]);

    // Show loading while checking Firebase auth
    if (state.authScreen === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    // Celebration screen after store creation
    if (state.authScreen === "celebration") {
        return (
            <StoreCreatedCelebration
                storeName={state.newStoreName}
                storeUrl={state.newStoreUrl}
                language={state.language}
                onContinue={state.handleCelebrationComplete}
            />
        );
    }

    // Auth screens (login, signup, onboarding)
    if (state.authScreen !== "dashboard") {
        return (
            <AuthLayout language={state.language} onToggleLanguage={() => state.setLanguage(l => l === "en" ? "ar" : "en")}>
                {state.authScreen === "login" && <MockLoginPage language={state.language} onLogin={state.handleLogin} onGoToSignup={() => state.setAuthScreen("signup")} />}
                {state.authScreen === "signup" && <MockSignupPage language={state.language} onSignup={state.handleSignup} onGoToLogin={() => state.setAuthScreen("login")} />}
                {state.authScreen === "onboarding" && <MockOnboardingPage language={state.language} onComplete={state.handleOnboardingComplete} onSkip={state.handleSkipOnboarding} />}
            </AuthLayout>
        );
    }

    // Select Mode (AI vs Template)
    if (state.viewMode === "selectMode") {
        return <MockSelectModePage language={state.language} onSelectAI={() => state.setViewMode("aiBuilder")} onSelectTemplate={() => state.setViewMode("templateGallery")} onBack={() => state.setViewMode("dashboard")} />;
    }

    // Template Gallery
    if (state.viewMode === "templateGallery") {
        return <MockTemplateGallery language={state.language} onSelectTemplate={state.handleSelectTemplateFromGallery} onBack={() => state.setViewMode("selectMode")} />;
    }

    // AI Builder
    if (state.viewMode === "aiBuilder") {
        return <MockAIBuilderPage language={state.language} onGenerate={state.handleAIGenerate} onBack={() => state.setViewMode("selectMode")} />;
    }

    // Builder view - redirect happens in useEffect, show loading while transitioning
    if (state.viewMode === "builder" && state.selectedProperty) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">{state.isRTL ? "Ø¬Ø§Ø±Ù ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ù†Ø´Ø¦..." : "Loading builder..."}</p>
                </div>
            </div>
        );
    }

    // Dashboard view
    return (
        <div className={`min-h-screen transition-colors duration-300 ${state.isRTL ? "font-arabic" : ""}`} dir={state.isRTL ? "rtl" : "ltr"} style={{ ...currentTheme, backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
            <TopBar onMenuToggle={() => state.setMobileMenuOpen(!state.mobileMenuOpen)} mobileMenuOpen={state.mobileMenuOpen} language={state.language} theme={state.theme} onLanguageChange={state.setLanguage} onThemeChange={state.setTheme} onTabChange={state.handleTabChange} onLogout={state.handleLogout} onResetOnboarding={state.handleResetOnboarding} />

            <Sidebar properties={state.properties} selectedProperty={state.selectedProperty} onSelectProperty={state.handleSelectProperty} onDeselectProperty={() => state.handleSelectProperty(null as unknown as Property)} onTabChange={state.handleTabChange} onCreateNew={() => state.setViewMode("selectMode")} activeTab={state.activeTab} sidebarOpen={state.sidebarOpen} mobileMenuOpen={state.mobileMenuOpen} language={state.language} theme={state.theme} />

            <MainContent
                properties={state.properties}
                archivedProperties={state.archivedProperties}
                selectedProperty={state.selectedProperty}
                onSelectProperty={state.handleSelectProperty}
                onTabChange={state.handleTabChange}
                onCreateNew={() => state.setViewMode("selectMode")}
                onEditStore={(prop) => setEditingStore(prop)}
                onArchiveStore={state.handleArchiveStore}
                onRestoreStore={state.handleRestoreStore}
                onHardDeleteStore={state.handleHardDeleteStore}
                onDuplicateStore={state.handleDuplicateStore}
                activeTab={state.activeTab}
                settingsSection={state.settingsSection}
                sidebarOpen={state.sidebarOpen}
                language={state.language}
                mobilePreview={false}
                theme={state.theme}
                isLoading={state.isLoading}
                onEdit={() => state.setViewMode("builder")}
            />

            <EditStoreModal store={editingStore} isOpen={!!editingStore} onClose={() => setEditingStore(null)} onSave={state.handleEditStore} language={state.language} />

            {/* Dashboard Tutorial - shows after first store creation */}
            {state.showTutorial && <DashboardTutorial language={state.language} onComplete={() => state.setShowTutorial(false)} />}

            <Toaster position="bottom-right" richColors />
        </div>
    );
}
” ”Ÿ*cascade08
Ÿ­ ­Ú
Ú« «©*cascade08
©Ö Öö*cascade08
öé	 é	ï*cascade08
ïé éà*cascade08
àì ìˆ*cascade08
ˆš  š Ü *cascade08
Ü ®! ®!¼!*cascade08
¼!½! ½!¾!*cascade08
¾!¿! ¿!À!*cascade08
À!Á! Á!Â!*cascade08
Â!Ä! Ä!Ç!*cascade08
Ç!È! È!É!*cascade08
É!Ë! Ë!Ò!*cascade08
Ò!Ó! Ó!Õ!*cascade08
Õ!Ö! Ö!×!*cascade08
×!Ù! Ù!Û!*cascade08
Û!Ü! Ü!ß!*cascade08
ß!à! à!á!*cascade08
á!â! â!å!*cascade08
å!æ! æ!ç!*cascade08
ç!é! é!ê!*cascade08
ê!ë! ë!í!*cascade08
í!ï! ï!ó!*cascade08
ó!ô! ô!ö!*cascade08
ö!ù! ù!ş!*cascade08
ş!€" €""*cascade08
"" "Ÿ"*cascade08
Ÿ" "  "¢"*cascade08
¢"£" £"§"*cascade08
§"©" ©"­"*cascade08
­"®" ®"°"*cascade08
°"±" ±"Î"*cascade08
Î"Ï" Ï"Ö"*cascade08
Ö"×" ×"æ"*cascade08
æ"ç" ç"è"*cascade08
è"é" é"í"*cascade08
í"î" î"ğ"*cascade08
ğ"ò" ò"ö"*cascade08
ö"÷" ÷"û"*cascade08
û"ü" ü"ş"*cascade08
ş"ÿ" ÿ"€#*cascade08
€#‚# ‚#ƒ#*cascade08
ƒ#„# „#…#*cascade08
…#†# †#‡#*cascade08
‡#ˆ# ˆ#‰#*cascade08
‰#Š# Š##*cascade08
## ##*cascade08
## #‘#*cascade08
‘#“# “#–#*cascade08
–#—# —#£#*cascade08
£#¤# ¤#§#*cascade08
§#¨# ¨#ª#*cascade08
ª#«# «#°#*cascade08
°#±# ±#³#*cascade08
³#´# ´#Ñ#*cascade08
Ñ#Ò# Ò#Ô#*cascade08
Ô#Ö# Ö#×#*cascade08
×#Ø# Ø#Ù#*cascade08
Ù#Ú# Ú#Û#*cascade08
Û#Ü# Ü#Ş#*cascade08
Ş#à# à#á#*cascade08
á#â# â#å#*cascade08
å#æ# æ#ì#*cascade08
ì#í# í#î#*cascade08
î#ö# ö#ü#*cascade08
ü#ı# ı#$*cascade08
$‘$ ‘$¦$*cascade08
¦$§$ §$ª$*cascade08
ª$«$ «$®$*cascade08
®$¯$ ¯$°$*cascade08
°$±$ ±$²$*cascade08
²$³$ ³$¶$*cascade08
¶$·$ ·$Ğ$*cascade08
Ğ$Ò$ Ò$à$*cascade08
à$á$ á$â$*cascade08
â$ã$ ã$æ$*cascade08
æ$ç$ ç$ñ$*cascade08
ñ$ş* ş*Ñ+*cascade08
Ñ+˜7 ˜7ç8*cascade08
ç8®9 "(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/page.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version