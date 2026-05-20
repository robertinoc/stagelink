'use client';

// PublishBanner — full-width status card shown above the EPK tab bar.
// Shows Live/Draft status, public URL, and publish/unpublish action.

import { Bento } from '@/components/sl/Bento';
import { Btn } from '@/components/sl/Btn';
import { Glow } from '@/components/sl/SlPrimitives';

interface PublishBannerProps {
  isPublished: boolean;
  publishBusy: 'publish' | 'unpublish' | null;
  publishReadiness: { ready: boolean; missing: string[] };
  sharePath: string;
  printPath: string;
  onToggle: () => void;
}

export function PublishBanner({
  isPublished,
  publishBusy,
  publishReadiness,
  sharePath,
  printPath,
  onToggle,
}: PublishBannerProps) {
  return (
    <Bento tone={isPublished ? 'green' : 'accent'} pad={20} glow={isPublished}>
      {isPublished && <Glow x="100%" y="0%" color="rgba(74,222,128,0.2)" size={280} />}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left — status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: 'var(--font-heading)',
              letterSpacing: 1,
              textTransform: 'uppercase',
              background: isPublished ? 'rgba(74,222,128,0.18)' : 'rgba(255,255,255,0.08)',
              border: isPublished
                ? '1px solid rgba(74,222,128,0.4)'
                : '1px solid rgba(255,255,255,0.14)',
              color: isPublished ? '#4ADE80' : 'rgba(255,255,255,0.6)',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: isPublished ? '#4ADE80' : 'rgba(255,255,255,0.4)',
              }}
            />
            {isPublished ? 'Live' : 'Draft'}
          </span>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: 15,
                color: 'white',
              }}
            >
              Press Kit (EPK)
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
              {isPublished ? `Public at ${sharePath}` : 'Not visible to the public yet'}
            </div>
          </div>
        </div>

        {/* Right — actions */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isPublished && (
            <>
              <Btn
                size="sm"
                variant="ghost"
                type="button"
                onClick={() => window.open(sharePath, '_blank', 'noopener,noreferrer')}
              >
                View EPK ↗
              </Btn>
              <Btn
                size="sm"
                variant="ghost"
                type="button"
                onClick={() => window.open(printPath, '_blank', 'noopener,noreferrer')}
              >
                Print ↗
              </Btn>
            </>
          )}
          {!publishReadiness.ready && !isPublished && (
            <span
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.45)',
                alignSelf: 'center',
                maxWidth: 220,
              }}
            >
              Complete required fields to publish: {publishReadiness.missing.join(', ')}
            </span>
          )}
          <Btn
            size="sm"
            variant={isPublished ? 'outline' : 'primary'}
            type="button"
            disabled={publishBusy !== null || (!isPublished && !publishReadiness.ready)}
            onClick={onToggle}
          >
            {publishBusy === 'publish'
              ? 'Publishing…'
              : publishBusy === 'unpublish'
                ? 'Unpublishing…'
                : isPublished
                  ? 'Unpublish'
                  : 'Publish EPK'}
          </Btn>
        </div>
      </div>

      {/* Lock notice when published */}
      {isPublished && (
        <div
          style={{
            marginTop: 12,
            padding: '8px 12px',
            borderRadius: 10,
            background: 'rgba(74,222,128,0.08)',
            border: '1px solid rgba(74,222,128,0.2)',
            fontSize: 12,
            color: 'rgba(74,222,128,0.85)',
          }}
        >
          Your EPK is live. Click <strong>Unpublish</strong> to edit fields below.
        </div>
      )}
    </Bento>
  );
}
