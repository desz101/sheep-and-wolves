import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-12 p-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-1 text-6xl">
          <span>🐑</span>
          <span className="text-4xl text-muted">&amp;</span>
          <span>🐺</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight">Sheep &amp; Wolves</h1>
        <p className="max-w-xs text-muted">
          A real-time social deduction party game. Gather your group, grab your phones, and find the wolves before
          it&apos;s too late.
        </p>
      </div>

      <div className="flex w-full flex-col gap-4">
        <Link
          href="/create"
          className="w-full rounded-2xl bg-accent px-6 py-5 text-lg font-bold text-white shadow-lg shadow-accent/30 transition active:scale-[0.98]"
        >
          Host a Game
        </Link>
        <Link
          href="/join"
          className="w-full rounded-2xl border border-panel-border bg-white/5 px-6 py-5 text-lg font-bold text-foreground transition active:scale-[0.98]"
        >
          Join a Game
        </Link>
      </div>
    </main>
  );
}
