'use client';

import { ClientVoteRecord } from '@sw/shared';
import { BigButton, Panel } from './ui';

export function VoteRecordModal({ record, onClose }: { record: ClientVoteRecord; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <Panel className="animate-fade-up w-full max-w-md rounded-b-none p-6 sm:rounded-3xl">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-3xl">📜</span>
          <div>
            <h2 className="text-xl font-black tracking-tight">Vote Record</h2>
            <p className="text-xs uppercase tracking-widest text-muted">
              Round {record.round}
              {record.isTiebreaker ? ' · Tiebreaker' : ''}
            </p>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto rounded-2xl border border-panel-border bg-black/30">
          <ul className="divide-y divide-panel-border">
            {record.votes.map((v, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="font-semibold">{v.voterName}</span>
                <span className="text-muted">→</span>
                <span className="font-semibold text-wolf">{v.targetName}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          This record can only be viewed once. It will be hidden again once you close it.
        </p>

        <div className="mt-4">
          <BigButton variant="ghost" onClick={onClose}>
            Close · Hide Vote Record
          </BigButton>
        </div>
      </Panel>
    </div>
  );
}
