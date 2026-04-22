'use client';

import { useEffect, useState, useRef } from 'react';
import { tenantsApi, roomsApi, uploadApi } from '@/lib/api';
import { 
  Palette, Image as ImageIcon, Layout, Globe, Save, Loader2, Plus, Trash2, 
  Languages, Info, BarChart3, Wifi, BedDouble, ImagePlus, MapPin, 
  Star, HelpCircle, Shield, MonitorDown, Code, Terminal, Link2, Component,
  Upload, Check, ChevronDown, X,
  Waves, UtensilsCrossed, Car, Wind, Tv, Coffee, Bath, Dumbbell,
  TreePine, Flame, ParkingCircle, ShieldCheck, Baby, Dog, Shirt,
  Refrigerator, Phone, Lock, Sparkles, Mountain, Sun, Sunrise,
  GlassWater, Umbrella, Gamepad2, Music, BookOpen, Accessibility
} from 'lucide-react';

// Curated hospitality icons for the visual picker
const HOSPITALITY_ICONS: { id: string; label: string; icon: any }[] = [
  { id: 'Wifi', label: 'Free WiFi', icon: Wifi },
  { id: 'Waves', label: 'Pool', icon: Waves },
  { id: 'UtensilsCrossed', label: 'Restaurant', icon: UtensilsCrossed },
  { id: 'Car', label: 'Parking', icon: Car },
  { id: 'Wind', label: 'Air Conditioning', icon: Wind },
  { id: 'Tv', label: 'Television', icon: Tv },
  { id: 'Coffee', label: 'Tea/Coffee', icon: Coffee },
  { id: 'Bath', label: 'Spa / Bath', icon: Bath },
  { id: 'Dumbbell', label: 'Gym / Fitness', icon: Dumbbell },
  { id: 'TreePine', label: 'Garden', icon: TreePine },
  { id: 'Flame', label: 'Bonfire', icon: Flame },
  { id: 'ParkingCircle', label: 'Valet Parking', icon: ParkingCircle },
  { id: 'ShieldCheck', label: '24/7 Security', icon: ShieldCheck },
  { id: 'Baby', label: 'Child Friendly', icon: Baby },
  { id: 'Dog', label: 'Pet Friendly', icon: Dog },
  { id: 'Shirt', label: 'Laundry', icon: Shirt },
  { id: 'Refrigerator', label: 'Mini Bar', icon: Refrigerator },
  { id: 'Phone', label: 'Room Service', icon: Phone },
  { id: 'Lock', label: 'Safe Locker', icon: Lock },
  { id: 'Sparkles', label: 'Housekeeping', icon: Sparkles },
  { id: 'Mountain', label: 'Mountain View', icon: Mountain },
  { id: 'Sun', label: 'Terrace', icon: Sun },
  { id: 'Sunrise', label: 'Balcony', icon: Sunrise },
  { id: 'BedDouble', label: 'Extra Bed', icon: BedDouble },
  { id: 'GlassWater', label: 'Bar / Lounge', icon: GlassWater },
  { id: 'Umbrella', label: 'Beach Access', icon: Umbrella },
  { id: 'Gamepad2', label: 'Game Room', icon: Gamepad2 },
  { id: 'Music', label: 'Live Music', icon: Music },
  { id: 'BookOpen', label: 'Library', icon: BookOpen },
  { id: 'Accessibility', label: 'Wheelchair Access', icon: Accessibility },
  { id: 'MapPin', label: 'Location', icon: MapPin },
  { id: 'Star', label: 'Premium', icon: Star },
];

const THEMES = [
  { id: 'luxury-gold', name: 'Luxury Gold' },
  { id: 'modern-minimal', name: 'Modern Minimal' },
  { id: 'corporate-trust', name: 'Corporate Trust' },
  { id: 'boutique-chic', name: 'Boutique Chic' },
  { id: 'dark-elegance', name: 'Dark Elegance' },
  { id: 'classic-heritage', name: 'Classic Heritage' },
  { id: 'resort-tropical', name: 'Resort Tropical' },
  { id: 'playful-vibrant', name: 'Playful Vibrant' },
  { id: 'compact-urban', name: 'Compact Urban' },
  { id: 'retro-vintage', name: 'Retro Vintage' },
  { id: 'nature-eco', name: 'Nature Eco' },
  { id: 'abstract-art', name: 'Abstract Art' }
];

