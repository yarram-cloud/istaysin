'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';

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

  // If no source is provided at all, render a fallback container
  if (!src && !fallbackSrc) {
    return (
      <div className={`w-full h-full bg-surface-100 flex items-center justify-center text-surface-400 ${containerClassName}`}>
        <span className="text-sm border border-surface-200 px-3 py-1 rounded">No Image</span>
      </div>
    );
  }

  // If there was a loading error, show fallback UI instead of trying to load placeholder-image.jpg
  if (error || !src) {
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
      {(!loaded) && (
        <div className="absolute inset-0 bg-surface-200 animate-pulse z-0" />
      )}
      <Image
        src={src}
        alt={alt || 'Image'}
        fill={fill}
        className={`object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
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
