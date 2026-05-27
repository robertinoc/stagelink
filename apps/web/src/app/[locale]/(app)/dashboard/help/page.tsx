import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, MessageCircle, Mail, Users, Sparkles, Search } from 'lucide-react';
import { getAuthMe, getCurrentArtistId } from '@/lib/api/me';
import { getSession } from '@/lib/auth';
import { SUPPORT_URL } from '@/lib/constants';
import { ConnectionErrorState } from '@/components/shared/ConnectionErrorState';
import { Bento, BentoLabel } from '@/components/sl/Bento';
import { Pill, Glow } from '@/components/sl/SlPrimitives';
import { FaqItem } from '@/features/help/components/FaqItem';

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Help & FAQ' };
}

const GUIDE_CATEGORIES = [
  {
    sectionKey: 'getting_started' as const,
    articles: [
      'Create your first page',
      'Choose your handle',
      'Upload your first release',
      'Connect Spotify',
    ],
  },
  {
    sectionKey: 'profile' as const,
    articles: [
      'What is my profile for?',
      'Fill out your profile completely',
      'Photo Gallery setup',
      'Edit your bio',
    ],
  },
  {
    sectionKey: 'analytics' as const,
    articles: [
      'Understanding your metrics',
      'CTR vs. resolutions',
      'Filter by date range',
      'Export data to CSV',
    ],
  },
  {
    sectionKey: 'plans' as const,
    articles: [
      'Compare Free vs. Pro+',
      'Change your plan',
      'Payment methods',
      'View your invoices',
    ],
  },
];

// ── What's New changelog items (static for now, wire to CMS/API later)
const CHANGELOG = [
  {
    tag: 'NEW',
    tone: 'pink' as const,
    title: 'Smart Merch with Printful',
    desc: 'Connect Printful and sell print-on-demand merch without managing inventory.',
    when: '3 days ago',
  },
  {
    tag: 'NEW',
    tone: 'pink' as const,
    title: 'Multi-language EPK (Pro+)',
    desc: 'Your Press Kit in any language. Promoters see content in their language.',
    when: '1 week ago',
  },
  {
    tag: 'FIX',
    tone: 'green' as const,
    title: 'YouTube embed without tracking',
    desc: 'Videos now load in privacy-friendly mode by default.',
    when: '2 weeks ago',
  },
];

