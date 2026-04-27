'use client';

import { useEffect, useRef } from 'react';

export default function HtmlInjector({ html, location }: { html: string; location: 'head' | 'body' }) {
  const injected = useRef(false);

  useEffect(() => {
    if (injected.current || !html) return;
    injected.current = true;
    const target = location === 'head' ? document.head : document.body;
    const range = document.createRange();
    range.selectNode(target);
    const fragment = range.createContextualFragment(html);
    target.appendChild(fragment);
  }, [html, location]);

  return null;
}
