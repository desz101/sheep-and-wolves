import Link from 'next/link';
import { Panel } from '@/components/ui';

const LAST_UPDATED = 'September 2, 2026';
const CONTACT_EMAIL = 'privacy@sheepandwolves.app';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 p-4 pb-16 pt-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight">Privacy Policy</h1>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">Last updated {LAST_UPDATED}</p>
      </div>

      <Panel className="flex flex-col gap-8 p-6">
        <p className="text-sm leading-relaxed text-muted">
          Sheep &amp; Wolves is a free, browser-based party game. You do not create an account, and we do not
          ask for your email address, phone number, or any other identifier. This page explains the limited
          information the game does handle, why, and how long it is kept.
        </p>

        <Section title="1. Information collected automatically">
          <p>
            <span className="font-semibold text-foreground">When you host (create) a game</span>, our server
            records the IP address and browser user-agent string of that request. We use this only to protect
            the service — investigating abuse, spam, and automated game creation, and enforcing rate limits.
          </p>
          <p>
            Joining a game as a player does not record your IP address. Our hosting providers may keep
            short-lived operational request logs of their own, as is standard for any website.
          </p>
        </Section>

        <Section title="2. Information you provide">
          <p>
            The <span className="font-semibold text-foreground">display name</span> you enter (or a random one
            we generate if you leave it blank) is shown to the other players in your game and stored with that
            game&apos;s data. It is not linked to any account or to you as an individual. Names are cleaned of
            hidden and control characters and screened against a short list of slurs before being stored.
          </p>
        </Section>

        <Section title="3. Storage on your device">
          <p>
            Your game session is kept in your browser&apos;s <span className="font-semibold text-foreground">sessionStorage</span>{' '}
            so a refresh doesn&apos;t knock you out of the game; it is scoped to that browser tab and cleared
            when the tab closes. Your language and background-music preferences are kept in{' '}
            <span className="font-semibold text-foreground">localStorage</span> on your device. Neither is sent
            anywhere beyond what is needed to run the game.
          </p>
        </Section>

        <Section title="4. Voice chat (optional)">
          <p>
            If you choose to join voice chat, your audio is carried in real time through{' '}
            <a
              href="https://livekit.io/legal/privacy-policy"
              className="text-accent underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              LiveKit
            </a>
            , our voice infrastructure provider. The conversation is not recorded or stored by us.
          </p>
        </Section>

        <Section title="5. Analytics and advertising">
          <p>
            On the public site we use Google Analytics to understand aggregate usage and Google AdSense to show
            ads. These services may set cookies or similar identifiers and collect device and usage data under{' '}
            <a
              href="https://policies.google.com/privacy"
              className="text-accent underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google&apos;s Privacy Policy
            </a>
            . You can manage ad personalization at{' '}
            <a
              href="https://adssettings.google.com"
              className="text-accent underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Ad Settings
            </a>
            .
          </p>
        </Section>

        <Section title="6. How we use information">
          <p>
            To run games and keep players connected; to prevent abuse, spam, and automated misuse; to
            understand how the game is used in aggregate; and to display ads that keep the game free.
          </p>
        </Section>

        <Section title="7. Sharing">
          <p>
            We do not sell your information. We share it only with the infrastructure providers that run the
            service on our behalf — Supabase (database and game API hosting), AWS Amplify (web hosting),
            LiveKit (voice), and Google (analytics and ads) — and where we are legally required to.
          </p>
        </Section>

        <Section title="8. Retention">
          <p>
            Game records, including the host IP address and user-agent, are kept no longer than needed for the
            security and abuse-prevention purposes above, and are deleted on a rolling basis once a game is
            over. On-device storage (section 3) stays until you clear it or your browser does.
          </p>
        </Section>

        <Section title="9. Your choices">
          <p>
            If you would rather your IP address not be recorded, join a game someone else hosts instead of
            hosting one yourself. You can clear this site&apos;s on-device storage at any time through your
            browser settings, and control cookies and ad personalization through your browser and the Google
            links above.
          </p>
        </Section>

        <Section title="10. Children">
          <p>
            Sheep &amp; Wolves is not directed at children under 13, and we do not knowingly collect
            information from them. If you believe a child has provided information to us, contact us and we will
            remove it.
          </p>
        </Section>

        <Section title="11. Changes to this policy">
          <p>
            If this policy changes, we will update the date at the top of this page. Continued use of the game
            after a change means you accept the updated policy.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            Questions about this policy or your information:{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>
      </Panel>

      <Link href="/" className="text-center text-sm font-semibold text-accent underline underline-offset-4">
        Back to Home
      </Link>
    </main>
  );
}
