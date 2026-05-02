const fs = require('fs');

// Fix hero
let hero = fs.readFileSync('app/[locale]/[slug]/themes/themed-hero.tsx', 'utf8');
hero = hero.replace(/<motion\.h1/g, '<h1');
hero = hero.replace(/<\/motion\.h1>/g, '</h1>');
hero = hero.replace(/import \{ motion, useScroll, useTransform \} from 'framer-motion';\n/g, '');
// Remove any remaining animation props on h1
hero = hero.replace(/ style=\{\{[^}]*textShadow[^}]*\}\}/g, '');
fs.writeFileSync('app/[locale]/[slug]/themes/themed-hero.tsx', hero);
const heroLeft = (hero.match(/motion/g) || []).length;
console.log('hero motion refs remaining:', heroLeft);

// Fix location
let loc = fs.readFileSync('app/[locale]/[slug]/themes/themed-location.tsx', 'utf8');
loc = loc.replace(/<motion\.address/g, '<address');
loc = loc.replace(/<\/motion\.address>/g, '</address>');
loc = loc.replace(/import \{ motion, useScroll, useTransform \} from 'framer-motion';\n/g, '');
loc = loc.replace(/import \{ motion \} from 'framer-motion';\n/g, '');
fs.writeFileSync('app/[locale]/[slug]/themes/themed-location.tsx', loc);
const locLeft = (loc.match(/motion/g) || []).length;
console.log('location motion refs remaining:', locLeft);

console.log('Done!');
