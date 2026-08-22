'use client';

import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-panel-border bg-panel/80 backdrop-blur-sm shadow-xl shadow-black/30 ${className}`}>
      {children}
    </div>
  );
}

interface BigButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost' | 'wolf' | 'sheep';
}

export function BigButton({ variant = 'primary', className = '', children, disabled, ...rest }: BigButtonProps) {
  const base =
    'w-full rounded-2xl px-6 py-4 text-lg font-bold tracking-wide transition active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 touch-manipulation';
  const variants: Record<string, string> = {
    primary: 'bg-accent text-white shadow-lg shadow-accent/30 hover:brightness-110',
    danger: 'bg-wolf text-white shadow-lg shadow-wolf/30 hover:brightness-110',
    wolf: 'bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg shadow-red-900/40',
    sheep: 'bg-gradient-to-br from-sky-400 to-cyan-600 text-white shadow-lg shadow-sky-900/40',
    ghost: 'bg-white/5 border border-panel-border text-foreground hover:bg-white/10',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-panel-border bg-black/30 px-5 py-4 text-lg text-foreground placeholder:text-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/40 ${props.className ?? ''}`}
    />
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">{children}</div>;
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'wolf' | 'sheep' | 'muted' }) {
  const tones: Record<string, string> = {
    default: 'bg-accent/20 text-accent',
    wolf: 'bg-wolf/20 text-wolf',
    sheep: 'bg-sheep/20 text-sheep',
    muted: 'bg-white/10 text-muted',
  };
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}
