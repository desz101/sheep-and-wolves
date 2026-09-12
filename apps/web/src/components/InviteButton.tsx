'use client';

import { useState } from 'react';
import { Check, Share2 } from 'lucide-react';
import { BigButton } from './ui';
import { useLanguage } from '@/lib/i18n';

export function InviteButton({ url, title, text }: { url: string; title: string; text: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  async function handleInvite() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // User backed out of the native share sheet -- not worth surfacing.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable/blocked -- nothing more we can do here.
    }
  }

  return (
    <BigButton variant="ghost" onClick={handleInvite} className="flex items-center justify-center gap-2">
      {copied ? <Check className="h-5 w-5" strokeWidth={2} /> : <Share2 className="h-5 w-5" strokeWidth={2} />}
      {copied ? t.lobby.linkCopied : t.lobby.inviteFriend}
    </BigButton>
  );
}
