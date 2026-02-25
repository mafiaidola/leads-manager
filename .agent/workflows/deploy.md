---
description: Deploy the latest code to GitHub and Vercel production
---

# Deploy Workflow

When the user runs `/deploy`, perform the following:

// turbo-all

1. Run TypeScript check:
```
npx tsc --noEmit
```

2. Stage all changes:
```
git add -A
```

3. Show status:
```
git status --short
```

4. Commit with descriptive message:
```
git commit -m "feat: <describe changes>"
```

5. Push to GitHub:
```
git push origin master
```

6. Deploy to Vercel:
```
npx vercel --prod
```

7. Verify the deployment URL is live and report back to user.
