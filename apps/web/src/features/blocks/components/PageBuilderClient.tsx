'use client';

import { useState, useCallback } from 'react';
import type { PlanCode, ArtistRelease, RecordLabel } from '@stagelink/types';
import { BlockManager } from './BlockManager';
import { PhonePreviewFrame } from './PhonePreviewFrame';

interface PageBuilderClientProps {
  pageId: string;
  artistId: string;
  username: string;
  locale: string;
  canUseShopifyIntegration: boolean;
  canUseSmartMerch: boolean;
  shopifyIsConnected?: boolean;
  smartMerchIsConnected?: boolean;
  userPlan?: PlanCode;
  galleryImages?: string[];
  textSources?: Array<{ id: string; label: string; body: string }>;
  releases?: ArtistRelease[];
  recordLabels?: RecordLabel[];
  counterValues?: { eps: number; labels: number; collabs: number };
}

/**
 * Client wrapper that connects BlockManager's change events to the
 * PhonePreviewFrame's auto-refresh so that reorders, toggles, and saves
 * can optionally trigger a live preview update.
 */
export function PageBuilderClient({
  pageId,
  artistId,
  username,
  locale,
  canUseShopifyIntegration,
  canUseSmartMerch,
  shopifyIsConnected,
  smartMerchIsConnected,
  userPlan,
  galleryImages,
  textSources,
  releases,
  recordLabels,
  counterValues,
}: PageBuilderClientProps) {
  const [blocksVersion, setBlocksVersion] = useState(0);

  const handleBlocksChanged = useCallback(() => {
    setBlocksVersion((v) => v + 1);
  }, []);

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_320px] xl:items-start">
      {/* Left: Block manager */}
      <BlockManager
        pageId={pageId}
        artistId={artistId}
        canUseShopifyIntegration={canUseShopifyIntegration}
        canUseSmartMerch={canUseSmartMerch}
        shopifyIsConnected={shopifyIsConnected}
        smartMerchIsConnected={smartMerchIsConnected}
        userPlan={userPlan}
        galleryImages={galleryImages}
        releases={releases}
        recordLabels={recordLabels}
        counterValues={counterValues}
        username={username}
        textSources={textSources}
        onBlocksChanged={handleBlocksChanged}
      />

      {/* Right: Phone frame preview (sticky on xl+) */}
      <div className="hidden xl:block xl:sticky xl:top-6">
        <PhonePreviewFrame username={username} locale={locale} blocksVersion={blocksVersion} />
      </div>
    </div>
  );
}
