import { act, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePathname } from 'next/navigation';
import { CONSENT_CHANGED_EVENT, isAnalyticsAllowed } from '@/lib/analytics/consent';
import { UmamiProvider } from '@/lib/analytics/UmamiProvider';
import { UMAMI_READY_EVENT } from '@/lib/analytics/umami';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

vi.mock('@/lib/analytics/consent', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/analytics/consent')>();
  return {
    ...actual,
    isAnalyticsAllowed: vi.fn(),
  };
});

const SCRIPT_ID = 'stagelink-umami-script';

describe('UmamiProvider', () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue('/es/signup');
    vi.mocked(isAnalyticsAllowed).mockReturnValue(true);
    vi.stubEnv('NEXT_PUBLIC_UMAMI_PLATFORM_WEBSITE_ID', 'platform-website-id');
    vi.stubEnv('NEXT_PUBLIC_UMAMI_DOMAINS', 'localhost');
    document.getElementById(SCRIPT_ID)?.remove();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    document.getElementById(SCRIPT_ID)?.remove();
  });

  it('injects the Umami script on an allowed platform route after consent', async () => {
    render(
      <UmamiProvider>
        <div>Platform</div>
      </UmamiProvider>,
    );

    await waitFor(() => expect(document.getElementById(SCRIPT_ID)).toBeInTheDocument());

    const script = document.getElementById(SCRIPT_ID);
    expect(script).toHaveAttribute('src', 'https://cloud.umami.is/script.js');
    expect(script).toHaveAttribute('data-website-id', 'platform-website-id');
    expect(script).toHaveAttribute('data-domains', 'localhost');
    expect(script).toHaveAttribute('data-do-not-track', 'true');
  });

  it('announces when the Umami script is ready', async () => {
    const onReady = vi.fn();
    window.addEventListener(UMAMI_READY_EVENT, onReady);

    render(
      <UmamiProvider>
        <div>Platform</div>
      </UmamiProvider>,
    );

    await waitFor(() => expect(document.getElementById(SCRIPT_ID)).toBeInTheDocument());
    act(() => document.getElementById(SCRIPT_ID)?.dispatchEvent(new Event('load')));

    expect(onReady).toHaveBeenCalledOnce();
    window.removeEventListener(UMAMI_READY_EVENT, onReady);
  });

  it('does not inject the script without analytics consent', () => {
    vi.mocked(isAnalyticsAllowed).mockReturnValue(false);

    render(
      <UmamiProvider>
        <div>Platform</div>
      </UmamiProvider>,
    );

    expect(document.getElementById(SCRIPT_ID)).not.toBeInTheDocument();
  });

  it('does not inject the script without a configured website id', () => {
    vi.stubEnv('NEXT_PUBLIC_UMAMI_PLATFORM_WEBSITE_ID', '');
    vi.stubEnv('NEXT_PUBLIC_UMAMI_WEBSITE_ID', '');

    render(
      <UmamiProvider>
        <div>Platform</div>
      </UmamiProvider>,
    );

    expect(document.getElementById(SCRIPT_ID)).not.toBeInTheDocument();
  });

  it('does not inject the script on public artist routes', () => {
    vi.mocked(usePathname).mockReturnValue('/es/example-artist');

    render(
      <UmamiProvider>
        <div>Artist page</div>
      </UmamiProvider>,
    );

    expect(document.getElementById(SCRIPT_ID)).not.toBeInTheDocument();
  });

  it('does not inject the script outside the configured domain allowlist', () => {
    vi.stubEnv('NEXT_PUBLIC_UMAMI_DOMAINS', 'stagelink.art');

    render(
      <UmamiProvider>
        <div>Preview</div>
      </UmamiProvider>,
    );

    expect(document.getElementById(SCRIPT_ID)).not.toBeInTheDocument();
  });

  it('starts tracking when analytics consent changes to allowed', async () => {
    vi.mocked(isAnalyticsAllowed).mockReturnValue(false);

    render(
      <UmamiProvider>
        <div>Platform</div>
      </UmamiProvider>,
    );

    expect(document.getElementById(SCRIPT_ID)).not.toBeInTheDocument();

    vi.mocked(isAnalyticsAllowed).mockReturnValue(true);
    act(() => window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT)));

    await waitFor(() => expect(document.getElementById(SCRIPT_ID)).toBeInTheDocument());
  });

  it('removes the script when analytics consent is revoked', async () => {
    render(
      <UmamiProvider>
        <div>Platform</div>
      </UmamiProvider>,
    );

    await waitFor(() => expect(document.getElementById(SCRIPT_ID)).toBeInTheDocument());

    vi.mocked(isAnalyticsAllowed).mockReturnValue(false);
    act(() => window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT)));

    await waitFor(() => expect(document.getElementById(SCRIPT_ID)).not.toBeInTheDocument());
  });
});
