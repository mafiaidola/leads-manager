ò/"use client";

/**
 * Chat Widget - Golden Rule Compliant (Strict)
 * 
 * Rule 1: Mode prop (preview vs live)
 * Rule 2: SAME component, mode toggled (no separate PreviewWidget)
 * Rule 3: Under 200 lines âœ“
 * Rule 4: Container aware (absolute for preview, fixed for live)
 * Rule 5: State isolation (hook-based separation)
 */

import { cn } from "@/lib/utils";
import { useChatWidget } from "@/hooks/chat/useChatWidget";
import { usePreviewState } from "@/hooks/chat/usePreviewState";
import { AnimatePresence } from "framer-motion";
import { ChatWindow } from "./widget/ChatWindow";
import { ChatLauncher } from "./widget/ChatLauncher";
import { useState, useEffect } from "react";
import { STORAGE_KEYS } from "@/lib/chat/constants";

interface ChatWidgetProps {
    storeId: string;
    primaryColor?: string;
    position?: 'bottom-right' | 'bottom-left';
    welcomeMessage?: string;
    showPrechatForm?: boolean;
    prechatFormId?: string;
    mode?: 'live' | 'preview' | 'embed';
    previewSettings?: { isOpen?: boolean; welcomeMessage?: string; };
}

export function ChatWidget({
    storeId,
    primaryColor = '#1B365D',
    position = 'bottom-right',
    welcomeMessage = 'Hi! How can we help you today?',
    showPrechatForm = false,
    mode = 'live',
    previewSettings
}: ChatWidgetProps) {
    const isPreview = mode === 'preview';
    const isEmbed = mode === 'embed'; // New mode

    // === STATE ISOLATION (Rule 5) ===
    const previewState = usePreviewState({
        welcomeMessage: previewSettings?.welcomeMessage || welcomeMessage,
        initialOpen: previewSettings?.isOpen ?? true
    });

    const liveState = useChatWidget({
        storeId,
        welcomeMessage,
        skip: isPreview // Prevents socket/API init in preview (Embed is LIVE so skip=false)
    });

    // Select state based on mode
    const state = isPreview ? previewState : liveState;

    // Live-only: Prechat identification
    const [isIdentified, setIsIdentified] = useState(false);

    useEffect(() => {
        if (!isPreview) {
            const stored = localStorage.getItem(STORAGE_KEYS.VISITOR_INFO);
            if (stored) setIsIdentified(true);
        }
    }, [isPreview]);

    // === EMBED COMMUNICATION (Phase 8) ===
    // Notify parent window (widget.js) to resize iframe
    useEffect(() => {
        if (isEmbed && typeof window !== 'undefined') {
            window.parent.postMessage({
                type: 'EGYBAG_RESIZE',
                isOpen: state.isOpen,
                storeId
            }, '*');
        }
    }, [isEmbed, state.isOpen, storeId]);

    // === UNIFIED RENDER (Rule 2) ===
    // Uses the EXACT SAME sub-components for both modes
    return (
        <div className={cn(
            // Rule 4: Container Awareness & Rule 8: RTL-First
            // Embed: Attached to iframe edges (0 margins)
            // Preview/Live: Floating with margins
            isPreview ? "absolute z-50" : "fixed z-50",

            position === 'bottom-right'
                ? (isEmbed ? "bottom-0 end-0" : isPreview ? "bottom-6 end-6" : "bottom-6 end-6")
                : (isEmbed ? "bottom-0 start-0" : isPreview ? "bottom-6 start-6" : "bottom-6 start-6")
        )}>
            <AnimatePresence>
                {state.isOpen && !state.isMinimized && (
                    <ChatWindow
                        key="chat-window"
                        // Data
                        isOpen={state.isOpen}
                        isMinimized={state.isMinimized}
                        messages={state.messages}
                        input={state.input}
                        isSending={state.isSending}
                        isAgentTyping={state.isAgentTyping}
                        primaryColor={primaryColor}
                        error={state.error}

                        // Positioning
                        alignment={position === 'bottom-right' ? 'end' : 'start'}

                        // Actions
                        onMinimize={() => state.setIsMinimized(true)}
                        onClose={() => state.setIsOpen(false)}
                        onInputChange={state.handleInputChange}
                        onSend={state.handleSend}
                        onSendAttachment={state.handleSendAttachment}
                        observeMessage={state.observeMessage}

                        // Context / Mode
                        mode={isPreview ? 'preview' : 'widget'}
                    />
                )}
            </AnimatePresence>

            {/* Minimized State (Live only) */}
            {state.isOpen && state.isMinimized && !isPreview && (
                <MinimizedBar
                    position={position}
                    primaryColor={primaryColor}
                    unreadCount={state.unreadCount}
                    onExpand={() => state.setIsMinimized(false)}
                />
            )}

            <ChatLauncher
                isOpen={state.isOpen}
                unreadCount={state.unreadCount}
                primaryColor={primaryColor}
                onClick={() => state.setIsOpen(!state.isOpen)}
            />
        </div>
    );
}

// === SUB-COMPONENTS ===

function MinimizedBar({
    position,
    primaryColor,
    unreadCount,
    onExpand
}: {
    position: string;
    primaryColor: string;
    unreadCount: number;
    onExpand: () => void;
}) {
    return (
        <button
            onClick={onExpand}
            className={cn(
                "absolute bottom-24 shadow-lg flex items-center gap-2 px-4 py-3 rounded-xl text-white font-medium transition-transform hover:scale-105 active:scale-95",
                position === 'bottom-right' ? "end-0 origin-bottom-right" : "start-0 origin-bottom-left"
            )}
            style={{ backgroundColor: primaryColor }}
        >
            <span>Chat</span>
            {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {unreadCount}
                </span>
            )}
        </button>
    );
}
ò/"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72–file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/components/chat/ChatWidget.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version