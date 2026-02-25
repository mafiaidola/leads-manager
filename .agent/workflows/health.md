---
description: Run a health check on the project — TypeScript, lint, DB connection, and build
---

# Health Check Workflow

When the user runs `/health`, perform the following:

// turbo-all

1. TypeScript check:
```
npx tsc --noEmit
```

2. ESLint check:
```
npm run lint
```

3. MongoDB connection check:
```
node -e "const m=require('mongoose');const d=require('dotenv');d.config({path:'.env.local'});m.connect(process.env.MONGODB_URI).then(()=>{console.log('✅ MongoDB connected');process.exit(0)}).catch(e=>{console.error('❌ MongoDB failed:',e.message);process.exit(1)})"
```

4. Check git status:
```
git status --short
```

5. Check last 5 commits:
```
git log -5 --oneline
```

6. Report summary to user showing pass/fail for each check.
