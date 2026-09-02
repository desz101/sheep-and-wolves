'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function QrCode({ value, size = 200 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, { width: size, margin: 1, color: { dark: '#0b0d17', light: '#f4f3ff' } }).then((url) => {
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!dataUrl) {
    return <div className="animate-pulse rounded-2xl bg-white/10" style={{ width: size, height: size }} />;
  }

  return <img src={dataUrl} alt="QR code to join the game" width={size} height={size} className="rounded-2xl" />;
}
