/**
 * @page /login
 * @description Ultra-modern login page with animated mesh gradient aurora,
 * glassmorphism card, floating orbs, org selector, show/hide password.
 */
"use client";

import { useTransition, useState, useEffect, useCallback } from "react";
import { authenticate } from "@/lib/actions/auth";
import {
    LayoutDashboard, User, Lock, ArrowRight, ShieldCheck,
    Eye, EyeOff, Building2, ChevronDown, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OrgOption {
    slug: string;
    name: string;
    logo: string;
    appName: string;
    accentColor: string;
}

export default function LoginPage() {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [organizations, setOrganizations] = useState<OrgOption[]>([]);
    const [selectedOrg, setSelectedOrg] = useState<OrgOption | null>(null);
    const [showOrgDropdown, setShowOrgDropdown] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        fetch("/api/organizations/public")
            .then((res) => res.json())
            .then((orgs: OrgOption[]) => {
                setOrganizations(orgs);
                // Auto-select: prefer slug "default", otherwise first org
                const defaultOrg = orgs.find(o => o.slug === "default") || orgs[0];
                if (defaultOrg) setSelectedOrg(defaultOrg);
            })
            .catch(() => { });
    }, []);

    async function handleSubmit(formData: FormData) {
        if (!selectedOrg) {
            setErrorMessage("Please select an organization.");
            return;
        }
        formData.set("orgSlug", selectedOrg.slug);
        startTransition(async () => {
            const result = await authenticate(undefined, formData);
            if (result) {
                setErrorMessage(result);
            }
        });
    }

    const displayName = selectedOrg?.appName || "Leads Manager";
    const accent = selectedOrg?.accentColor;

    return (
        <div className="login-page">
            {/* ── Animated Mesh Gradient Aurora ─────────────────────────── */}
            <div className="login-aurora">
                <div className="login-aurora-blob login-aurora-blob--1" />
                <div className="login-aurora-blob login-aurora-blob--2" />
                <div className="login-aurora-blob login-aurora-blob--3" />
                <div className="login-aurora-blob login-aurora-blob--4" />
            </div>

            {/* ── Subtle Grid + Noise ──────────────────────────────────── */}
            <div className="login-grid" />
            <div className="login-noise" />

            {/* ── Floating Orbs ────────────────────────────────────────── */}
            <FloatingOrbs />

            {/* ── Main Content ─────────────────────────────────────────── */}
            <div className="login-container" ref={el => {
                if (el && accent) {
                    el.style.setProperty('--login-accent', accent);
                    el.style.setProperty('--login-ring-bg', `linear-gradient(135deg, ${accent}, ${accent}88)`);
                    el.style.setProperty('--login-ring-shadow', `0 0 60px ${accent}33, 0 0 120px ${accent}11`);
                    el.style.setProperty('--login-glow-bg', `linear-gradient(135deg, ${accent}66, transparent 50%, ${accent}33)`);
                    el.style.setProperty('--login-btn-bg', `linear-gradient(135deg, ${accent}, ${accent}cc)`);
                    el.style.setProperty('--login-btn-shadow', `0 8px 32px ${accent}33, 0 0 0 1px ${accent}22`);
                }
            }}>

                {/* Branding */}
                <div className={cn("login-branding", mounted && "login-branding--visible")}>
                    <div
                        className="login-logo-ring"
                    >
                        <div className="login-logo-inner">
                            {selectedOrg?.logo ? (
                                <img src={selectedOrg.logo} alt="" className="login-logo-img" />
                            ) : (
                                <LayoutDashboard className="login-logo-icon" />
                            )}
                        </div>
                    </div>
                    <h1 className="login-title">{displayName}</h1>
                    <p className="login-subtitle">
                        <Sparkles className="login-subtitle-icon" />
                        Premium Dashboard
                    </p>
                </div>

                {/* Login Card */}
                <div className={cn("login-card-wrap", mounted && "login-card-wrap--visible")}>
                    {/* Glow border */}
                    <div
                        className="login-card-glow"
                    />

                    <div className="login-card">
                        <div className="login-card-header">
                            <h2 className="login-card-title">
                                <ShieldCheck className="login-card-title-icon" />
                                Welcome back
                            </h2>
                            <p className="login-card-desc">
                                Sign in to access your dashboard
                            </p>
                        </div>

                        <form action={handleSubmit} className="login-form">
                            {/* Organization Selector */}
                            <div className="login-field">
                                <label className="login-label">Organization</label>
                                <div className="login-input-wrap">
                                    <button
                                        type="button"
                                        onClick={() => setShowOrgDropdown(!showOrgDropdown)}
                                        className={cn(
                                            "login-select",
                                            showOrgDropdown && "login-select--open"
                                        )}
                                    >
                                        <Building2 className="login-input-icon" />
                                        <span className={selectedOrg ? "login-select-value" : "login-select-placeholder"}>
                                            {selectedOrg ? selectedOrg.name : "Select organization..."}
                                        </span>
                                        <ChevronDown className={cn("login-select-chevron", showOrgDropdown && "login-select-chevron--open")} />
                                    </button>

                                    {showOrgDropdown && (
                                        <div className="login-dropdown">
                                            {organizations.length === 0 ? (
                                                <div className="login-dropdown-empty">No organizations available</div>
                                            ) : (
                                                organizations.map((org) => (
                                                    <button
                                                        key={org.slug}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedOrg(org);
                                                            setShowOrgDropdown(false);
                                                        }}
                                                        className={cn(
                                                            "login-dropdown-item",
                                                            selectedOrg?.slug === org.slug && "login-dropdown-item--active"
                                                        )}
                                                    >
                                                        {org.logo ? (
                                                            <img src={org.logo} alt="" className="login-dropdown-logo" />
                                                        ) : (
                                                            <div className="login-dropdown-avatar">
                                                                {org.name.charAt(0)}
                                                            </div>
                                                        )}
                                                        <span className="login-dropdown-name">{org.name}</span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Username */}
                            <div className="login-field">
                                <label className="login-label">Username</label>
                                <div className={cn("login-input-wrap", focusedField === "username" && "login-input-wrap--focused")}>
                                    <User className="login-input-icon" />
                                    <input
                                        type="text"
                                        name="username"
                                        required
                                        minLength={3}
                                        className="login-input"
                                        placeholder="Enter username"
                                        autoComplete="username"
                                        onFocus={() => setFocusedField("username")}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="login-field">
                                <label className="login-label">Password</label>
                                <div className={cn("login-input-wrap", focusedField === "password" && "login-input-wrap--focused")}>
                                    <Lock className="login-input-icon" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        required
                                        minLength={6}
                                        className="login-input login-input--password"
                                        placeholder="••••••••"
                                        onFocus={() => setFocusedField("password")}
                                        onBlur={() => setFocusedField(null)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="login-eye-btn"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="login-eye-icon" />
                                        ) : (
                                            <Eye className="login-eye-icon" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                className={cn("login-submit", isPending && "login-submit--pending")}
                                disabled={isPending}
                            >
                                <div className="login-submit-shine" />
                                {isPending ? (
                                    <>
                                        <div className="login-spinner" />
                                        <span>Signing in...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign in to Dashboard</span>
                                        <ArrowRight className="login-submit-arrow" />
                                    </>
                                )}
                            </button>

                            {/* Error */}
                            <div className="login-error-area" aria-live="polite" aria-atomic="true">
                                {errorMessage && (
                                    <p className="login-error">
                                        <span className="login-error-dot" />
                                        {errorMessage}
                                    </p>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                {/* Footer tagline */}
                <div className={cn("login-footer", mounted && "login-footer--visible")}>
                    <p>&quot;Empowering sales teams with intelligent leads management.&quot;</p>
                </div>
            </div>
        </div>
    );
}

/* ── Floating Orbs ─────────────────────────────────────────────────────────── */
function FloatingOrbs() {
    const orbs = [
        { x: "8%", y: "15%", size: 4, dur: 7, delay: 0 },
        { x: "22%", y: "78%", size: 3, dur: 9, delay: 1.2 },
        { x: "78%", y: "12%", size: 5, dur: 6, delay: 0.5 },
        { x: "65%", y: "55%", size: 3, dur: 10, delay: 2 },
        { x: "42%", y: "28%", size: 4, dur: 8, delay: 3 },
        { x: "88%", y: "42%", size: 3, dur: 7, delay: 1.5 },
        { x: "12%", y: "58%", size: 4, dur: 9, delay: 4 },
        { x: "55%", y: "88%", size: 3, dur: 6, delay: 2.5 },
        { x: "35%", y: "68%", size: 5, dur: 11, delay: 1 },
        { x: "92%", y: "72%", size: 3, dur: 8, delay: 3.5 },
        { x: "48%", y: "10%", size: 4, dur: 7, delay: 0 },
        { x: "3%", y: "40%", size: 3, dur: 10, delay: 2 },
        { x: "72%", y: "35%", size: 2, dur: 8, delay: 4.5 },
        { x: "18%", y: "92%", size: 3, dur: 9, delay: 1.8 },
        { x: "58%", y: "45%", size: 2, dur: 7, delay: 3.2 },
    ];

    return (
        <div className="login-orbs">
            {orbs.map((o, i) => (
                <div
                    key={i}
                    className="login-orb"
                    ref={el => {
                        if (el) {
                            el.style.setProperty('--orb-x', o.x);
                            el.style.setProperty('--orb-y', o.y);
                            el.style.setProperty('--orb-size', `${o.size}px`);
                            el.style.setProperty('--orb-dur', `${o.dur}s`);
                            el.style.setProperty('--orb-delay', `${o.delay}s`);
                        }
                    }}
                />
            ))}
        </div>
    );
}
