�# Codebase Map

> **Last Updated:** 2026-01-23  
> **Source of Truth:** Actual codebase always takes precedence over this document.

Quick reference for AI to locate features and understand project structure.

> [!IMPORTANT]
> This is a reference guide, NOT a replacement for reading code.
> Always verify against actual files for critical decisions.

---

## 📁 Project Structure Overview

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Admin dashboard pages 
│   ├── s/[subdomain]/     # Storefront (public-facing)
│   └── store-builder/     # Puck-based store editor
├── components/            # Shared React components
├── hooks/                 # Shared custom hooks
├── lib/                   # Utilities and configs
└── styles/                # Global CSS
```

---

## 🔌 API Routes

| Endpoint | Purpose | File |
|----------|---------|------|
| `/api/products` | Product CRUD | `src/app/api/products/route.ts` |
| `/api/funnels` | Funnel CRUD | `src/app/api/funnels/route.ts` |
| `/api/stores` | Store management | `src/app/api/stores/route.ts` |
| `/api/categories` | Category CRUD | `src/app/api/categories/route.ts` |
| `/api/orders` | Order management | `src/app/api/orders/route.ts` |
| `/api/customers` | Customer data | `src/app/api/customers/route.ts` |
| `/api/storefront/*` | Public store APIs | `src/app/api/storefront/` |

---

## 🪝 Hooks by Domain

### Products
- `useProducts` - List with filters/pagination
- `useProduct` - Single product by ID
- `useCreateProduct`, `useUpdateProduct`, `useDeleteProduct`

### Funnels
- `useFunnels` - List funnels
- `useFunnel` - Single funnel
- `useCreateFunnel`, `useUpdateFunnel`
- `useFunnelEditor` - Full editor state (470 lines)

### Auth
- `useAuth` - Auth context with `currentStore`, `user`, `isLoading`

### Templates
- `useFunnelTemplates` - Funnel templates list
- `useStoreTemplates` - Store templates list

---

## 🎨 UI Component Library

Located in `src/components/ui/`:
- Button, Input, Label, Card, Dialog, Select
- Dropdown, Tabs, Tooltip, Checkbox, Switch
- Toast via `sonner`

---

## 🏪 Key Dashboard Pages

| Page | Path | Purpose |
|------|------|---------|
| Products | `/dashboard/products` | Product management |
| Funnels | `/dashboard/funnels` | Funnel list |
| Funnel Editor | `/dashboard/funnels/[id]` | Edit funnel |
| Store Builder | `/store-builder` | Puck editor |
| Orders | `/dashboard/orders` | Order management |
| Customers | `/dashboard/customers` | Customer data |

---

## 🗄️ Database (Supabase)

### Core Tables
- `stores` - Multi-tenant stores
- `products` - Store products
- `categories` - Product categories
- `orders` - Customer orders
- `funnels` - Landing pages
- `funnel_templates` - Reusable templates
- `store_pages` - Custom pages (Puck data)
- `customers` - Store customers

### Key Relationships
- All tables have `store_id` for multi-tenancy
- Products → Categories (many-to-one)
- Orders → Customers (many-to-one)
- Funnels → Templates (optional)

---

## 🔐 Auth Flow

Firebase Auth → Supabase user sync
- AuthProvider wraps app
- `useAuth()` hook for access
- RLS policies on all tables

---

## 📦 Heavy Dependencies

| Package | Size | Usage |
|---------|------|-------|
| `@measured/puck` | ~500KB | Store builder |
| `lucide-react` | Tree-shakes | Icons |
| `@radix-ui/*` | Per-component | UI primitives |
| `@tanstack/react-query` | ~40KB | Data fetching |
�"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72�file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/.agent/CODEBASE_MAP.md:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version