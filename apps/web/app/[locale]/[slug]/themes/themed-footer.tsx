import { ThemeStyleMap } from './theme-tokens';

export default function ThemedFooter({ config, property, themeTokens }: { config: any, property: any, themeTokens: ThemeStyleMap }) {
  return (
    <footer className="bg-surface-950 text-surface-400 py-12 px-6 border-t border-surface-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <h4 className="text-xl font-bold text-white mb-4">{property.name}</h4>
          <p className="text-sm text-surface-500 mb-6">{property.tagline || 'Experience luxury and comfort in every stay.'}</p>
        </div>
        <div>
          <h5 className="text-white font-semibold mb-4">Quick Links</h5>
          <ul className="space-y-2 text-sm">
            <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
            <li><a href="#rooms" className="hover:text-white transition-colors">Rooms & Suites</a></li>
            <li><a href="#gallery" className="hover:text-white transition-colors">Gallery</a></li>
          </ul>
        </div>
        <div>
          <h5 className="text-white font-semibold mb-4">Legal</h5>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Refund Policy</a></li>
          </ul>
        </div>
        <div>
          <h5 className="text-white font-semibold mb-4">Contact</h5>
          <address className="not-italic text-sm space-y-2">
            <p>{property.address}, {property.city}</p>
            {property.contactPhone && <p>📞 <a href={`tel:${property.contactPhone}`} className="hover:text-white">{property.contactPhone}</a></p>}
            {property.contactEmail && <p>✉️ <a href={`mailto:${property.contactEmail}`} className="hover:text-white">{property.contactEmail}</a></p>}
          </address>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-surface-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-xs">
        <p>© {new Date().getFullYear()} {property.name}. All rights reserved.</p>
        <p>Powered by iStays</p>
      </div>
    </footer>
  );
}
