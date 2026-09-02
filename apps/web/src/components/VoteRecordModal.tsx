'use client';

import { ArrowRight, ScrollText } from 'lucide-react';
import { ClientVoteRecord } from '@sw/shared';
import { BigButton, Panel } from './ui';
import { useLanguage } from '@/lib/i18n';

export function VoteRecordModal({ record, onClose }: { record: ClientVoteRecord; onClose: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <Panel className="animate-fade-up w-full max-w-md rounded-b-none p-6 sm:rounded-3xl">
        <div className="mb-4 flex items-center gap-3">
          <ScrollText className="h-8 w-8 text-accent-2" strokeWidth={1.5} />
          <div>
            <h2 className="text-xl font-black tracking-tight">{t.voteRecordModal.title}</h2>
            <p className="text-xs uppercase tracking-widest text-muted">
              {t.voteRecordModal.round(record.round, record.isTiebreaker)}
            </p>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto rounded-2xl border border-panel-border bg-black/30">
          <ul className="divide-y divide-panel-border">
            {record.votes.map((v, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="font-semibold">{v.voterName}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted" strokeWidth={2} />
                <span className="font-semibold text-wolf">{v.targetName}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 text-center text-xs text-muted">{t.voteRecordModal.onceNotice}</p>

        <div className="mt-4">
          <BigButton variant="ghost" onClick={onClose}>
            {t.voteRecordModal.close}
          </BigButton>
        </div>
      </Panel>
    </div>
  );
}
