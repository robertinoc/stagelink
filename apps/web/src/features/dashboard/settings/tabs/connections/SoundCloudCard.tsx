import { Bento } from '@/components/sl/Bento';
import { Btn } from '@/components/sl/Btn';
import { Pill } from '@/components/sl/SlPrimitives';

interface SoundCloudCardProps {
  name: string;
  comingSoonLabel: string;
  body: string;
  ctaLabel: string;
  profileHref: string;
}

/**
 * "Coming soon · v2" placeholder for SoundCloud. Keeps the SoundCloud
 * brand consistent in the tab while making the v2 status unmistakable.
 */
export function SoundCloudCard({
  name,
  comingSoonLabel,
  body,
  ctaLabel,
  profileHref,
}: SoundCloudCardProps) {
  return (
    <Bento pad={22}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-[240px] flex-1 gap-3.5">
          <div
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-[rgba(255,136,0,0.25)] bg-[rgba(255,136,0,0.12)] text-xl"
          >
            ☁️
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="m-0 font-[family-name:var(--font-heading)] text-[18px] font-bold text-white">
                {name}
              </h3>
              <Pill tone="yellow">{comingSoonLabel}</Pill>
            </div>
            <p className="mt-1.5 max-w-[560px] text-[12.5px] leading-[1.5] text-white/50">
              {body}
            </p>
          </div>
        </div>
        <a href={profileHref}>
          <Btn variant="ghost" type="button" icon={<UserIcon />}>
            {ctaLabel}
          </Btn>
        </a>
      </div>
    </Bento>
  );
}

function UserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
