'use client';

import { useEffect } from 'react';

const AD_CLIENT = 'ca-pub-4757381719550518';
const AD_SLOT = '8964970812';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

// Rendered once in the root layout, after all route content, so it sits at
// the bottom of every page. Persists across client-side navigation the same
// way HomeMusicPlayer does, so it only needs to push itself to AdSense once
// rather than re-pushing on every route change.
export function FooterAd() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Blocked by an ad blocker, script failed to load, etc. -- nothing to
      // recover from, just leave the slot empty.
    }
  }, []);

  return (
    <ins
      className="adsbygoogle block"
      data-ad-client={AD_CLIENT}
      data-ad-slot={AD_SLOT}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
