'use client';

import Image, { ImageProps } from 'next/image';
import { useState, useCallback, useRef, useEffect } from 'react';

interface SafeNextImageProps extends Omit<ImageProps, 'src'> {
  src?: string | null;
  fallbackSrc?: string;
  containerClassName?: string;
}

export default function SafeNextImage({ 
  src, 
  alt, 
  fallbackSrc = '/placeholder-image.jpg',
  containerClassName = '',
  className = '',
  fill = true,
  ...props 
}: SafeNextImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Resolve relative /uploads/ paths to the full API URL.
  // In dev, images live at http://localhost:4100/uploads/... but the frontend
  // is on port 3100. In production both share the same origin.
  const resolvedSrc = (() => {
    if (!src) return src;
    if (src.startsWith('/uploads/')) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      // Strip /api/v1 suffix if present to get the origin
      const origin = apiBase.replace(/\/api\/v1\/?$/, '') || '';
      return origin ? `${origin}${src}` : src;
    }
    return src;
  })();

  // Handle the race condition where Next.js Image fires onLoad before React
  // attaches the listener (common with cached/SSR images). Check on mount if
  // the underlying <img> is already loaded.
  const handleRef = useCallback((node: HTMLImageElement | null) => {
    imgRef.current = node;
    if (node?.complete && node.naturalWidth > 0) {
      setLoaded(true);
    }
  }, []);

  // Safety net: if the image is still not marked as loaded after mount,
  // re-check once. This catches edge cases with hydration timing.
  useEffect(() => {
    if (!loaded && imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [loaded]);

  // If no source is provided at all, render a fallback container
  if (!resolvedSrc && !fallbackSrc) {
    return (
      <div className={`w-full h-full bg-surface-100 flex items-center justify-center text-surface-400 ${containerClassName}`}>
        <span className="text-sm border border-surface-200 px-3 py-1 rounded">No Image</span>
      </div>
    );
  }

  // If there was a loading error, show fallback UI instead of trying to load placeholder-image.jpg
  if (error || !resolvedSrc) {
    return (
      <div className={`w-full h-full bg-surface-100 flex items-center justify-center text-surface-400 ${containerClassName}`}>
         <div className="flex flex-col items-center gap-2">
            <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider opacity-60">Image Unavailable</span>
         </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {/* Loading shimmer shown behind the image; disappears once loaded */}
      {(!loaded) && (
        <div className="absolute inset-0 bg-surface-200 animate-pulse z-0" />
      )}
      <Image
        ref={handleRef}
        src={resolvedSrc}
        alt={alt || 'Image'}
        fill={fill}
        className={`object-cover z-[1] ${className}`}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
        // Sizes is crucial for Core Web Vitals to tell Next.js the max render size for src-sets
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        {...props}
      />
    </div>
  );
}

