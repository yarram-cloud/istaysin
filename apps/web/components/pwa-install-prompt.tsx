'use client';

import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';
import { Logo } from './logo';

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = window.navigator.userAgent;
    const webkit = !!ua.match(/WebKit/i);
    const isIPad = !!ua.match(/iPad/i);
    const isIPhone = !!ua.match(/iPhone/i);
    const isIOSDevice = isIPad || isIPhone;
    const isSafari = isIOSDevice && webkit && !ua.match(/CriOS/i);
    
    // Detect if already installed (standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

    if (isStandalone) {
      return; // Hide if already installed
    }

    if (isSafari) {
      setIsIOS(true);
      if (!localStorage.getItem('pwa_prompt_dismissed')) {
        setShowPrompt(true);
      }
    }

    // Android/Desktop prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!localStorage.getItem('pwa_prompt_dismissed')) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 z-[100] animate-in slide-in-from-bottom-12 duration-500">
      <div className="max-w-md mx-auto bg-surface-900 border border-white/10 rounded-[2rem] p-4 shadow-2xl shadow-black/50 flex flex-col gap-4 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 p-4">
          <button onClick={handleDismiss} className="text-surface-400 hover:text-white p-1 rounded-full bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-start gap-4">
          <Logo showText={false} imageClassName="w-12 h-12 shadow-lg ring-2 ring-white/10" />
          <div className="pt-1">
            <h4 className="text-white font-bold tracking-tight">Install iStays App</h4>
            <p className="text-sm text-surface-400 leading-tight mt-0.5">Add to home screen for faster, full-screen offline access.</p>
          </div>
        </div>

        {isIOS ? (
          <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-3 flex items-center justify-center gap-2 text-primary-300 text-sm font-medium">
            Tap <Share className="w-4 h-4 mx-1" /> then "Add to Home Screen"
          </div>
        ) : (
          <button 
            onClick={handleInstallClick}
            className="w-full h-10 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Install App Now
          </button>
        )}
      </div>
    </div>
  );
}
