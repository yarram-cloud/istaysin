const fs = require('fs');
const path = 'app/[locale]/[slug]/themes/themed-rooms.tsx';
let c = fs.readFileSync(path, 'utf8');

// Replace all motion elements with regular HTML
c = c.replace(/<motion\.div/g, '<div');
c = c.replace(/<\/motion\.div>/g, '</div>');
c = c.replace(/<motion\.h2/g, '<h2');
c = c.replace(/<\/motion\.h2>/g, '</h2>');
c = c.replace(/<motion\.p/g, '<p');
c = c.replace(/<\/motion\.p>/g, '</p>');
c = c.replace(/<motion\.span/g, '<span');
c = c.replace(/<\/motion\.span>/g, '</span>');

// Remove animation props
c = c.replace(/ variants=\{staggerContainer\}/g, '');
c = c.replace(/ variants=\{fadeUpVariant\}/g, '');
c = c.replace(/ initial="hidden"/g, '');
c = c.replace(/ whileInView="visible"/g, '');
c = c.replace(/ viewport=\{vp\}/g, '');

// Remove inline animation props: initial={{...}} whileInView={{...}} transition={{...}}
c = c.replace(/ initial=\{\{[^}]*\}\}/g, '');
c = c.replace(/ whileInView=\{\{[^}]*\}\}/g, '');
c = c.replace(/ transition=\{\{[^}]*\}\}/g, '');

// Fix dark-elegance horizontal overflow: -ml-20 and -mr-20
c = c.replace(/'-ml-20'/g, "''");
c = c.replace(/'lg:order-1 -mr-20 z-10'/g, "'lg:order-1 z-10'");
c = c.replace(/-ml-20/g, 'lg:-ml-12');
c = c.replace(/-mr-20/g, 'lg:-mr-12');

// Add overflow-hidden to sections missing it
c = c.replace(/className="py-40 bg-black text-white relative"/g, 'className="py-40 bg-black text-white relative overflow-hidden"');
c = c.replace(/className="py-32 bg-\[#E5E0D8\]"/g, 'className="py-32 bg-[#E5E0D8] overflow-hidden"');
c = c.replace(/className="py-32 bg-\[#F8FAFC\]"/g, 'className="py-32 bg-[#F8FAFC] overflow-hidden"');
c = c.replace(/className="py-32 bg-white relative border-b-8/g, 'className="py-32 bg-white relative overflow-hidden border-b-8');
c = c.replace(/className="py-40 bg-gray-100"/g, 'className="py-40 bg-gray-100 overflow-hidden"');
c = c.replace(/className="py-24 bg-\[#111\] text-white"/g, 'className="py-24 bg-[#111] text-white overflow-hidden"');

fs.writeFileSync(path, c);
console.log('Done - rooms cleaned');
