/**
 * Inline Style Checker
 * Scans .tsx/.jsx files for React inline style= usage.
 * ALLOWED: style={{ '--my-var': val } as React.CSSProperties}  (CSS custom properties only)
 * FORBIDDEN: style={{ backgroundColor: 'red', width: '50px' }}  (direct CSS properties)
 *
 * Run: node scripts/check-inline-styles.mjs
 * Exit: 0 = clean, 1 = violations found
 */

import { readFileSync, readdirSync } from "fs";
import { join, relative, extname } from "path";

const ROOT = process.cwd();
const EXTENSIONS = new Set([".tsx", ".jsx"]);
const IGNORE_DIRS = new Set(["node_modules", ".next", ".git", "dist", "build", "mody"]);

function walk(dir) {
    const files = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (IGNORE_DIRS.has(entry.name)) continue;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) files.push(...walk(full));
        else if (EXTENSIONS.has(extname(entry.name))) files.push(full);
    }
    return files;
}

/**
 * Extract all style={{ ... }} blocks from file content.
 * Returns array of { line, block } where block is the inner content.
 */
function extractStyleBlocks(content) {
    const results = [];
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
        if (!/\bstyle\s*=\s*\{/.test(lines[i])) continue;

        // Build multi-line block (up to 15 lines)
        let block = "";
        for (let j = i; j < Math.min(i + 15, lines.length); j++) {
            block += lines[j] + "\n";
            // Check if we find closing }} or } as React.CSSProperties}
            if (/\}\s*(as\s+React\.CSSProperties\s*)?\}/.test(block)) break;
        }

        // Extract the inner style object
        const match = block.match(/style\s*=\s*\{\{([\s\S]*?)\}\s*(as\s+React\.CSSProperties)?\s*\}/);
        if (match) {
            results.push({ line: i + 1, block: match[1], raw: block.trim() });
        } else {
            // Could be style={someFunction()} — flag it
            const funcMatch = block.match(/style\s*=\s*\{([^{][\s\S]*?)\}/);
            if (funcMatch) {
                // Check if function returns CSS vars (heuristic: contains '--')
                const funcName = funcMatch[1].trim();
                // Follow the function to check — we can't easily, so flag it
                results.push({ line: i + 1, block: null, raw: lines[i].trim(), isFunc: true, funcName });
            }
        }
    }
    return results;
}

/**
 * Check if a style object contains ONLY CSS custom properties.
 * CSS custom properties start with '--'
 */
function isAllCSSVars(block) {
    if (!block) return false;
    // Split by comma, handle multi-line
    const pairs = block
        .split(/,(?![^(]*\))/) // split on commas not inside parens
        .map(s => s.trim())
        .filter(s => s.length > 0);

    return pairs.every(pair => {
        const key = pair.split(":")[0]?.trim().replace(/['"]/g, "");
        return key.startsWith("--");
    });
}

let violations = 0;
const results = [];

for (const file of walk(ROOT)) {
    const content = readFileSync(file, "utf-8");
    const blocks = extractStyleBlocks(content);

    for (const { line, block, raw, isFunc, funcName } of blocks) {
        // CSS-var-only blocks are allowed
        if (block !== null && isAllCSSVars(block)) continue;

        // Function calls with CSS vars in their return
        if (isFunc && funcName) {
            // Strip function arguments: getStatusChipStyle(currentStatus) → getStatusChipStyle
            const cleanName = funcName.replace(/\(.*$/, "").trim();
            // Try to find the function definition in same file and check if it returns CSS vars
            const escapedName = cleanName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const funcDef = content.match(new RegExp(`(?:const|function)\\s+${escapedName}[\\s\\S]{0,500}?return[\\s\\S]{0,200}?\\}`, "m"));
            if (funcDef && funcDef[0].includes("'--")) continue; // returns CSS vars
        }

        violations++;
        results.push({ file: relative(ROOT, file), line, content: raw.split("\n")[0] });
    }
}

if (violations > 0) {
    console.error(`\n❌ Found ${violations} inline style violation(s):\n`);
    for (const r of results) {
        console.error(`  ${r.file}:${r.line}`);
        console.error(`    ${r.content}\n`);
    }
    console.error("Fix: Move styles to CSS classes in app/globals.css using CSS custom properties.");
    console.error("Pattern: style={{ '--my-var': dynamicValue } as React.CSSProperties}");
    console.error("See 'Dynamic CSS Custom Property Utilities' section in globals.css.\n");
    process.exit(1);
} else {
    console.log("✅ No forbidden inline styles found. All dynamic styles use CSS custom properties.");
    process.exit(0);
}
