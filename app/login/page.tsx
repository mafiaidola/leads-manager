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
import "./loginThemes.css";

interface OrgOption {
    slug: string;
    name: string;
    logo: string;
    appName: string;
    accentColor: string;
    loginTheme: string;
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
    const loginTheme = selectedOrg?.loginTheme || "aurora";

    return (
        <div className="login-page" data-login-theme={loginTheme}>
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

            {/* ── Theme-Specific Background Elements ───────────────────── */}
            <ThemeBackground theme={loginTheme} accent={accent} />


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

/* ── Theme Background — renders theme-specific decorative elements ─────── */
function ThemeBackground({ theme, accent }: { theme: string; accent?: string }) {
    const color = accent || "#8b5cf6";

    if (theme === "waves") {
        return (
            <div className="login-waves-layer">
                {[1, 2, 3].map(i => (
                    <div key={i} className={`login-wave login-wave--${i}`}>
                        <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
                            <path
                                fill={color}
                                d={i === 1
                                    ? "M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,181.3C960,203,1056,213,1152,197.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                                    : i === 2
                                    ? "M0,224L48,213.3C96,203,192,181,288,192C384,203,480,245,576,250.7C672,256,768,224,864,192C960,160,1056,128,1152,128C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                                    : "M0,288L48,272C96,256,192,224,288,213.3C384,203,480,213,576,229.3C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                                }
                            />
                        </svg>
                    </div>
                ))}
            </div>
        );
    }

    if (theme === "particles") {
        const particles = Array.from({ length: 30 }, (_, i) => ({
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            size: 2 + Math.random() * 3,
            dur: 6 + Math.random() * 8,
            delay: Math.random() * 5,
            dx: (Math.random() - 0.5) * 60,
            dy: (Math.random() - 0.5) * 60,
        }));
        return (
            <div className="login-particles">
                {particles.map((p, i) => (
                    <div
                        key={i}
                        className="login-particle"
                        ref={el => {
                            if (el) {
                                el.style.left = p.x;
                                el.style.top = p.y;
                                el.style.width = `${p.size}px`;
                                el.style.height = `${p.size}px`;
                                el.style.setProperty('--p-dur', `${p.dur}s`);
                                el.style.setProperty('--p-delay', `${p.delay}s`);
                                el.style.setProperty('--p-dx', `${p.dx}px`);
                                el.style.setProperty('--p-dy', `${p.dy}px`);
                            }
                        }}
                    />
                ))}
            </div>
        );
    }

    if (theme === "neon") {
        return (
            <>
                <div className="login-neon-scanline" />
                {[
                    { x: "20%", y: "30%", w: 300, h: 300, dur: 6, delay: 0 },
                    { x: "70%", y: "60%", w: 250, h: 250, dur: 8, delay: 2 },
                    { x: "50%", y: "80%", w: 200, h: 200, dur: 7, delay: 1 },
                ].map((g, i) => (
                    <div
                        key={i}
                        className="login-neon-glow"
                        ref={el => {
                            if (el) {
                                el.style.left = g.x;
                                el.style.top = g.y;
                                el.style.width = `${g.w}px`;
                                el.style.height = `${g.h}px`;
                                el.style.background = `radial-gradient(circle, ${color}25, transparent 70%)`;
                                el.style.setProperty('--ng-dur', `${g.dur}s`);
                                el.style.setProperty('--ng-delay', `${g.delay}s`);
                            }
                        }}
                    />
                ))}
            </>
        );
    }

    if (theme === "gradient") {
        return (
            <>
                {[
                    { x: "15%", y: "25%", w: 400, dur: 12, delay: 0 },
                    { x: "75%", y: "65%", w: 350, dur: 15, delay: 3 },
                    { x: "45%", y: "80%", w: 300, dur: 10, delay: 1.5 },
                ].map((b, i) => (
                    <div
                        key={i}
                        className="login-gradient-blob"
                        ref={el => {
                            if (el) {
                                el.style.left = b.x;
                                el.style.top = b.y;
                                el.style.width = `${b.w}px`;
                                el.style.height = `${b.w}px`;
                                el.style.background = color;
                                el.style.setProperty('--gb-dur', `${b.dur}s`);
                                el.style.setProperty('--gb-delay', `${b.delay}s`);
                            }
                        }}
                    />
                ))}
            </>
        );
    }

    if (theme === "minimal") {
        return <div className="login-minimal-spot" />;
    }

    // Aurora (default) — no extra elements needed
    return null;
}