export default async function DashboardHelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const me = await getAuthMe(session.accessToken);
  if (me === null) {
    return <ConnectionErrorState href={`/${locale}/dashboard/help`} />;
  }

  const artistId = getCurrentArtistId(me);
  if (!artistId) redirect(`/${locale}/onboarding`);

  const t = await getTranslations('dashboard.help');
  const r = await getTranslations('dashboard.help.redesign');

  const sectionKeys = ['getting_started', 'profile', 'plans', 'analytics'] as const;

  return (
    <div className="space-y-6 pb-10">
      {/* ── Page header ───────────────────────────────────────────────── */}
      <div>
        <p className="mb-2.5 font-[family-name:var(--font-heading)] text-[11px] font-semibold uppercase tracking-[3px] text-[#E040FB]">
          {r('eyebrow')}
        </p>
        <h1 className="m-0 font-[family-name:var(--font-heading)] text-[clamp(26px,4cqw,38px)] font-bold leading-[1.08] tracking-[-0.025em] text-white">
          {r('title')} <span className="text-sl-grad">{r('title_gradient')}</span>
        </h1>
        <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-white/70">
          {r('subtitle')}
        </p>
      </div>

      {/* ── Search bento ──────────────────────────────────────────────── */}
      <Bento tone="accent" className="relative p-7">
        <Glow x="50%" y="0%" color="rgba(224,64,251,0.18)" size={360} />
        <div className="relative mx-auto max-w-[700px]">
          <BentoLabel tint="#E040FB">{r('search_label')}</BentoLabel>
          <div
            className="mt-3.5 flex items-center gap-3 rounded-2xl border border-[rgba(224,64,251,0.25)] px-5 py-4"
            style={{
              background: 'rgba(0,0,0,0.35)',
              boxShadow: '0 0 30px rgba(224,64,251,0.15)',
            }}
          >
            <Search className="h-5 w-5 shrink-0 text-white/40" />
            <p className="flex-1 text-[15px] text-white/30">{r('search_placeholder')}</p>
            <Pill tone="pink">⌘K</Pill>
          </div>
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-[12px] text-white/50">
            <span>{r('common_label')}</span>
            {(r.raw('common_searches') as string[]).map((q, index) => (
              <Link
                key={q}
                href={`#faq-${sectionKeys[index % sectionKeys.length]}`}
                className="cursor-pointer rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[11px] text-white/70 transition-colors hover:bg-white/10"
              >
                {q}
              </Link>
            ))}
          </div>
        </div>
      </Bento>

      {/* ── Guide categories ──────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3.5 font-[family-name:var(--font-heading)] text-[13px] font-semibold uppercase tracking-[1.5px] text-white/70">
          {r('categories_label')}
        </h2>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {GUIDE_CATEGORIES.map((cat) => {
            const sectionTitle = t(`sections.${cat.sectionKey}.title`);
            return (
              <Bento key={cat.sectionKey} tone="panel" className="p-5">
                <div className="mb-3.5 flex items-center justify-between gap-2">
                  <h4 className="m-0 font-[family-name:var(--font-heading)] text-[17px] font-bold text-white">
                    {sectionTitle}
                  </h4>
                  <span className="shrink-0 text-[11px] text-white/50">
                    {cat.articles.length} {r('articles_count')}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {cat.articles.map((article) => (
                    <Link
                      key={article}
                      href={`#faq-${cat.sectionKey}`}
                      className="inline-flex items-center gap-1.5 text-[13px] leading-relaxed text-white/70 transition-colors hover:text-white"
                    >
                      <span className="text-white/30">·</span>
                      {article}
                    </Link>
                  ))}
                </div>
                <div className="mt-3.5 flex items-center gap-1 border-t border-white/8 pt-3 text-[12px] font-semibold text-[#E040FB]">
                  {r('view_all')}
                </div>
              </Bento>
            );
          })}
        </div>
      </div>

      {/* ── Existing FAQ accordions ───────────────────────────────────── */}
      <div className="space-y-4">
        {sectionKeys.map((sectionKey) => {
          const items = t.raw(`sections.${sectionKey}.items`) as Array<{
            question: string;
            answer: string;
          }>;
          return (
            <Bento key={sectionKey} id={`faq-${sectionKey}`} tone="panel" className="px-6 py-2">
              <h2 className="py-4 font-[family-name:var(--font-heading)] text-[10px] font-bold uppercase tracking-[2px] text-white/40">
                {t(`sections.${sectionKey}.title`)}
              </h2>
              {items.map((item, i) => (
                <FaqItem key={i} question={item.question} answer={item.answer} />
              ))}
            </Bento>
          );
        })}
      </div>

      {/* ── Contact channels ──────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3.5 font-[family-name:var(--font-heading)] text-[13px] font-semibold uppercase tracking-[1.5px] text-white/70">
          {r('contact_label')}
        </h2>
        <div className="grid gap-3.5 sm:grid-cols-3">
          {/* Chat */}
          <ContactCard
            icon={<MessageCircle className="h-6 w-6" />}
            name={r('chat_name')}
            desc={r('chat_desc')}
            status={<Pill tone="green">● {r('chat_status')}</Pill>}
            cta={r('chat_cta')}
            href={SUPPORT_URL}
            primary
          />
          {/* Email */}
          <ContactCard
            icon={<Mail className="h-6 w-6" />}
            name={r('email_name')}
            desc={r('email_desc')}
            status={<span className="text-[12px] text-white/50">{r('email_status')}</span>}
            cta={r('email_cta')}
            href={SUPPORT_URL}
          />
          {/* Community */}
          <ContactCard
            icon={<Users className="h-6 w-6" />}
            name={r('community_name')}
            desc={r('community_desc')}
            status={<Pill tone="blue">{r('community_status')}</Pill>}
            cta={r('community_cta')}
            href="https://discord.gg/76dFVydHH"
          />
        </div>
      </div>

      {/* ── What's new + Feature request ─────────────────────────────── */}
      <div className="grid gap-3.5 lg:grid-cols-[1.5fr_1fr]">
        {/* Changelog */}
        <Bento tone="panel" className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <BentoLabel>{r('changelog_label')}</BentoLabel>
            <Pill tone="yellow">{r('coming_soon')}</Pill>
          </div>
          <div className="space-y-0">
            {CHANGELOG.map((item, i) => (
              <div
                key={item.title}
                className="grid grid-cols-[88px_1fr] items-start gap-3.5 py-3.5"
                style={{
                  borderBottom:
                    i < CHANGELOG.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                }}
              >
                <div className="flex flex-col gap-1.5">
                  <Pill tone={item.tone}>{item.tag}</Pill>
                  <span className="font-[family-name:var(--font-heading)] text-[10px] tracking-[0.5px] text-white/30">
                    {item.when}
                  </span>
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/70">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Bento>

        {/* Feature request */}
        <Bento tone="blue" className="flex flex-col p-5">
          <BentoLabel tint="#00D4FF">{r('feature_request_label')}</BentoLabel>
          <h3 className="mt-2 mb-2.5 font-[family-name:var(--font-heading)] text-[20px] font-bold text-white">
            {r('feature_request_title')}
          </h3>
          <p className="mb-4 flex-1 text-[13px] leading-relaxed text-white/70">
            {r('feature_request_body')}
          </p>
          <a
            href={`${SUPPORT_URL}?subject=Feature%20request`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[rgba(0,212,255,0.4)] bg-transparent py-2.5 text-[13px] font-semibold text-[#00D4FF] transition-colors hover:bg-[rgba(0,212,255,0.08)]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {r('feature_request_cta')}
          </a>
        </Bento>
      </div>
    </div>
  );
}

// ── ContactCard ─────────────────────────────────────────────────────────────

interface ContactCardProps {
  icon: React.ReactNode;
  name: string;
  desc: string;
  status: React.ReactNode;
  cta: string;
  href: string;
  primary?: boolean;
}

function ContactCard({ icon, name, desc, status, cta, href, primary }: ContactCardProps) {
  return (
    <Bento tone="panel" className="flex flex-col p-5">
      <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-[12px] bg-white/[0.06] text-white/70">
        {icon}
      </div>
      <h4 className="m-0 mb-1.5 font-[family-name:var(--font-heading)] text-[17px] font-bold text-white">
        {name}
      </h4>
      <p className="mb-3.5 text-[13px] leading-relaxed text-white/70 flex-1">{desc}</p>
      <div className="mb-4">{status}</div>
      <Link
        href={href}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
        className={
          primary
            ? 'inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90'
            : 'inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-white/10'
        }
        style={primary ? { background: 'var(--sl-grad)' } : undefined}
      >
        {cta}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </Bento>
  );
}
