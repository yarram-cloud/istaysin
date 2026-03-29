'use client';

import { useEffect, useState } from 'react';
import { tenantsApi } from '@/lib/api';
import { Palette, Image as ImageIcon, Layout, Globe, Save, Loader2, Plus, Trash2 } from 'lucide-react';

export default function WebsiteBuilderPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Prisma native columns
  const [brandLogo, setBrandLogo] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0ea5e9');
  const [secondaryColor, setSecondaryColor] = useState('#38bdf8');
  const [tagline, setTagline] = useState('');
  const [heroImage, setHeroImage] = useState('');
  const [description, setDescription] = useState('');

  // JSON Config columns
  const [websiteConfig, setWebsiteConfig] = useState({
    heroHeadline: '',
    heroSubheadline: '',
    aboutHtml: '',
    amenities: [] as { icon: string; label: string }[],
    gallery: [] as string[],
    socialLinks: { facebook: '', instagram: '', twitter: '' },
    footerText: '',
  });

  useEffect(() => {
    tenantsApi.getSettings()
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          setBrandLogo(d.brandLogo || '');
          setPrimaryColor(d.primaryColor || '#0ea5e9');
          setSecondaryColor(d.secondaryColor || '#38bdf8');
          setTagline(d.tagline || '');
          setHeroImage(d.heroImage || '');
          setDescription(d.description || '');

          const config = d.config?.websiteBuilder || {};
          setWebsiteConfig({
            heroHeadline: config.heroHeadline || '',
            heroSubheadline: config.heroSubheadline || '',
            aboutHtml: config.aboutHtml || '',
            amenities: config.amenities || [],
            gallery: config.gallery || [],
            socialLinks: config.socialLinks || { facebook: '', instagram: '', twitter: '' },
            footerText: config.footerText || '',
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await tenantsApi.updateSettings({
        brandLogo, primaryColor, secondaryColor, tagline, heroImage, description,
        config: { websiteBuilder: websiteConfig }
      });
      alert('Website published successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }

  const tabs = [
    { id: 'general', label: 'Theme & Styling', icon: Palette },
    { id: 'hero', label: 'Hero Section', icon: Layout },
    { id: 'content', label: 'Content & Gallery', icon: ImageIcon },
    { id: 'footer', label: 'Footer & Social', icon: Globe },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold mb-1">Website Builder</h1>
          <p className="text-surface-400">Customize your public booking engine and property website.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-xl font-medium inline-flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Publishing...' : 'Publish Website'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Tabs */}
        <div className="glass-card p-2 flex flex-col gap-1 h-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === t.id ? 'bg-primary-600/10 text-primary-400' : 'text-surface-400 hover:text-surface-200 hover:bg-white/[0.04]'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Form Area */}
        <div className="md:col-span-3 glass-card p-6 min-h-[500px]">
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-semibold border-b border-white/10 pb-4">Theme & Styling</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-200">Brand Logo URL</label>
                  <input
                    type="url"
                    value={brandLogo}
                    onChange={(e) => setBrandLogo(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-200">Property Tagline</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="Luxury refined."
                    className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-200">Primary Color</label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer bg-surface-800 border border-white/10 p-1"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 bg-surface-800 border border-white/10 rounded-xl px-4 py-2.5 text-white uppercase"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-200">Secondary Color</label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-12 h-12 rounded-lg cursor-pointer bg-surface-800 border border-white/10 p-1"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1 bg-surface-800 border border-white/10 rounded-xl px-4 py-2.5 text-white uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hero' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-semibold border-b border-white/10 pb-4">Hero Section</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-200">Main Headline</label>
                  <input
                    type="text"
                    value={websiteConfig.heroHeadline}
                    onChange={(e) => setWebsiteConfig({ ...websiteConfig, heroHeadline: e.target.value })}
                    placeholder="Welcome to Paradise"
                    className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-2.5 text-white text-lg font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-200">Subheadline (Description)</label>
                  <textarea
                    value={websiteConfig.heroSubheadline}
                    onChange={(e) => setWebsiteConfig({ ...websiteConfig, heroSubheadline: e.target.value })}
                    rows={2}
                    placeholder="Experience the best stay with breathtaking views."
                    className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-2.5 text-white resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-200">Hero Background Image URL</label>
                  <input
                    type="url"
                    value={heroImage}
                    onChange={(e) => setHeroImage(e.target.value)}
                    placeholder="https://example.com/hero.jpg"
                    className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                  />
                  {heroImage && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-white/10 h-48 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={heroImage} alt="Hero Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-semibold border-b border-white/10 pb-4">Content & Gallery</h2>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-200">About Property (HTML Supported)</label>
                <textarea
                  value={websiteConfig.aboutHtml}
                  onChange={(e) => setWebsiteConfig({ ...websiteConfig, aboutHtml: e.target.value })}
                  rows={4}
                  className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-2.5 text-white min-h-[120px]"
                  placeholder="<p>Our property offers...</p>"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-surface-200">Gallery Images</label>
                  <button 
                    onClick={() => setWebsiteConfig({ ...websiteConfig, gallery: [...websiteConfig.gallery, ''] })}
                    className="text-primary-400 text-xs flex items-center gap-1 hover:text-primary-300"
                  >
                    <Plus className="w-3 h-3" /> Add Image
                  </button>
                </div>
                {websiteConfig.gallery.length === 0 && <p className="text-sm text-surface-500 italic">No images in gallery</p>}
                {websiteConfig.gallery.map((url, i) => (
                  <div key={i} className="flex gap-3">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => {
                        const newGallery = [...websiteConfig.gallery];
                        newGallery[i] = e.target.value;
                        setWebsiteConfig({ ...websiteConfig, gallery: newGallery });
                      }}
                      placeholder="Image URL..."
                      className="flex-1 bg-surface-800 border border-white/10 rounded-xl px-4 py-2 text-white"
                    />
                    <button
                      onClick={() => {
                        const newGallery = websiteConfig.gallery.filter((_, idx) => idx !== i);
                        setWebsiteConfig({ ...websiteConfig, gallery: newGallery });
                      }}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'footer' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-semibold border-b border-white/10 pb-4">Footer & Social</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-200">Facebook URL</label>
                  <input
                    type="url"
                    value={websiteConfig.socialLinks.facebook}
                    onChange={(e) => setWebsiteConfig({ ...websiteConfig, socialLinks: { ...websiteConfig.socialLinks, facebook: e.target.value } })}
                    className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-200">Instagram URL</label>
                  <input
                    type="url"
                    value={websiteConfig.socialLinks.instagram}
                    onChange={(e) => setWebsiteConfig({ ...websiteConfig, socialLinks: { ...websiteConfig.socialLinks, instagram: e.target.value } })}
                    className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-surface-200">Footer Text (Copyright)</label>
                  <input
                    type="text"
                    value={websiteConfig.footerText}
                    onChange={(e) => setWebsiteConfig({ ...websiteConfig, footerText: e.target.value })}
                    placeholder="© 2026 My Hotel. All rights reserved."
                    className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-2.5 text-white"
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
