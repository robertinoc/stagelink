/**
 * Cross-component channel for switching the active Settings tab WITHOUT a Next
 * navigation (which would re-run the server component and refetch
 * billing/shopify/merch/insights — the "slow" feeling when picking a settings
 * sub-item from the sidebar).
 *
 * When the user is already on /dashboard/settings, the sidebar sub-items and
 * the in-page tabs both dispatch this event + `history.replaceState` to swap
 * the panel instantly client-side, exactly like clicking the in-page tabs.
 */
export const SETTINGS_TAB_CHANGE_EVENT = 'settings:tab-change';

export type SettingsTabEventDetail = string;

export function emitSettingsTabChange(tab: SettingsTabEventDetail): void {
  window.dispatchEvent(
    new CustomEvent<SettingsTabEventDetail>(SETTINGS_TAB_CHANGE_EVENT, {
      detail: tab,
    }),
  );
}
