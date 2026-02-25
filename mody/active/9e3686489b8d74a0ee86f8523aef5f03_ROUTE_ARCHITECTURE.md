�# Route Architecture

> **Route Map for Egybag Application**

## 🏠 Main Routes

| Route | Purpose | Notes |
|-------|---------|-------|
| `/` | Marketing landing page | Public, "One Platform" hero |
| `/newlayout1` | **Dashboard** (main app) | Requires auth, "Welcome back!" |
| `/newlayout1/preview` | Store preview | Shows published site |
| `/newlayout1/preview/builder` | Visual builder | Editing experience |

## 🔗 Navigation Rules

### Logo Click Behavior
- **From Dashboard** → Stay at `/newlayout1` (NOT `/`)
- **From Builder** → Goes to `/newlayout1` (dashboard)
- **From Landing Page** → Stays at `/` 

### Back Button Behavior
- **Builder Back** → `/newlayout1` (dashboard)
- **Preview Back** → `/newlayout1` (dashboard)

### Publish Flow
- **After Publish** → `/newlayout1` (dashboard)

## ⚠️ Common Confusion Points

1. **`/` vs `/newlayout1`**: Root is marketing, newlayout1 is dashboard
2. **Logo in dashboard**: Must link to `/newlayout1`, NOT `/`
3. **Builder back**: Must go to `/newlayout1`, NOT `/newlayout1/preview`
�*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72�file:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/src/app/newlayout1/ROUTE_ARCHITECTURE.md:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version