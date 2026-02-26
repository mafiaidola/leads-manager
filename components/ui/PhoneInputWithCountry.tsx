"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE, type CountryCode } from "@/lib/constants/countryCodes";
import { Input } from "@/components/ui/input";
import { Ban } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhoneInputWithCountryProps {
    value: string;           // local digits (without country code)
    countryCode: string;     // dial code e.g. "971"
    onChange: (phone: string, countryCode: string) => void;
    onDuplicateStatus?: (status: { exists: boolean; leadName?: string } | null, checking: boolean) => void;
    checkDuplicate?: (fullPhone: string) => Promise<{ exists: boolean; leadName?: string; leadId?: string }>;
    excludePhone?: string;   // current lead's phone (to skip self-match in edit)
    disabled?: boolean;
    className?: string;
}

export function PhoneInputWithCountry({
    value,
    countryCode: initialCountryCode,
    onChange,
    onDuplicateStatus,
    checkDuplicate,
    excludePhone,
    disabled,
    className,
}: PhoneInputWithCountryProps) {
    const [selectedDial, setSelectedDial] = useState(initialCountryCode || DEFAULT_COUNTRY_CODE);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [duplicateWarning, setDuplicateWarning] = useState<{ exists: boolean; leadName?: string } | null>(null);
    const [checkingPhone, setCheckingPhone] = useState(false);
    const checkTimeout = useRef<NodeJS.Timeout | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handle(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
                setSearchTerm("");
            }
        }
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, []);

    // Focus search when opened
    useEffect(() => {
        if (dropdownOpen && searchRef.current) {
            searchRef.current.focus();
        }
    }, [dropdownOpen]);

    // Sync countryCode from parent when lead changes
    useEffect(() => {
        if (initialCountryCode && initialCountryCode !== selectedDial) {
            setSelectedDial(initialCountryCode);
        }
    }, [initialCountryCode]); // eslint-disable-line react-hooks/exhaustive-deps

    const sanitize = (v: string) => v.replace(/[^0-9]/g, "");

    const runDuplicateCheck = useCallback((localDigits: string, dial: string) => {
        if (checkTimeout.current) clearTimeout(checkTimeout.current);

        const fullPhone = dial + localDigits;
        if (!localDigits || localDigits.length < 4) {
            setDuplicateWarning(null);
            setCheckingPhone(false);
            onDuplicateStatus?.(null, false);
            return;
        }

        // Skip if same as current lead phone
        if (excludePhone && fullPhone === excludePhone.replace(/[^0-9]/g, "")) {
            setDuplicateWarning(null);
            setCheckingPhone(false);
            onDuplicateStatus?.(null, false);
            return;
        }

        if (!checkDuplicate) return;

        setCheckingPhone(true);
        onDuplicateStatus?.(null, true);
        checkTimeout.current = setTimeout(async () => {
            try {
                const result = await checkDuplicate(fullPhone);
                setDuplicateWarning(result);
                onDuplicateStatus?.(result, false);
            } catch {
                setDuplicateWarning(null);
                onDuplicateStatus?.(null, false);
            }
            setCheckingPhone(false);
        }, 400);
    }, [checkDuplicate, excludePhone, onDuplicateStatus]);

    const handlePhoneChange = (raw: string) => {
        const digits = sanitize(raw);
        onChange(digits, selectedDial);
        runDuplicateCheck(digits, selectedDial);
    };

    const handleCountrySelect = (cc: CountryCode) => {
        setSelectedDial(cc.dial);
        setDropdownOpen(false);
        setSearchTerm("");
        onChange(value, cc.dial);
        runDuplicateCheck(value, cc.dial);
    };

    const selectedCountry = COUNTRY_CODES.find((c) => c.dial === selectedDial) || COUNTRY_CODES[0];
    const filteredCodes = searchTerm
        ? COUNTRY_CODES.filter(
            (c) =>
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.dial.includes(searchTerm) ||
                c.code.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : COUNTRY_CODES;

    return (
        <div className={cn("space-y-1.5", className)}>
            <div className="flex gap-0">
                {/* Country Code Selector */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        disabled={disabled}
                        className={cn(
                            "flex items-center gap-1.5 h-10 px-3 rounded-l-xl border border-r-0 border-white/10 bg-white/5 text-sm font-medium",
                            "hover:bg-white/10 transition-colors whitespace-nowrap",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <span className="text-base">{selectedCountry.flag}</span>
                        <span className="text-muted-foreground">+{selectedDial}</span>
                        <svg className="h-3 w-3 text-muted-foreground" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 4.5L6 7.5L9 4.5" />
                        </svg>
                    </button>

                    {dropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-[280px] max-h-[300px] overflow-hidden rounded-xl border border-white/10 bg-card/95 backdrop-blur-xl shadow-2xl z-50 flex flex-col">
                            <div className="p-2 border-b border-white/5">
                                <input
                                    ref={searchRef}
                                    type="text"
                                    placeholder="Search country..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full h-8 px-3 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                                />
                            </div>
                            <div className="overflow-y-auto max-h-[240px]">
                                {filteredCodes.map((cc) => (
                                    <button
                                        key={cc.code + cc.dial}
                                        type="button"
                                        onClick={() => handleCountrySelect(cc)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-primary/10 transition-colors text-left",
                                            cc.dial === selectedDial && "bg-primary/15 text-primary"
                                        )}
                                    >
                                        <span className="text-base w-6 text-center">{cc.flag}</span>
                                        <span className="flex-1 truncate">{cc.name}</span>
                                        <span className="text-muted-foreground text-xs font-mono">+{cc.dial}</span>
                                    </button>
                                ))}
                                {filteredCodes.length === 0 && (
                                    <div className="p-4 text-center text-xs text-muted-foreground">No country found</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Phone Number Input */}
                <Input
                    placeholder="50 123 4567"
                    value={value}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    disabled={disabled}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className={cn(
                        "rounded-l-none rounded-r-xl border-white/10 bg-white/5 flex-1",
                        duplicateWarning?.exists && "border-red-500/50 focus:ring-red-500/40"
                    )}
                />
            </div>

            {/* Status Messages */}
            {checkingPhone && (
                <p className="text-xs text-blue-400 animate-pulse flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
                    Checking for duplicates...
                </p>
            )}
            {duplicateWarning?.exists && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/40 text-red-500">
                    <Ban className="h-4 w-4 shrink-0" />
                    <p className="text-xs font-bold">
                        ⛔ This phone already belongs to <strong>&quot;{duplicateWarning.leadName}&quot;</strong>. Duplicate leads cannot be saved.
                    </p>
                </div>
            )}
        </div>
    );
}
