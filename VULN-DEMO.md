# ⚠️ Intentional vulnerability — demo branch only

**Branch:** `demo/vuln-wolf-role-leak`
**Do not merge into `dev` or `main`.**

This branch exists to demo a real-world bug class ("excessive data
exposure" / broken object-level authorization, OWASP API Security Top 10
#3) live, using Sheep & Wolves as the target. It's the same class of bug
you find in real APIs: the server computes the right thing to *show* but
sends the client more than that, and trusts the UI not to display it.

## The bug

`supabase/functions/_shared/sanitize.ts` builds the one JSON payload every
client receives for a game (`buildClientView`). Normally it redacts each
player's secret `role` (`sheep` / `wolf`) so a client only ever learns:

- their own role (`selfRole`)
- an eliminated player's role (`revealedRole`, correctly public once they're out)
- their fellow wolves, but only if they themselves are a wolf who has
  acknowledged their card (`wolfTeammates`)

On this branch, every entry in the `players[]` array also carries the
player's real, current `role` — alive or not, self or not:

```ts
// supabase/functions/_shared/sanitize.ts
role: p.role, // VULN-DEMO: should only ever be sent for `p.id === requestingPlayerId`
```

The React UI never reads `players[].role`, so nothing *looks* different
on screen. The leak only shows up in the raw network response.

## How to demo it

1. Start a game with a few players (or just start one and poll the API
   directly).
2. Open browser devtools → Network tab on any player's screen once roles
   have been dealt.
3. Find the poll request to `GET /games/:code/state`.
4. Look at the JSON body's `players` array — every player object now has
   a `role` field showing `"sheep"` or `"wolf"`, for everyone, including
   players who aren't you.

No auth bypass, no injection — just reading a response the app already
sent you. It's a good example of why "the UI doesn't show it" is not the
same as "the server didn't leak it."

## The fix

Revert the three changes on this branch:

- `supabase/functions/_shared/sanitize.ts`: remove the `role: p.role,` line
  from the `players` mapping in `buildClientView`.
- `supabase/functions/_shared/types.ts` and `packages/shared/src/types.ts`:
  remove the `role` field added to `ClientPlayer`.

Equivalently: `git diff dev...demo/vuln-wolf-role-leak` and revert it.