export default function WebsiteBuilderPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [targetLang, setTargetLang] = useState('hi');
  const [tenantSlug, setTenantSlug] = useState('suma1');
  const isInitialLoad = useRef(true);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [iconPickerOpen, setIconPickerOpen] = useState<number | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  // Core Columns
  const [brandLogo, setBrandLogo] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0ea5e9');
  const [secondaryColor, setSecondaryColor] = useState('#38bdf8');
  const [tagline, setTagline] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [description, setDescription] = useState('');

  // 16 Component Configs Mapping directly to apps/web/app/[locale]/[slug]/themes/themed-*.tsx
  const [websiteConfig, setWebsiteConfig] = useState<any>({
    theme: 'modern-minimal',
    fontHeading: 'inter',
    fontBody: 'inter',
    borderRadius: 'rounded-2xl',
    darkMode: 'light',
    components: {
      header: { enabled: true, style: 'default' },
      hero: { enabled: true, headline: '', subheadline: '', buttonText: 'Book Now' },
      about: { enabled: true, title: 'About Us', contentHtml: '', image: '' },
      stats: { enabled: true, stats: [] },
      amenities: { enabled: true, title: 'Our Amenities', list: [] },
      rooms: { enabled: true, title: 'Our Rooms', subtitle: 'Experience comfort', limit: 6 },
      gallery: { enabled: true, title: 'Gallery', images: [] },
      nearby: { enabled: true, title: 'Explore Nearby', places: [] },
      reviews: { enabled: true, title: 'Guest Reviews', limit: 3 },
      faq: { enabled: true, title: 'Frequently Asked Questions', questions: [] },
      policies: { enabled: true, title: 'Hotel Policies', contentHtml: '' },
      footer: { enabled: true, text: '', socialLinks: { facebook: '', instagram: '', twitter: '' } },
      seo: { title: '', description: '', keywords: '' },
      scripts: { head: '', body: '' },
      advanced: { customCss: '' },
      domain: { customDomain: '' }
    }
  });

  useEffect(() => {
    Promise.all([
      tenantsApi.getSettings(),
      roomsApi.getRoomTypes().catch(() => ({ success: false, data: [] }))
    ])
      .then(([settingsRes, roomsRes]) => {
        if (settingsRes.success && settingsRes.data) {
          const d = settingsRes.data;
          setTenantSlug(d.slug || 'suma1');
          setBrandLogo(d.brandLogo || '');
          setPrimaryColor(d.primaryColor || '#0ea5e9');
          setSecondaryColor(d.secondaryColor || '#38bdf8');
          setTagline(d.tagline || '');
          setHeroImage(d.heroImage || '');
          setDescription(d.description || '');

          const config = d.config?.websiteBuilder || {};
          if (config.components || config.theme) {
            setWebsiteConfig((prev: any) => ({
                ...prev,
                theme: config.theme || 'modern-minimal',
                fontHeading: config.fontHeading || 'inter',
                fontBody: config.fontBody || 'inter',
                borderRadius: config.borderRadius || 'rounded-2xl',
                darkMode: config.darkMode || 'light',
                components: { ...prev.components, ...config.components }
            }));
          }
        }
        if (roomsRes.success && Array.isArray(roomsRes.data)) {
          setRoomTypes(roomsRes.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isInitialLoad.current) { isInitialLoad.current = false; return; }
    if (loading) return;
    const timer = setTimeout(() => {
      handleSave(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [websiteConfig, brandLogo, primaryColor, secondaryColor, tagline, heroImage, description]);

  async function handleSave(silent = false) {
    if (!silent) setSaving(true);
    try {
      await tenantsApi.updateSettings({
        brandLogo, primaryColor, secondaryColor, tagline, heroImage, description,
        config: { websiteBuilder: websiteConfig }
      });
      if (!silent) alert('Website mapped & published successfully! Edge CDN purged.');
      
      // Auto refresh the preview iframe
      const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.location.reload();
      }
    } catch (err: any) {
      if (!silent) alert(err.message || 'Failed to save settings');
    } finally {
      if (!silent) setSaving(false);
    }
  }

  async function handleTranslate() {
    if (!confirm(`Translate entire website component text to ${targetLang.toUpperCase()}? This will overwrite English fields.`)) return;
    setTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetLanguage: targetLang,
          content: websiteConfig.components
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setWebsiteConfig({ ...websiteConfig, components: data.translatedContent });
      alert('Translation Complete!');
    } catch (err: any) {
      alert(err.message || 'Translation failed');
    } finally {
      setTranslating(false);
    }
  }

  function updateComponent(key: string, updates: any) {
    setWebsiteConfig((prev: any) => ({
      ...prev,
      components: {
        ...prev.components,
        [key]: { ...prev.components[key], ...updates }
      }
    }));
  }

  async function handleFileUpload(field: string, setter?: (url: string) => void) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploading(field);
      try {
        const res = await uploadApi.uploadFile(file);
        if (res.url) {
          if (setter) setter(res.url);
        }
      } catch {
        alert('Upload failed. Please try pasting the URL instead.');
      } finally {
        setUploading(null);
      }
    };
    input.click();
  }

  if (loading) {
    return <div className="p-8 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }

  const sidemenu = [
    { section: 'Global Configuration', items: [
      { id: 'general', label: 'Theme & Brand styling', icon: Palette },
      { id: 'components_toggle', label: 'Component Switchboard', icon: Component },
    ]},
    { section: 'Website Content', items: [
      { id: 'header', label: '1. Header & Nav', icon: Layout },
      { id: 'hero', label: '2. Hero Banner', icon: ImageIcon },
      { id: 'about', label: '3. About Section', icon: Info },
      { id: 'stats', label: '4. Highlights & Stats', icon: BarChart3 },
      { id: 'amenities', label: '5. Amenities List', icon: Wifi },
      { id: 'rooms', label: '6. Rooms Showcase', icon: BedDouble },
      { id: 'gallery', label: '7. Photo Gallery', icon: ImagePlus },
      { id: 'nearby', label: '8. Nearby Places', icon: MapPin },
      { id: 'reviews', label: '9. Guest Reviews', icon: Star },
      { id: 'faq', label: '10. FAQ Section', icon: HelpCircle },
      { id: 'policies', label: '11. House Policies', icon: Shield },
      { id: 'footer', label: '12. Footer & Socials', icon: MonitorDown },
    ]},
    { section: 'Advanced Operations', items: [
      { id: 'seo', label: '13. SEO & Meta Tags', icon: Globe },
      { id: 'scripts', label: '14. Tracking Scripts', icon: Code },
      { id: 'advanced', label: '15. Advanced CSS', icon: Terminal },
      { id: 'domain', label: '16. Custom Domain', icon: Link2 },
    ]}
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-surface-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-bold mb-1 text-surface-900">Website Builder</h1>
          <p className="text-surface-500">Fully authorable components managing the direct booking engine.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center bg-surface-50 rounded-xl p-1 border border-surface-200 shadow-sm">
            <select 
              value={targetLang} onChange={e => setTargetLang(e.target.value)}
              className="bg-transparent text-surface-800 px-3 py-1.5 outline-none text-sm border-r border-surface-200 font-medium"
            >
              <option value="hi">Hindi</option>
              <option value="te">Telugu</option>
              <option value="ta">Tamil</option>
              <option value="kn">Kannada</option>
              <option value="ml">Malayalam</option>
              <option value="fr">French</option>
              <option value="es">Spanish</option>
              <option value="ar">Arabic</option>
            </select>
            <button 
              onClick={handleTranslate} disabled={translating}
              className="px-4 py-1.5 text-sm font-bold text-primary-700 hover:text-primary-800 transition-colors flex items-center gap-2"
            >
              {translating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
              AI Translate
            </button>
          </div>
          <a
            href={`/en/${tenantSlug}`}
            target="_blank"
            rel="noreferrer"
            className="bg-surface-100 hover:bg-surface-200 text-surface-700 px-6 py-2.5 rounded-xl font-semibold inline-flex items-center gap-2 transition-colors shadow-sm border border-surface-200"
          >
            <Globe className="w-4 h-4" />
            Live Preview
          </a>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="bg-primary-700 hover:bg-primary-600 text-white px-8 py-2.5 rounded-xl font-semibold inline-flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Publish
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-6 shrink-0">
          {sidemenu.map(group => (
             <div key={group.section} className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden p-3 mb-6">
                <h3 className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2 px-3 pt-2">{group.section}</h3>
                <div className="flex flex-col gap-1">
                  {group.items.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors w-full text-left ${
                        activeTab === t.id ? 'bg-primary-50 text-primary-700 border-none' : 'text-surface-600 hover:text-surface-900 hover:bg-surface-50'
                      }`}
                    >
                      <t.icon className={`w-4 h-4 ${activeTab === t.id ? 'text-primary-500' : 'text-surface-400'}`} />
                      {t.label}
                    </button>
                  ))}
                </div>
             </div>
          ))}
        </div>

        {/* Content Configuration Panel */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-surface-200 shadow-sm p-6 sm:p-8 min-h-[600px]">
          
          {/* General Theme Tab */}
          {activeTab === 'general' && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-surface-900 mb-2">Brand Identity & Theme Engine</h2>
                <p className="text-surface-500 text-sm">Select a master theme structure and configure your primary colors.</p>
              </div>
              
              <div className="space-y-4">
                <label className="text-sm font-semibold text-surface-900">12 Premium Architectures</label>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 border-t border-surface-100 pt-4">
                  {THEMES.map(theme => (
                    <button key={theme.id} onClick={() => setWebsiteConfig({ ...websiteConfig, theme: theme.id })}
                      className={`p-4 rounded-xl border text-sm text-center font-bold transition-all shadow-sm ${
                        websiteConfig.theme === theme.id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-surface-200 text-surface-600 hover:border-primary-300 hover:bg-surface-50'
                      }`}
                    >
                      {theme.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-surface-100">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2">Color Palette</h3>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-surface-600 uppercase tracking-wider">Primary Color</label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border border-surface-200 bg-white" />
                        <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="input-field shadow-sm uppercase flex-1 text-sm py-1.5" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-surface-600 uppercase tracking-wider">Secondary Color</label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer border border-surface-200 bg-white" />
                        <input type="text" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="input-field shadow-sm uppercase flex-1 text-sm py-1.5" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2">Typography Setup</h3>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-surface-600 uppercase tracking-wider">Heading Font</label>
                      <select value={websiteConfig.fontHeading} onChange={e => setWebsiteConfig({ ...websiteConfig, fontHeading: e.target.value })} className="input-field shadow-sm text-sm">
                        <option value="inter">Inter (Clean System)</option>
                        <option value="playfair">Playfair Display (Serif)</option>
                        <option value="montserrat">Montserrat (Modern)</option>
                        <option value="merriweather">Merriweather (Classic)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-surface-600 uppercase tracking-wider">Body Font</label>
                      <select value={websiteConfig.fontBody} onChange={e => setWebsiteConfig({ ...websiteConfig, fontBody: e.target.value })} className="input-field shadow-sm text-sm">
                        <option value="inter">Inter (Legible)</option>
                        <option value="roboto">Roboto (Standard)</option>
                        <option value="open-sans">Open Sans (Friendly)</option>
                        <option value="lato">Lato (Soft)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2">Layout Guidelines</h3>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-surface-600 uppercase tracking-wider">Corner Styles</label>
                      <select value={websiteConfig.borderRadius} onChange={e => setWebsiteConfig({ ...websiteConfig, borderRadius: e.target.value })} className="input-field shadow-sm text-sm">
                        <option value="rounded-none">Sharp Corners (0px)</option>
                        <option value="rounded-md">Slight Curve (6px)</option>
                        <option value="rounded-xl">Soft Curved (12px)</option>
                        <option value="rounded-2xl">Modern Pill (16px+)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-surface-600 uppercase tracking-wider">Dark Mode Logic</label>
                      <select value={websiteConfig.darkMode} onChange={e => setWebsiteConfig({ ...websiteConfig, darkMode: e.target.value })} className="input-field shadow-sm text-sm">
                        <option value="light">Strictly Light Mode</option>
                        <option value="dark">Strictly Dark Mode</option>
                        <option value="auto">Auto (Visitor Preference)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-surface-900 border-b border-surface-100 pb-2">Logos & Assets</h3>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-surface-600 uppercase tracking-wider">Brand Logo URL</label>
                      <input type="url" value={brandLogo} onChange={(e) => setBrandLogo(e.target.value)} className="input-field shadow-sm text-sm" placeholder="https://..." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-surface-600 uppercase tracking-wider">Default Tagline</label>
                      <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} className="input-field shadow-sm text-sm" placeholder="Your luxurious getaway..." />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Master Component Switchboard */}
          {activeTab === 'components_toggle' && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl font-bold text-surface-900 mb-2">Component Switchboard</h2>
                <p className="text-surface-500 text-sm">Toggle sections entirely on or off for the live website.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 border-t border-surface-100 pt-6">
                {[
                  'header','hero','about','stats','amenities','rooms',
                  'gallery','nearby','reviews','faq','policies','footer'
                ].map(key => (
                  <label key={key} className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${
                    websiteConfig.components[key]?.enabled ? 'bg-primary-50/50 border-primary-200' : 'bg-surface-50 border-surface-200'
                  }`}>
                    <span className="capitalize text-sm font-bold text-surface-900">{key}</span>
                    <input type="checkbox" checked={websiteConfig.components[key]?.enabled || false}
                      onChange={e => updateComponent(key, { enabled: e.target.checked })}
                      className="w-5 h-5 rounded border-surface-300 text-primary-600 focus:ring-primary-500 transition-colors cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 1. Header */}
          {activeTab === 'header' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-surface-900 mb-2 border-b border-surface-100 pb-4">1. Header / Navigation</h2>
              <div className="space-y-2 max-w-md">
                <label className="text-sm font-medium text-surface-900">Navigation Layout Style</label>
                <select value={websiteConfig.components.header?.style || 'default'} onChange={e => updateComponent('header', { style: e.target.value })} className="input-field shadow-sm">
                  <option value="default">Default Navbar</option>
                  <option value="minimal">Minimal / Transparent</option>
                  <option value="center">Centered Logo</option>
                </select>
              </div>
            </div>
          )}

          {/* 2. Hero */}
          {activeTab === 'hero' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-surface-900 mb-2 border-b border-surface-100 pb-4">2. Hero Banner Configuration</h2>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-900">Headline</label>
                  <input type="text" value={websiteConfig.components.hero?.headline || ''} onChange={e => updateComponent('hero', { headline: e.target.value })} className="input-field shadow-sm" placeholder="e.g. A Haven of Peace" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-900">Subheadline</label>
                  <input type="text" value={websiteConfig.components.hero?.subheadline || ''} onChange={e => updateComponent('hero', { subheadline: e.target.value })} className="input-field shadow-sm" placeholder="Welcome description..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-900">Call to Action Button Text</label>
                  <input type="text" value={websiteConfig.components.hero?.buttonText || ''} onChange={e => updateComponent('hero', { buttonText: e.target.value })} className="input-field shadow-sm" placeholder="Book Now" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-900">Background Image URL</label>
                  <input type="url" value={heroImage} onChange={e => setHeroImage(e.target.value)} className="input-field shadow-sm" placeholder="https://..." />
                </div>
              </div>
            </div>
          )}

          {/* 3. About */}
          {activeTab === 'about' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-surface-900 mb-2 border-b border-surface-100 pb-4">3. About Section</h2>
              <div className="grid grid-cols-1 gap-6">
                 <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-900">Section Title</label>
                  <input type="text" value={websiteConfig.components.about?.title || ''} onChange={e => updateComponent('about', { title: e.target.value })} className="input-field shadow-sm" placeholder="About Us" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-900">Intro Description (HTML Supported)</label>
                  <textarea rows={6} value={websiteConfig.components.about?.contentHtml || ''} onChange={e => updateComponent('about', { contentHtml: e.target.value })} className="input-field shadow-sm font-mono text-sm leading-relaxed" placeholder="<p>Our beautiful property...</p>" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-900">Showcase Image URL</label>
                  <input type="url" value={websiteConfig.components.about?.image || ''} onChange={e => updateComponent('about', { image: e.target.value })} className="input-field shadow-sm" placeholder="https://..." />
                </div>
              </div>
            </div>
          )}

          {/* 4. Stats */}
          {activeTab === 'stats' && (
            <div className="space-y-6 animate-fade-in">
               <div className="flex justify-between border-b border-surface-100 pb-4">
                  <h2 className="text-xl font-bold text-surface-900">4. Highlights / Statistics</h2>
                  <button onClick={() => updateComponent('stats', { stats: [...(websiteConfig.components.stats?.stats || []), { label: '', value: '' }] })} className="text-primary-700 font-semibold text-sm hover:underline">+ Add Stat Row</button>
               </div>
               <div className="space-y-4">
                 {(websiteConfig.components.stats?.stats || []).map((s:any, i:number) => (
                    <div key={i} className="flex gap-3 bg-surface-50 p-4 border border-surface-200 rounded-xl shadow-sm">
                       <input placeholder="Label (e.g. Happy Guests)" value={s.label} onChange={e => { const n = [...websiteConfig.components.stats.stats]; n[i].label = e.target.value; updateComponent('stats', { stats: n }); }} className="input-field flex-1" />
                       <input placeholder="Value (e.g. 5,000+)" value={s.value} onChange={e => { const n = [...websiteConfig.components.stats.stats]; n[i].value = e.target.value; updateComponent('stats', { stats: n }); }} className="input-field flex-1" />
                       <button onClick={() => { const n = websiteConfig.components.stats.stats.filter((_:any, idx:number)=>idx!==i); updateComponent('stats', { stats: n }); }} className="text-red-500 hover:text-red-700 px-3"><Trash2 className="w-5 h-5"/></button>
                    </div>
                 ))}
                 {(!websiteConfig.components.stats?.stats || websiteConfig.components.stats.stats.length === 0) && <p className="text-sm text-surface-500">No statistics added yet. Add a row to show key metrics.</p>}
               </div>
            </div>
          )}

          {/* 5. Amenities */}
          {activeTab === 'amenities' && (
            <div className="space-y-6 animate-fade-in">
               <div className="flex justify-between items-center border-b border-surface-100 pb-4">
                 <div>
                   <h2 className="text-xl font-bold text-surface-900">5. Amenities & Facilities</h2>
                   <p className="text-sm text-surface-500 mt-1">Add each amenity and pick a matching icon from the visual library.</p>
                 </div>
                 <button onClick={() => {
                   const list = [...(websiteConfig.components.amenities?.list || []), { label: '', icon: 'Star' }];
                   updateComponent('amenities', { list });
                 }} className="bg-primary-700 hover:bg-primary-600 text-white px-4 py-2 rounded-xl font-semibold text-sm inline-flex items-center gap-2 transition-colors shadow-sm">
                   <Plus className="w-4 h-4" /> Add Amenity
                 </button>
               </div>
               <div className="space-y-3">
                  <div className="space-y-2 max-w-md">
                    <label className="text-sm font-medium text-surface-900">Section Title</label>
                    <input type="text" value={websiteConfig.components.amenities?.title || ''} onChange={e => updateComponent('amenities', { title: e.target.value })} className="input-field shadow-sm" placeholder="Our Amenities" />
                  </div>
                  {(websiteConfig.components.amenities?.list || []).map((amenity: any, i: number) => {
                    // Handle legacy string format
                    const item = typeof amenity === 'string' ? { label: amenity, icon: 'Star' } : amenity;
                    const SelectedIcon = HOSPITALITY_ICONS.find(ic => ic.id === item.icon)?.icon || Star;
                    return (
                      <div key={i} className="flex items-center gap-3 bg-surface-50 p-4 border border-surface-200 rounded-xl shadow-sm relative">
                        <div className="relative">
                          <button
                            onClick={() => setIconPickerOpen(iconPickerOpen === i ? null : i)}
                            className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center hover:bg-primary-200 transition-colors border border-primary-200"
                            title="Pick icon"
                          >
                            <SelectedIcon className="w-6 h-6" />
                          </button>
                          {iconPickerOpen === i && (
                            <div className="absolute top-14 left-0 z-50 bg-white border border-surface-200 rounded-2xl shadow-2xl p-4 w-[360px] max-h-[320px] overflow-y-auto">
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-bold text-surface-700">Choose Icon</span>
                                <button onClick={() => setIconPickerOpen(null)} className="text-surface-400 hover:text-surface-600"><X className="w-4 h-4" /></button>
                              </div>
                              <div className="grid grid-cols-6 gap-2">
                                {HOSPITALITY_ICONS.map(ic => (
                                  <button
                                    key={ic.id}
                                    onClick={() => {
                                      const list = [...(websiteConfig.components.amenities?.list || [])];
                                      list[i] = { ...item, icon: ic.id };
                                      updateComponent('amenities', { list });
                                      setIconPickerOpen(null);
                                    }}
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                                      item.icon === ic.id ? 'bg-primary-600 text-white shadow-md scale-110' : 'bg-surface-100 text-surface-600 hover:bg-primary-100 hover:text-primary-700'
                                    }`}
                                    title={ic.label}
                                  >
                                    <ic.icon className="w-5 h-5" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <input
                          placeholder="Amenity name (e.g. Free WiFi)"
                          value={item.label}
                          onChange={e => {
                            const list = [...(websiteConfig.components.amenities?.list || [])];
                            list[i] = { ...item, label: e.target.value };
                            updateComponent('amenities', { list });
                          }}
                          className="input-field flex-1 shadow-sm font-medium"
                        />
                        <button onClick={() => {
                          const list = (websiteConfig.components.amenities?.list || []).filter((_: any, idx: number) => idx !== i);
                          updateComponent('amenities', { list });
                        }} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                  {(!websiteConfig.components.amenities?.list || websiteConfig.components.amenities.list.length === 0) && (
                    <div className="text-center py-12 bg-surface-50 rounded-xl border-2 border-dashed border-surface-200">
                      <Wifi className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                      <p className="text-sm text-surface-500 font-medium">No amenities added yet.</p>
                      <p className="text-xs text-surface-400 mt-1">Click "Add Amenity" to start showcasing your facilities.</p>
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* 6. Rooms */}
          {activeTab === 'rooms' && (
            <div className="space-y-6 animate-fade-in">
               <h2 className="text-xl font-bold text-surface-900 mb-2 border-b border-surface-100 pb-4">6. Rooms Showcase</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-900">Section Title</label>
                  <input type="text" value={websiteConfig.components.rooms?.title || ''} onChange={e => updateComponent('rooms', { title: e.target.value })} className="input-field shadow-sm" placeholder="Our Rooms" />
                 </div>
                 <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-900">Section Subtitle</label>
                  <input type="text" value={websiteConfig.components.rooms?.subtitle || ''} onChange={e => updateComponent('rooms', { subtitle: e.target.value })} className="input-field shadow-sm" placeholder="Experience true comfort" />
                 </div>
               </div>

               {/* Featured Room Selection */}
               <div className="space-y-4 pt-4 border-t border-surface-100">
                 <div className="flex items-center gap-4">
                   <label className="text-sm font-bold text-surface-900">Display Mode</label>
                   <div className="flex bg-surface-100 rounded-xl p-1 border border-surface-200">
                     <button
                       onClick={() => updateComponent('rooms', { selectionMode: 'auto' })}
                       className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${websiteConfig.components.rooms?.selectionMode !== 'manual' ? 'bg-white text-primary-700 shadow-sm' : 'text-surface-500 hover:text-surface-700'}`}
                     >Show All</button>
                     <button
                       onClick={() => updateComponent('rooms', { selectionMode: 'manual' })}
                       className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${websiteConfig.components.rooms?.selectionMode === 'manual' ? 'bg-white text-primary-700 shadow-sm' : 'text-surface-500 hover:text-surface-700'}`}
                     >Pick Featured</button>
                   </div>
                 </div>

                 {websiteConfig.components.rooms?.selectionMode === 'manual' && (
                   <div className="space-y-3">
                     <p className="text-sm text-surface-500">Select which room types to feature on your website homepage:</p>
                     {roomTypes.length > 0 ? (
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         {roomTypes.map((rt: any) => {
                           const selectedIds = websiteConfig.components.rooms?.featuredIds || [];
                           const isSelected = selectedIds.includes(rt.id);
                           return (
                             <label key={rt.id} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                               isSelected ? 'border-primary-500 bg-primary-50' : 'border-surface-200 bg-surface-50 hover:border-primary-300'
                             }`}>
                               <input type="checkbox" checked={isSelected} onChange={() => {
                                 const ids = isSelected
                                   ? selectedIds.filter((id: string) => id !== rt.id)
                                   : [...selectedIds, rt.id];
                                 updateComponent('rooms', { featuredIds: ids });
                               }} className="w-5 h-5 rounded border-surface-300 text-primary-600" />
                               <div className="flex-1">
                                 <p className="font-bold text-surface-900">{rt.name}</p>
                                 <p className="text-xs text-surface-500">₹{rt.baseRate}/night · {rt._count?.rooms || 0} rooms</p>
                               </div>
                               {isSelected && <Check className="w-5 h-5 text-primary-600" />}
                             </label>
                           );
                         })}
                       </div>
                     ) : (
                       <p className="text-sm text-surface-500 bg-surface-50 p-4 rounded-xl">No room types found. Add room types in the Inventory section first.</p>
                     )}
                   </div>
                 )}

                 {websiteConfig.components.rooms?.selectionMode !== 'manual' && (
                   <div className="space-y-2">
                     <label className="text-sm font-medium text-surface-900">Max Rooms to Show</label>
                     <input type="number" value={websiteConfig.components.rooms?.limit || 6} onChange={e => updateComponent('rooms', { limit: parseInt(e.target.value) })} className="input-field shadow-sm w-32" min={1} max={20} />
                   </div>
                 )}
               </div>

               <div className="p-4 bg-primary-50 rounded-xl border border-primary-200 flex gap-3">
                 <Info className="w-5 h-5 text-primary-700 mt-0.5 shrink-0" />
                 <p className="text-sm text-primary-800 leading-relaxed font-medium">Room data (photos, pricing, availability) is pulled automatically from your <strong>Inventory</strong>. Update room details there to reflect changes on your website.</p>
               </div>
            </div>
          )}

          {/* 7. Gallery */}
          {activeTab === 'gallery' && (
            <div className="space-y-6 animate-fade-in">
               <div className="flex justify-between border-b border-surface-100 pb-4">
                  <h2 className="text-xl font-bold text-surface-900">7. Photo Gallery</h2>
                  <button onClick={() => updateComponent('gallery', { images: [...(websiteConfig.components.gallery?.images || []), ''] })} className="text-primary-700 font-semibold text-sm hover:underline">+ Add Image URL</button>
               </div>
               <div className="space-y-3">
                 {(websiteConfig.components.gallery?.images || []).map((imgUrl:string, i:number) => (
                    <div key={i} className="flex gap-2">
                       <input placeholder="https://..." value={imgUrl} onChange={e => { const n = [...websiteConfig.components.gallery.images]; n[i] = e.target.value; updateComponent('gallery', { images: n }); }} className="input-field flex-1 shadow-sm" />
                       <button onClick={() => { const n = websiteConfig.components.gallery.images.filter((_:any, idx:number)=>idx!==i); updateComponent('gallery', { images: n }); }} className="text-red-500 hover:text-red-700 px-3 border border-surface-200 rounded-xl bg-surface-50 shadow-sm"><Trash2 className="w-4 h-4"/></button>
                    </div>
                 ))}
               </div>
            </div>
          )}

          {/* 8. Nearby */}
             {activeTab === 'nearby' && (
            <div className="space-y-6 animate-fade-in">
               <div className="flex justify-between border-b border-surface-100 pb-4">
                  <h2 className="text-xl font-bold text-surface-900">8. Nearby Attractions (POIs)</h2>
                  <button onClick={() => updateComponent('nearby', { places: [...(websiteConfig.components.nearby?.places || []), { name: '', distance: '' }] })} className="text-primary-700 font-semibold text-sm hover:underline">+ Add Place</button>
               </div>
               <div className="space-y-4">
                 {(websiteConfig.components.nearby?.places || []).map((p:any, i:number) => (
                    <div key={i} className="flex flex-col sm:flex-row gap-3 bg-surface-50 p-4 border border-surface-200 rounded-xl shadow-sm">
                       <div className="flex-1 space-y-2">
                           <label className="text-xs font-semibold text-surface-500">Place Name</label>
                           <input placeholder="e.g. Local Beach" value={p.name} onChange={e => { const n = [...websiteConfig.components.nearby.places]; n[i].name = e.target.value; updateComponent('nearby', { places: n }); }} className="input-field shadow-sm" />
                       </div>
                       <div className="flex-1 space-y-2">
                           <label className="text-xs font-semibold text-surface-500">Distance</label>
                           <input placeholder="e.g. 5 km away" value={p.distance} onChange={e => { const n = [...websiteConfig.components.nearby.places]; n[i].distance = e.target.value; updateComponent('nearby', { places: n }); }} className="input-field shadow-sm" />
                       </div>
                       <button onClick={() => { const n = websiteConfig.components.nearby.places.filter((_:any, idx:number)=>idx!==i); updateComponent('nearby', { places: n }); }} className="text-red-500 hover:text-red-700 px-3 self-end sm:self-center mt-2 sm:mt-0"><Trash2 className="w-5 h-5"/></button>
                    </div>
                 ))}
               </div>
            </div>
          )}

          {/* 9. Reviews */}
          {activeTab === 'reviews' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b border-surface-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-surface-900">9. Guest Reviews</h2>
                  <p className="text-sm text-surface-500 mt-1">Curate featured reviews to showcase on your homepage.</p>
                </div>
                <button onClick={() => {
                  const reviews = [...(websiteConfig.components.reviews?.items || []), { author: '', rating: 5, text: '', date: '' }];
                  updateComponent('reviews', { items: reviews });
                }} className="bg-primary-700 hover:bg-primary-600 text-white px-4 py-2 rounded-xl font-semibold text-sm inline-flex items-center gap-2 transition-colors shadow-sm">
                  <Plus className="w-4 h-4" /> Add Review
                </button>
              </div>
              <div className="space-y-2 max-w-md">
                <label className="text-sm font-medium text-surface-900">Section Title</label>
                <input type="text" value={websiteConfig.components.reviews?.title || ''} onChange={e => updateComponent('reviews', { title: e.target.value })} className="input-field shadow-sm" placeholder="What Guests Say" />
              </div>
              <div className="space-y-4">
                {(websiteConfig.components.reviews?.items || []).map((review: any, i: number) => (
                  <div key={i} className="bg-surface-50 p-5 border border-surface-200 rounded-xl shadow-sm space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-surface-500">Guest Name</label>
                          <input placeholder="e.g. Priya Sharma" value={review.author} onChange={e => {
                            const items = [...websiteConfig.components.reviews.items]; items[i] = { ...items[i], author: e.target.value }; updateComponent('reviews', { items });
                          }} className="input-field shadow-sm" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-surface-500">Rating</label>
                          <div className="flex gap-1 items-center">
                            {[1,2,3,4,5].map(s => (
                              <button key={s} onClick={() => {
                                const items = [...websiteConfig.components.reviews.items]; items[i] = { ...items[i], rating: s }; updateComponent('reviews', { items });
                              }} className={`p-1 transition-colors ${s <= review.rating ? 'text-amber-500' : 'text-surface-300'}`}>
                                <Star className="w-5 h-5 fill-current" />
                              </button>
                            ))}
                            <span className="text-sm text-surface-500 ml-2 font-bold">{review.rating}/5</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => {
                        const items = websiteConfig.components.reviews.items.filter((_: any, idx: number) => idx !== i);
                        updateComponent('reviews', { items });
                      }} className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-surface-500">Review Text</label>
                      <textarea rows={2} placeholder="What did the guest say about their stay?" value={review.text} onChange={e => {
                        const items = [...websiteConfig.components.reviews.items]; items[i] = { ...items[i], text: e.target.value }; updateComponent('reviews', { items });
                      }} className="input-field shadow-sm text-sm" />
                    </div>
                  </div>
                ))}
                {(!websiteConfig.components.reviews?.items || websiteConfig.components.reviews.items.length === 0) && (
                  <div className="text-center py-12 bg-surface-50 rounded-xl border-2 border-dashed border-surface-200">
                    <Star className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                    <p className="text-sm text-surface-500 font-medium">No reviews added yet.</p>
                    <p className="text-xs text-surface-400 mt-1">Add curated reviews to build trust with potential guests.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 10. FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-6 animate-fade-in">
               <div className="flex justify-between border-b border-surface-100 pb-4">
                  <h2 className="text-xl font-bold text-surface-900">10. FAQ Section</h2>
                  <button onClick={() => updateComponent('faq', { questions: [...(websiteConfig.components.faq?.questions || []), { q: '', a: '' }] })} className="text-primary-700 font-semibold text-sm hover:underline">+ Add Question</button>
               </div>
               <div className="space-y-4">
                 {(websiteConfig.components.faq?.questions || []).map((faq:any, i:number) => (
                    <div key={i} className="flex gap-4 bg-surface-50 p-5 border border-surface-200 rounded-xl shadow-sm">
                       <div className="flex-1 space-y-3">
                           <input placeholder="Question" value={faq.q} onChange={e => { const n = [...websiteConfig.components.faq.questions]; n[i].q = e.target.value; updateComponent('faq', { questions: n }); }} className="input-field shadow-sm font-semibold" />
                           <textarea rows={2} placeholder="Answer" value={faq.a} onChange={e => { const n = [...websiteConfig.components.faq.questions]; n[i].a = e.target.value; updateComponent('faq', { questions: n }); }} className="input-field shadow-sm text-sm" />
                       </div>
                       <button onClick={() => { const n = websiteConfig.components.faq.questions.filter((_:any, idx:number)=>idx!==i); updateComponent('faq', { questions: n }); }} className="text-red-500 hover:text-red-700 self-start p-2"><Trash2 className="w-5 h-5"/></button>
                    </div>
                 ))}
               </div>
            </div>
          )}

          {/* 11. Policies */}
          {activeTab === 'policies' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center border-b border-surface-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-surface-900">11. House Rules & Policies</h2>
                  <p className="text-sm text-surface-500 mt-1">Add individual rules so guests know what to expect.</p>
                </div>
                <button onClick={() => {
                  const rules = [...(websiteConfig.components.policies?.rules || []), { title: '', description: '' }];
                  updateComponent('policies', { rules });
                }} className="bg-primary-700 hover:bg-primary-600 text-white px-4 py-2 rounded-xl font-semibold text-sm inline-flex items-center gap-2 transition-colors shadow-sm">
                  <Plus className="w-4 h-4" /> Add Rule
                </button>
              </div>
              <div className="space-y-2 max-w-md">
                <label className="text-sm font-medium text-surface-900">Section Title</label>
                <input type="text" value={websiteConfig.components.policies?.title || ''} onChange={e => updateComponent('policies', { title: e.target.value })} className="input-field shadow-sm" placeholder="Hotel Policies" />
              </div>
              <div className="space-y-3">
                {(websiteConfig.components.policies?.rules || []).map((rule: any, i: number) => (
                  <div key={i} className="flex gap-3 bg-surface-50 p-4 border border-surface-200 rounded-xl shadow-sm">
                    <div className="flex-1 space-y-3">
                      <input placeholder="Rule (e.g. Check-in Time)" value={rule.title} onChange={e => {
                        const rules = [...websiteConfig.components.policies.rules]; rules[i] = { ...rules[i], title: e.target.value }; updateComponent('policies', { rules });
                      }} className="input-field shadow-sm font-semibold" />
                      <input placeholder="Details (e.g. 2:00 PM onwards)" value={rule.description} onChange={e => {
                        const rules = [...websiteConfig.components.policies.rules]; rules[i] = { ...rules[i], description: e.target.value }; updateComponent('policies', { rules });
                      }} className="input-field shadow-sm text-sm" />
                    </div>
                    <button onClick={() => {
                      const rules = websiteConfig.components.policies.rules.filter((_: any, idx: number) => idx !== i);
                      updateComponent('policies', { rules });
                    }} className="text-red-500 hover:text-red-700 p-2 self-start rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {(!websiteConfig.components.policies?.rules || websiteConfig.components.policies.rules.length === 0) && (
                  <div className="text-center py-12 bg-surface-50 rounded-xl border-2 border-dashed border-surface-200">
                    <Shield className="w-10 h-10 text-surface-300 mx-auto mb-3" />
                    <p className="text-sm text-surface-500 font-medium">No policies added yet.</p>
                    <p className="text-xs text-surface-400 mt-1">Add rules like check-in time, cancellation policy, pet rules etc.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 12. Footer */}
          {activeTab === 'footer' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-surface-900 mb-2 border-b border-surface-100 pb-4">12. Footer & Contact Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-50 p-6 rounded-2xl border border-surface-200">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-900">Contact Email</label>
                    <input type="email" value={websiteConfig.components.contact?.email || ''} onChange={e => updateComponent('contact', { email: e.target.value })} className="input-field shadow-sm" placeholder="info@hotel.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-900">Contact Phone</label>
                    <input type="text" value={websiteConfig.components.contact?.phone || ''} onChange={e => updateComponent('contact', { phone: e.target.value })} className="input-field shadow-sm" placeholder="+91 XXXXX XXXXX" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-surface-900">Physical Address (HTML allowed)</label>
                    <textarea rows={2} value={websiteConfig.components.contact?.address || ''} onChange={e => updateComponent('contact', { address: e.target.value })} className="input-field shadow-sm" placeholder="123 Example Street, City..." />
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-900">Facebook URL</label>
                    <input type="url" value={websiteConfig.components.footer?.socialLinks?.facebook || ''} onChange={e => updateComponent('footer', { socialLinks: { ...websiteConfig.components.footer.socialLinks, facebook: e.target.value }})} className="input-field shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-900">Instagram URL</label>
                    <input type="url" value={websiteConfig.components.footer?.socialLinks?.instagram || ''} onChange={e => updateComponent('footer', { socialLinks: { ...websiteConfig.components.footer.socialLinks, instagram: e.target.value }})} className="input-field shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-surface-900">Twitter X URL</label>
                    <input type="url" value={websiteConfig.components.footer?.socialLinks?.twitter || ''} onChange={e => updateComponent('footer', { socialLinks: { ...websiteConfig.components.footer.socialLinks, twitter: e.target.value }})} className="input-field shadow-sm" />
                  </div>
              </div>

              <div className="pt-2">
                  <label className="text-sm font-medium text-surface-900 block mb-2">Copyright Disclaimer</label>
                  <input type="text" value={websiteConfig.components.footer?.text || ''} onChange={e => updateComponent('footer', { text: e.target.value })} className="input-field shadow-sm" placeholder="© 2026 Example Hotel. All rights reserved." />
              </div>
            </div>
          )}

          {/* 13. SEO */}
          {activeTab === 'seo' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-surface-900 mb-2 border-b border-surface-100 pb-4">13. SEO & Meta Tags</h2>
              <div className="space-y-6">
                 <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-900">Meta Title Tag</label>
                  <input type="text" value={websiteConfig.components.seo?.title || ''} onChange={e => updateComponent('seo', { title: e.target.value })} className="input-field shadow-sm" placeholder="Optimal limit: 55-60 characters" />
                 </div>
                 <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-900">Meta Description</label>
                  <textarea rows={3} value={websiteConfig.components.seo?.description || ''} onChange={e => updateComponent('seo', { description: e.target.value })} className="input-field shadow-sm" placeholder="Optimal limit: 150-160 characters" />
                 </div>
                 <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-900">Meta Keywords (Comma separated)</label>
                  <textarea rows={2} value={websiteConfig.components.seo?.keywords || ''} onChange={e => updateComponent('seo', { keywords: e.target.value })} className="input-field shadow-sm" placeholder="hotel, resort, booking, luxury stay" />
                 </div>
              </div>
            </div>
          )}

          {/* 14. Scripts */}
          {activeTab === 'scripts' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-surface-900 mb-2 border-b border-surface-100 pb-4">14. Tracking Scripts</h2>
              <div className="space-y-6 bg-surface-50 p-6 rounded-2xl border border-surface-200">
                 <div className="space-y-2">
                  <label className="text-sm font-bold text-surface-900 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded ml-2">Head Scripts</label>
                  <p className="text-xs text-surface-500 mb-2 block">Will be injected directly inside the &lt;head&gt; tag. Use for GTM or Meta Pixels.</p>
                  <textarea rows={6} value={websiteConfig.components.scripts?.head || ''} onChange={e => updateComponent('scripts', { head: e.target.value })} className="input-field shadow-sm font-mono text-sm bg-surface-900 text-green-400 border-none" placeholder="<!-- Google Tag Manager -->" />
                 </div>
                 <div className="space-y-2 pt-4">
                  <label className="text-sm font-bold text-surface-900 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded ml-2">Body Scripts</label>
                  <p className="text-xs text-surface-500 mb-2 block">Will be injected at the end of the &lt;body&gt; tag. Use for Chat widgets.</p>
                  <textarea rows={6} value={websiteConfig.components.scripts?.body || ''} onChange={e => updateComponent('scripts', { body: e.target.value })} className="input-field shadow-sm font-mono text-sm bg-surface-900 text-green-400 border-none" placeholder="<script>...</script>" />
                 </div>
              </div>
            </div>
          )}

          {/* 15. Advanced */}
          {activeTab === 'advanced' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-surface-900 mb-2 border-b border-surface-100 pb-4">15. Advanced CSS overrides</h2>
              <div className="space-y-2 bg-surface-900 p-6 rounded-2xl shadow-sm border border-surface-800">
                <p className="text-sm text-surface-400 mb-4 font-mono">/* Provide standard CSS logic here to override theme variables globally. */</p>
                <textarea rows={16} value={websiteConfig.components.advanced?.customCss || ''} onChange={e => updateComponent('advanced', { customCss: e.target.value })} className="w-full bg-surface-950 border border-surface-700 rounded-xl p-4 text-blue-300 font-mono text-sm focus:outline-none focus:border-primary-500 transition-colors shadow-inner" placeholder=":root {&#10;  --primary-500: #000; &#10;}" />
              </div>
            </div>
          )}

          {/* 16. Domain */}
          {activeTab === 'domain' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold text-surface-900 mb-2 border-b border-surface-100 pb-4">16. Custom Domain Mapping</h2>
              <div className="p-8 bg-surface-50 rounded-2xl border border-surface-200 shadow-sm text-center max-w-2xl mx-auto mt-8">
                 <Globe className="w-16 h-16 text-primary-500 mx-auto mb-6 opacity-80" />
                 <h3 className="text-xl font-bold text-surface-900 mb-3">Bring your own Domain</h3>
                 <p className="text-surface-600 mb-8 leading-relaxed">Map your branded domain name (e.g. www.yourhotel.com) instead of the default <code>.istays.in</code> subdomain. An SSL certificate will be automatically provisioned for you.</p>
                 
                 <div className="space-y-4 max-w-md mx-auto text-left mb-6">
                    <label className="text-sm font-bold text-surface-900 block">Domain Name</label>
                    <input type="text" value={websiteConfig.components.domain?.customDomain || ''} onChange={e => updateComponent('domain', { customDomain: e.target.value })} className="input-field shadow-sm text-center font-bold text-lg" placeholder="example.com" />
                 </div>
                 
                 <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-left space-y-2 mt-8">
                    <p className="text-sm font-semibold text-blue-800">DNS Instructions:</p>
                    <p className="text-xs text-blue-700">Add an <strong>A Record</strong> pointing to <code>104.21.XX.XX</code> and a <strong>CNAME Record</strong> for <code>www</code> pointing to <code>cname.istays.in</code>.</p>
                 </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
