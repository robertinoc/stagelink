/**
 * StageLink Insights — Metrics Normalization Rules
 *
 * Each platform stores its own metrics in a free-form JSON column (metrics: Record<string, …>).
 * This file is the canonical reference for:
 *   - which metric keys each platform produces
 *   - which keys are conceptually comparable across platforms (but still kept separate)
 *   - which keys are platform-specific and must never be summed or averaged
 *
 * UPDATE THIS FILE when adding a platform or changing provider output.
 * The frontend dashboard must consult this to decide how to render each metric.
 */

// ---------------------------------------------------------------------------
// Metric key catalogue
// ---------------------------------------------------------------------------

/**
 * AUDIENCE_SIZE
 * The primary follower / subscriber count for the platform.
 * Conceptually similar across platforms but NOT arithmetically comparable
 * (a Spotify follower ≠ a YouTube subscriber in reach or intent).
 * Show side-by-side, never sum.
 */
export const METRIC_AUDIENCE_SIZE: Record<'spotify' | 'youtube' | 'soundcloud', string> = {
  spotify: 'followers_total',
  youtube: 'subscriber_count',
  soundcloud: 'followers_count',
} as const;

/**
 * CONTENT_COUNT
 * Total public content items (tracks / videos) on the platform.
 * Conceptually similar but not comparable (a track ≠ a video).
 */
export const METRIC_CONTENT_COUNT: Record<'spotify' | 'youtube' | 'soundcloud', string> = {
  spotify: 'top_tracks_count', // number of tracks returned by the top-tracks endpoint (≤ 5)
  youtube: 'video_count', // total public video count from the channel statistics
  soundcloud: 'track_count', // total public track count from the user profile
} as const;

// ---------------------------------------------------------------------------
// Per-platform metric catalogue (canonical key names stored in DB)
// ---------------------------------------------------------------------------

/**
 * Spotify metric keys and their semantics.
 * All produced by SpotifyInsightsProvider.syncLatestSnapshot()
 */
export const SPOTIFY_METRIC_KEYS = {
  /** Number of Spotify followers (public figure, never null) */
  FOLLOWERS_TOTAL: 'followers_total',
  /** Popularity score 0-100 (algorithmic, opaque; may fluctuate frequently) */
  POPULARITY: 'popularity',
  /** Number of genres in the artist's genre list (informational only) */
  GENRES_COUNT: 'genres_count',
  /** Number of top tracks returned at sync time (1–5 usually; 0 if API returned 403) */
  TOP_TRACKS_COUNT: 'top_tracks_count',
} as const;

/**
 * YouTube metric keys and their semantics.
 * All produced by YouTubeInsightsProvider.syncLatestSnapshot()
 */
export const YOUTUBE_METRIC_KEYS = {
  /** Subscriber count; null when the channel has hidden its subscriber count */
  SUBSCRIBER_COUNT: 'subscriber_count',
  /** Cumulative view count across all videos */
  TOTAL_VIEWS: 'total_views',
  /** Total public video count on the channel */
  VIDEO_COUNT: 'video_count',
  /** Number of recent videos fetched at sync time (0–5) */
  RECENT_VIDEOS_COUNT: 'recent_videos_count',
  /** true when the channel has hidden its subscriber count */
  SUBSCRIBERS_HIDDEN: 'subscribers_hidden',
} as const;

/**
 * SoundCloud metric keys and their semantics.
 * All produced by SoundCloudInsightsProvider.syncLatestSnapshot()
 */
export const SOUNDCLOUD_METRIC_KEYS = {
  /** Public follower count */
  FOLLOWERS_COUNT: 'followers_count',
  /** Total public track count on the profile */
  TRACK_COUNT: 'track_count',
  /** Number of top tracks returned at sync time (0–5) */
  TOP_TRACKS_COUNT: 'top_tracks_count',
} as const;

// ---------------------------------------------------------------------------
// What can be trended in history charts
// ---------------------------------------------------------------------------

/**
 * All numeric metrics in the snapshots are suitable for trend charts.
 * Boolean metrics (subscribers_hidden) should be displayed as a flag, not trended.
 * Null values must be rendered as chart gaps — never as zero.
 *
 * Recommended granularity for history:
 *   - 7d range  → daily points
 *   - 30d range → daily points
 *   - 90d range → weekly aggregation in the dashboard (raw data kept daily in DB)
 *   - all       → weekly/monthly aggregation in the dashboard
 *
 * MAX stored per connection: MAX_INSIGHTS_HISTORY_POINTS (180) — ~6 months daily.
 */

// ---------------------------------------------------------------------------
// Sync timing constants
// ---------------------------------------------------------------------------

/** Minimum ms between two syncs for the same connection triggered by a user.
 *  Prevents double-click syndrome and rate-limit abuse. */
export const SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

/** Minimum ms between automated scheduled syncs for the same connection.
 *  The scheduler skips connections synced more recently than this. */
export const SYNC_SCHEDULED_MIN_INTERVAL_MS = 23 * 60 * 60 * 1000; // 23 hours

/** If a connection's lastSyncStatus is 'pending' and lastSyncStartedAt is within
 *  this window, a new sync attempt is blocked to prevent concurrent syncs. */
export const SYNC_CONCURRENT_GUARD_MS = 2 * 60 * 1000; // 2 minutes

/** Hard timeout for a single provider.syncLatestSnapshot() call.
 *  Prevents indefinite hangs when a platform API is slow/down. */
export const SYNC_PROVIDER_TIMEOUT_MS = 30 * 1000; // 30 seconds

/** Stagger delay between connections in a scheduled batch sync.
 *  Avoids thundering-herd API bursts when many artists sync simultaneously. */
export const SYNC_BATCH_STAGGER_MS = 2000; // 2 seconds

/**
 * How old a connection's lastSyncedAt must be before getSyncHealth() marks it
 * as stale. Set 2 hours above SYNC_SCHEDULED_MIN_INTERVAL_MS (23 h) to give
 * the daily cron a comfortable buffer for clock drift and slow batches without
 * producing false-positive stale alerts.
 */
export const SYNC_STALE_THRESHOLD_MS = 25 * 60 * 60 * 1000; // 25 hours

// ---------------------------------------------------------------------------
// Normalization rules summary (human-readable, not executable)
// ---------------------------------------------------------------------------
//
// RULE 1 — Preserve platform identity
//   Never merge metrics from different platforms into a single field.
//   A "total audience" (Spotify followers + YouTube subscribers) is MISLEADING
//   and MUST NOT appear in any view.
//
// RULE 2 — Use null, not zero, for unavailable data
//   If an API does not return a metric value, store null.
//   The chart layer renders null as a gap, not a zero — preventing false drops.
//
// RULE 3 — Partial sync is not failure
//   A sync that returns valid primary metrics (audience size, content count)
//   but no topContent is recorded as lastSyncStatus='partial', not 'error'.
//   This preserves useful data while signalling incomplete fetch.
//
// RULE 4 — Opaque metrics get platform-specific labels
//   Spotify's "popularity" is an internal algorithmic score.
//   It must always be shown with the label "Popularity (0–100)" and a tooltip
//   explaining it is not comparable to other platforms.
//
// RULE 5 — History points must be monotonically ordered by capturedAt
//   All queries order by capturedAt ASC for chart rendering.
//   The service reverses the DB result (DESC for latest-first lookup)
//   before building history arrays.
