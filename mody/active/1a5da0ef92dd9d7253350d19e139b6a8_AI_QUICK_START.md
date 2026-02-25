�# AI Quick Start (READ ENTIRE FILE - 55 lines)

> **Usage**: `Read @AI_QUICK_START.md` at start of every session

---

## 🚨 5 Rules (Memorize)

1. **Files <120 lines** (hard max 150) - Run `npm run lint:file-size`
2. **Build after changes** - Run `npm run build`
3. **store_id in ALL queries** - Multi-tenant security
4. **Update CURRENT_WORK.md** - Before ending any session
5. **No loops with DB calls** - Use joins instead

---

## ⚡ Commands

```bash
npm run build           # After ANY code change
npm run lint:file-size  # Before commits
npm run dev             # Start dev server
```

---

## 📂 Key Locations

| Need | File |
|------|------|
| Backend rules | `docs/AI_RULES_BACKEND.md` |
| Frontend rules | `docs/AI_RULES_FRONTEND.md` |
| Full rules | `docs/golden_rules.md` |
| Current work | `src/app/newlayout1/CURRENT_WORK.md` |
| Builder context | `src/app/newlayout1/MOCKUP_CONTEXT.md` |

---

## 🗄️ Existing APIs (Don't Recreate)

| Entity | API | Hooks |
|--------|-----|-------|
| stores | `/api/stores` | `useStores` |
| products | `/api/products` | `useProducts`, `useCreateProduct` |
| orders | `/api/orders` | `useOrders`, `useUpdateOrderStatus` |
| categories | `/api/categories` | `useCategories` |
| customers | `/api/customers` | `useCustomers` |
| discounts | `/api/discounts` | - |

---

## 🔀 Workflows

| Workflow | When |
|----------|------|
| `/egybag` | Start here |
| `/add-api` | New API endpoint |
| `/complete-task` | Before marking done |
�*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72�file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/AI_QUICK_START.md:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version