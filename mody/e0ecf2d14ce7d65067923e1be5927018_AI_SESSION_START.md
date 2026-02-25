�## AI Session Start Instructions

> **⚠️ EVERY AI AGENT MUST READ THIS FIRST**
> This document ensures continuity between AI sessions.
> **Goal:** Minimize token usage while maintaining accuracy.

---

## 🚀 Quick Start (Copy to Start Session)

```
Read docs/AI_SESSION_START.md and docs/PHASE_STATUS.md, then continue.
```

---

## 🔄 Workflow Protocol (Token-Efficient)

### Quick Commands

| You Say | AI Does |
|---------|---------|
| `next` | Continue to next task |
| `issue: [description]` | Fix the specific issue |
| `pause` | Save progress to PHASE_STATUS.md, stop |
| `status` | Show current phase + remaining tasks |
| `skip` | Skip current task, move to next |

### After EVERY Task, AI Must Provide:

```
## ✅ Task Complete

**Changes:** [bullet list]
**Files:** `path/file.tsx` (X lines)
**Test:** [how to verify]

---
**Reply:** `next` | `issue: [desc]` | `pause`
```

### Issue Report Format

When something doesn't work:
```
issue: [Element] not working
- Expected: [what should happen]
- Actual: [what happens]
- File: [path if known]
```

---

## 📏 Code Quality Rules (MUST FOLLOW)

| Rule | Limit | If Exceeded |
|------|-------|-------------|
| Max file lines | **200** | Split into folder with modules |
| Max function lines | 30 | Extract helper functions |
| Max parameters | 4 | Use options object |
| TypeScript `any` | ❌ | Use proper types |

**ESLint enforces these automatically.**

---

## 🏗️ Architecture Quick Reference

```
visual-builder/core/          ← State, types, elements (ONLY)
├── store/                    ← Zustand store + actions
├── elements/                 ← Element type definitions
└── ElementTypes.ts           ← ALL_ELEMENTS registry

visual-builder-v2/            ← ALL UI components
├── canvas/                   ← Canvas + element renderers
├── controls/                 ← Property controls
├── properties-panel/         ← Right sidebar
└── hooks/                    ← Custom hooks

visual-builder/_legacy/       ← ARCHIVED - DO NOT USE
```

---

## 🔧 Common Patterns

### Adding New Element Renderer

1. **Add component** to `canvas/[Category]Elements.tsx`:
```typescript
export const MyElement: FC<ElementContentProps> = ({ element, isArabic }) => {
    const { props } = element;
    const value = getProp<string>(props, "propName", "default");
    return <div>{value}</div>;
};
```

2. **Add case** to `canvas/ElementRenderer.tsx`:
```typescript
case "MyElement":
    return <MyElement {...props} />;
```

### Getting Element Props
```typescript
// ALWAYS use getProp - never access props directly
const text = getProp<string>(props, "text", "Default");
const count = getProp<number>(props, "count", 0);
```

---

## ⚠️ Common Mistakes to Avoid

| ❌ Don't | ✅ Do |
|----------|-------|
| Access `props.value` directly | Use `getProp(props, "value", default)` |
| Create files > 200 lines | Split into modules |
| Add element without renderer case | Always add to ElementRenderer.tsx |
| Forget to update PHASE_STATUS.md | Update after every session |
| Re-read all files on error | Check only the specific file |

---

## 📍 Current Status

**Always check `docs/PHASE_STATUS.md` for:**
- Current phase and task
- Quick commands reference
- Completed work
- Known issues

---

## 📚 Documentation Map

| Doc | Purpose | When to Read |
|-----|---------|--------------|
| `PHASE_STATUS.md` | Progress + quick commands | **Every session** |
| `AI_SESSION_START.md` | This file | **Every session** |
| `CODE_QUALITY_RULES.md` | Detailed standards | When writing code |
| `QUICK_REFERENCE.md` | Cheat sheet | Quick lookups |

---

## 🚫 Don't Do This

### 1. Don't Create Duplicate Files
```
❌ TemplateLibrary2.tsx
✅ Check if file exists first with grep
```

### 2. Don't Exceed File Limits
```
❌ 500-line component
✅ Split into folder with index.ts
```

### 3. Don't Skip Status Updates
```
❌ End session without updating PHASE_STATUS.md
✅ Update status, note next steps
```

---

## ✅ Session End Checklist

Before ending ANY session, AI must:
- [ ] Update `PHASE_STATUS.md` with progress
- [ ] Mark completed tasks with [x]
- [ ] Note any issues found
- [ ] Confirm next steps

---

## 🆘 If Lost

1. **Don't know current task?** → Read `docs/PHASE_STATUS.md`
2. **Don't understand architecture?** → Check folder structure above
3. **Something broken?** → User reports with `issue: [description]`

---

*Last Updated: 2026-01-26*
*This document saves ~50-70% tokens per session!*
�#2cfile:///Users/homework/Documents/Egybag%20-%20codex%20version%2002:03:2026/docs/AI_SESSION_START.md