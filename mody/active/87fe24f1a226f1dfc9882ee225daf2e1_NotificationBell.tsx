ÿM"use client";

import { useState, useEffect, useRef } from "react";
import {
    Bell,
    Package,
    ShoppingCart,
    Users,
    AlertCircle,
    Check,
    CheckCheck,
    ExternalLink,
} from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { useAuth } from "@/components/providers";
import Link from "next/link";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    read_at: string | null;
    created_at: string;
}

const TYPE_ICONS: Record<string, typeof Package> = {
    order_new: ShoppingCart,
    order_status: ShoppingCart,
    low_stock: Package,
    team_invite: Users,
    team_accepted: Users,
    alert: AlertCircle,
};

export function NotificationBell() {
    const { currentStore } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (currentStore?.id) {
            fetchNotifications();
        }
    }, [currentStore?.id]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        if (!currentStore?.id) return;

        try {
            const res = await fetch(`/api/stores/${currentStore.id}/notifications`);
            const data = await res.json();
            if (res.ok) {
                setNotifications(data.notifications || []);
                setUnreadCount(data.unread_count || 0);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    const markAsRead = async (notificationId: string) => {
        if (!currentStore?.id) return;

        try {
            await fetch(`/api/stores/${currentStore.id}/notifications`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notification_id: notificationId }),
            });

            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const markAllAsRead = async () => {
        if (!currentStore?.id) return;

        try {
            await fetch(`/api/stores/${currentStore.id}/notifications/read-all`, {
                method: "POST",
            });

            setNotifications((prev) =>
                prev.map((n) => ({ ...n, read_at: new Date().toISOString() }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <Button
                variant="ghost"
                size="sm"
                className="relative"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </Button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            Notifications
                        </h3>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={markAllAsRead}
                            >
                                <CheckCheck className="w-3 h-3 mr-1" />
                                Mark all read
                            </Button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-8 text-center text-gray-500">
                                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notification) => {
                                const Icon = TYPE_ICONS[notification.type] || AlertCircle;
                                const isUnread = !notification.read_at;

                                return (
                                    <div
                                        key={notification.id}
                                        className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer ${isUnread ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                                            }`}
                                        onClick={() => {
                                            if (isUnread) markAsRead(notification.id);
                                            if (notification.link) {
                                                window.location.href = notification.link;
                                            }
                                        }}
                                    >
                                        <div className={`p-2 rounded-lg flex-shrink-0 ${isUnread
                                                ? "bg-blue-100 dark:bg-blue-900/30"
                                                : "bg-gray-100 dark:bg-gray-800"
                                            }`}>
                                            <Icon className={`w-4 h-4 ${isUnread
                                                    ? "text-blue-600 dark:text-blue-400"
                                                    : "text-gray-500"
                                                }`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium ${isUnread
                                                    ? "text-gray-900 dark:text-white"
                                                    : "text-gray-600 dark:text-gray-400"
                                                }`}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {formatTime(notification.created_at)}
                                            </p>
                                        </div>
                                        {isUnread && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="border-t border-gray-100 dark:border-gray-800">
                            <Link
                                href="/dashboard/notifications"
                                className="flex items-center justify-center gap-1 px-4 py-3 text-sm text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                View all notifications
                                <ExternalLink className="w-3 h-3" />
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
ÿM"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72¥file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/components/notifications/NotificationBell.tsx:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version