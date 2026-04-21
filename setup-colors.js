const fs = require('fs');

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r} ${g} ${b}`;
}

const globalsFile = 'apps/web/app/globals.css';
let globalsCss = fs.readFileSync(globalsFile, 'utf8');

// Replace standard hex definitions with RGB components
globalsCss = globalsCss.replace(/(--[a-zA-Z0-9-]+):\s*(#[a-fA-F0-9]{6});/g, (match, varName, hexStr) => {
    return `${varName}: ${hexToRgb(hexStr)};`;
});

fs.writeFileSync(globalsFile, globalsCss);

const tailwindFile = 'apps/web/tailwind.config.ts';
let tailwindConfig = fs.readFileSync(tailwindFile, 'utf8');

// Replace standard var(--x) with rgb(var(--x) / <alpha-value>)
tailwindConfig = tailwindConfig.replace(/'var\((--[a-zA-Z0-9-]+)\)'/g, (match, varName) => {
    return `'rgb(var(${varName}) / <alpha-value>)'`;
});

fs.writeFileSync(tailwindFile, tailwindConfig);
console.log('Update successful!');
