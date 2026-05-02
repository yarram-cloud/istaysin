const fs = require('fs');
const path = require('path');
const dir = 'app/[locale]/[slug]/themes';

const files = [
  'themed-awards.tsx',
  'themed-contact.tsx',
  'themed-hero.tsx',
  'themed-location.tsx',
  'themed-offers.tsx',
  'themed-rate-comparison.tsx',
  'themed-booking-widget.tsx',
  'themed-amenities.tsx',
  'themed-gallery.tsx',
  'themed-stats.tsx',
  'themed-faq.tsx',
  'themed-policies.tsx',
  'themed-reviews.tsx',
  'themed-nearby.tsx',
  'themed-footer.tsx',
  'themed-header.tsx',
];

files.forEach(f => {
  const fp = path.join(dir, f);
  if (!fs.existsSync(fp)) return;
  let c = fs.readFileSync(fp, 'utf8');
  const before = (c.match(/motion\./g) || []).length;
  if (before === 0) return;

  // Replace motion elements with plain HTML
  c = c.replace(/<motion\.div/g, '<div');
  c = c.replace(/<\/motion\.div>/g, '</div>');
  c = c.replace(/<motion\.h2/g, '<h2');
  c = c.replace(/<\/motion\.h2>/g, '</h2>');
  c = c.replace(/<motion\.h3/g, '<h3');
  c = c.replace(/<\/motion\.h3>/g, '</h3>');
  c = c.replace(/<motion\.p/g, '<p');
  c = c.replace(/<\/motion\.p>/g, '</p>');
  c = c.replace(/<motion\.span/g, '<span');
  c = c.replace(/<\/motion\.span>/g, '</span>');
  c = c.replace(/<motion\.a/g, '<a');
  c = c.replace(/<\/motion\.a>/g, '</a>');
  c = c.replace(/<motion\.li/g, '<li');
  c = c.replace(/<\/motion\.li>/g, '</li>');
  c = c.replace(/<motion\.ul/g, '<ul');
  c = c.replace(/<\/motion\.ul>/g, '</ul>');
  c = c.replace(/<motion\.button/g, '<button');
  c = c.replace(/<\/motion\.button>/g, '</button>');
  c = c.replace(/<motion\.section/g, '<section');
  c = c.replace(/<\/motion\.section>/g, '</section>');
  c = c.replace(/<motion\.header/g, '<header');
  c = c.replace(/<\/motion\.header>/g, '</header>');
  c = c.replace(/<motion\.nav/g, '<nav');
  c = c.replace(/<\/motion\.nav>/g, '</nav>');
  c = c.replace(/<motion\.img/g, '<img');
  c = c.replace(/<\/motion\.img>/g, '</img>');

  // Remove animation-specific props (multi-line friendly)
  c = c.replace(/ variants=\{[^}]+\}/g, '');
  c = c.replace(/ initial="hidden"/g, '');
  c = c.replace(/ whileInView="visible"/g, '');
  c = c.replace(/ viewport=\{[^}]+\}/g, '');
  c = c.replace(/ initial=\{\{[^}]*\}\}/g, '');
  c = c.replace(/ whileInView=\{\{[^}]*\}\}/g, '');
  c = c.replace(/ transition=\{\{[^}]*\}\}/g, '');
  c = c.replace(/ animate=\{\{[^}]*\}\}/g, '');
  c = c.replace(/ exit=\{\{[^}]*\}\}/g, '');
  
  // Remove motion import line
  c = c.replace(/import \{ motion \} from 'framer-motion';\n/g, '');
  c = c.replace(/import \{ motion, AnimatePresence \} from 'framer-motion';\n/g, '');
  c = c.replace(/import \{ AnimatePresence, motion \} from 'framer-motion';\n/g, '');

  // Remove unused animation variables
  c = c.replace(/\s*const fadeUp\w* = \{[^;]+;\n/g, '\n');
  c = c.replace(/\s*const stagger\w* = \{[^;]+;\n/g, '\n');
  c = c.replace(/\s*const vp = \{[^;]+;\n/g, '\n');

  // Replace <AnimatePresence> wrappers
  c = c.replace(/<AnimatePresence>/g, '<>');
  c = c.replace(/<\/AnimatePresence>/g, '</>');
  c = c.replace(/<AnimatePresence mode="wait">/g, '<>');

  const after = (c.match(/motion\./g) || []).length;
  fs.writeFileSync(fp, c);
  console.log(`${f}: ${before} -> ${after} motion refs`);
});

console.log('\nDone!');
