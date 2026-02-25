™#!/usr/bin/env node
/**
 * AI Status Generator - Creates a compact project status for AI agents
 * Usage: npm run ai:status
 * Output: <60 lines that fit entirely in AI context
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');

function getFileSizeViolations() {
    try {
        const output = execSync('npm run lint:file-size 2>&1', {
            cwd: PROJECT_ROOT,
            encoding: 'utf-8'
        });
        const violations = output.match(/VIOLATIONS.*?(?=\n\n|\nâš |$)/s);
        if (violations) {
            const lines = violations[0].split('\n').slice(1, 6); // Top 5 violations
            return lines.length > 0 ? lines : ['None'];
        }
        return ['âœ… All files OK'];
    } catch (e) {
        return ['Could not check'];
    }
}

function getBuildStatus() {
    try {
        execSync('npm run build 2>&1 | tail -5', { cwd: PROJECT_ROOT, encoding: 'utf-8' });
        return 'âœ… Build passes';
    } catch (e) {
        return 'âŒ Build has errors - run npm run build';
    }
}

function getCurrentWorkSummary() {
    try {
        const workPath = path.join(PROJECT_ROOT, 'src/app/newlayout1/CURRENT_WORK.md');
        const content = fs.readFileSync(workPath, 'utf-8');
        const lines = content.split('\n').slice(0, 20); // First 20 lines
        const latestSession = lines.find(l => l.includes('Session -'));
        return latestSession || 'Check CURRENT_WORK.md';
    } catch (e) {
        return 'No CURRENT_WORK.md found';
    }
}

// Generate status
console.log('# AI Project Status');
console.log(`> Generated: ${new Date().toISOString().split('T')[0]}`);
console.log('');
console.log('## Build Status');
console.log(getBuildStatus());
console.log('');
console.log('## Top File Size Violations');
getFileSizeViolations().forEach(v => console.log(v));
console.log('');
console.log('## Latest Session');
console.log(getCurrentWorkSummary());
console.log('');
console.log('## Quick Commands');
console.log('- `npm run build` - Check build');
console.log('- `npm run lint:file-size` - Check sizes');
console.log('- `npm run dev` - Start server');
™*cascade08"(12a9a5be88f595131dc08b1ed23b1a4677f7dbc72ˆfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version/scripts/ai-status.js:sfile:///Users/homework/Documents/Egybag-Gemini%20Version%202026/Egybag-gemini%202026/Egybag-Gemini%202026%20Version