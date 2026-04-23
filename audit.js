const fs = require('fs');
const glob = require('glob');

const routers = glob.sync('packages/api/src/modules/*/router.ts');

let totalRoutes = 0;
let validatedCount = 0;
let unvalidatedCount = 0;
const results = {};

routers.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    let insideRoute = false;
    let currentRoute = null;
    let hasValidation = false;
    let endpointLine = 0;
    
    // Check if the file imports Zod or similar globally
    const hasGlobalZod = /import.*z.*from.*zod/.test(content) || /parse/.test(content);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Find route definition
        const routeMatch = line.match(/^\s*(?:\w+Router)\.(post|put|patch)\(['"`](.*?)['"`]/);
        
        // Match standard endpoint
        if (routeMatch) {
            if (currentRoute) {
                if (!results[file]) results[file] = [];
                results[file].push({ method: currentRoute.method, path: currentRoute.path, validated: hasValidation, line: endpointLine });
                if (hasValidation) validatedCount++; else unvalidatedCount++;
                totalRoutes++;
            }
            currentRoute = { method: routeMatch[1].toUpperCase(), path: routeMatch[2] };
            hasValidation = false;
            endpointLine = i + 1;
            insideRoute = true;
        } 
        else if (insideRoute) {
            // Check for next route
            if (line.match(/^\s*(?:\w+Router)\.(get|delete)\(/) && i > endpointLine) {
                if (currentRoute) {
                    if (!results[file]) results[file] = [];
                    results[file].push({ method: currentRoute.method, path: currentRoute.path, validated: hasValidation, line: endpointLine });
                    if (hasValidation) validatedCount++; else unvalidatedCount++;
                    totalRoutes++;
                }
                currentRoute = null;
                insideRoute = false;
            } else {
                if (line.match(/\.parse\(/) || line.match(/\.safeParse\(/) || line.match(/valMiddleware/i) || line.match(/z\./)) {
                    hasValidation = true;
                }
            }
        }
    }
    
    if (currentRoute) {
        if (!results[file]) results[file] = [];
        results[file].push({ method: currentRoute.method, path: currentRoute.path, validated: hasValidation, line: endpointLine });
        if (hasValidation) validatedCount++; else unvalidatedCount++;
        totalRoutes++;
    }
});

let report = '# Audit Report\n\n';
report += `Total Endpoints checked: ${totalRoutes}\nValidated: ${validatedCount}\nUnvalidated: ${unvalidatedCount}\n\n`;

for (const [file, routes] of Object.entries(results)) {
    const unval = routes.filter(r => !r.validated);
    if (!unval.length) continue;
    report += `### ${file}\n`;
    unval.forEach(r => {
        report += `- [ ] Line ${r.line}: **${r.method}** \`${r.path}\`\n`;
    });
    report += '\n';
}

fs.writeFileSync('audit-zod.md', report);
console.log('Audit completed. Please check audit-zod.md');
