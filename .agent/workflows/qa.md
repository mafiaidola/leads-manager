---
description: Full QA — run browser tests on the production app to verify all pages work correctly
---

# QA Workflow

When the user runs `/qa`, perform the following:

1. Open the production URL: https://leads-manager-iota.vercel.app
2. Log in with: username=admin, password=Dola@2025, organization=Default Organization
3. Test each page:
   - **Dashboard** — KPI cards visible, activity feed loading, org overview stats?
   - **Leads (Table)** — table loads, status filters work, add lead button visible, search works?
   - **Leads (Board)** — switch to Board view, columns with status dots render, empty states show "No leads"?
   - **Reports** — analytics cards render, goal progress visible, export buttons work?
   - **Settings** — all 9 tabs visible (General, Products, Team, Branding, Roles, Account, System, WhatsApp, Organizations)?
   - **Audit Log** — entries visible, search + action/entity filters work?
4. Check notification bell in header
5. Take screenshots of each page
6. Report any broken elements, errors, or visual bugs
7. Produce a summary report with pass/fail for each page
