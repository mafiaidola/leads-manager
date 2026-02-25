---
description: Full QA — run browser tests on the production app to verify all pages work correctly
---

# QA Workflow

When the user runs `/qa`, perform the following:

1. Open the production URL: https://leads-manager-iota.vercel.app
2. Log in with: username=admin, password=admin123
3. Test each page:
   - **Dashboard** — KPI cards visible?
   - **Leads** — table loads, filters work, add lead button visible?
   - **Reports** — charts render, export buttons visible?
   - **Settings** — configuration panels load?
   - **Audit Log** — entries visible?
4. Check notification bell in header
5. Take screenshots of each page
6. Report any broken elements, errors, or visual bugs
7. Produce a summary report with pass/fail for each page
