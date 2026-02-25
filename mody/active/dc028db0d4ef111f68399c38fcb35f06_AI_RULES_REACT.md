�# React/Hooks AI Rules

> **Read when**: Working on React components, hooks, or providers
> **Back to**: [`AI_CONTEXT.md`](../AI_CONTEXT.md)

---

## ⚛️ Critical Rules (Prevent Memory Leaks & UI Spam)

### 1. Event Listeners MUST Be Cleaned Up

```typescript
// ❌ BAD - Anonymous function can't be removed
window.addEventListener("focus", () => doSomething());

// ✅ GOOD - Named function for proper cleanup
const onFocus = () => doSomething();
window.addEventListener("focus", onFocus);
return () => window.removeEventListener("focus", onFocus);
```

---

### 2. Intervals/Timeouts MUST Be Cleared

```typescript
// Always clear in cleanup function
const intervalRef = useRef<NodeJS.Timeout | null>(null);

useEffect(() => {
    intervalRef.current = setInterval(fn, 5000);
    
    return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };
}, []);
```

---

### 3. Toasts MUST Use Unique IDs (Prevent Spam)

```typescript
// ❌ BAD - Multiple calls stack toasts
toast.error("Session expired");

// ✅ GOOD - Same ID replaces previous toast
toast.error("Session expired", { id: "session-error" });
```

**Common toast IDs:**
- `session-error` - Auth/session issues
- `save-error` - Save failures
- `upload-error` - Upload failures
- `network-error` - Network issues

---

### 4. Debounce Repeated Operations

```typescript
// For visibility/focus events, add debounce
let lastAttempt = 0;
const DEBOUNCE_MS = 5000;

const attemptSync = () => {
    if (Date.now() - lastAttempt < DEBOUNCE_MS) return;
    lastAttempt = Date.now();
    // ... operation
};
```

---

### 5. Track Failed States to Prevent Retry Spam

```typescript
let hasFailed = false;

const doOperation = async () => {
    if (hasFailed) return; // Don't retry after failure
    
    try {
        await operation();
    } catch {
        hasFailed = true; // Stop further attempts
    }
};
```

---

## ✅ useEffect Cleanup Checklist

Every `useEffect` with side effects MUST:

- [ ] Return a cleanup function
- [ ] Remove ALL event listeners added
- [ ] Clear ALL intervals/timeouts
- [ ] Cancel fetch requests (AbortController)
- [ ] Set mounted flag to false

---

## 📁 Reference Files

| Pattern | Example File |
|---------|--------------|
| Session effects with cleanup | `src/lib/auth/useSessionEffects.ts` |
| Proper listener cleanup | `src/components/visual-builder-v2/hooks/useKeyboardShortcuts.ts` |
| Toast with unique ID | `src/lib/auth/sessionSync.ts` |

---

## 🚨 Common Mistakes

1. **Anonymous event handlers** - Cannot be removed
2. **Missing cleanup in useEffect** - Memory leaks
3. **Toast without ID** - Spam on retry loops
4. **No debounce on focus/visibility** - Hammers server
5. **Interval in component** - Not in ref, causes issues
�"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72�file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/docs/AI_RULES_REACT.md:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version