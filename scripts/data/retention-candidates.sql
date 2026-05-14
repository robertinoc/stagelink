WITH retention_config AS (
  SELECT
    now() - interval '13 months' AS raw_analytics_cutoff,
    now() - interval '90 days' AS short_analytics_cutoff,
    now() - interval '24 hours' AS stale_pending_asset_cutoff,
    now() - interval '30 days' AS failed_asset_cutoff,
    now() - interval '13 months' AS stripe_webhook_cutoff,
    now() - interval '13 months' AS insights_snapshot_cutoff,
    now() - interval '12 months' AS audit_log_cutoff,
    now() - interval '3 years' AS dsar_cutoff,
    now() - interval '30 days' AS deleted_user_cutoff
)
SELECT
  'raw_analytics_older_than_13_months' AS candidate_group,
  'analytics_events' AS table_name,
  COUNT(*)::bigint AS candidate_count,
  'Delete raw rows or aggregate before deletion after legal approval.' AS recommended_action
FROM analytics_events, retention_config
WHERE created_at < raw_analytics_cutoff

UNION ALL

SELECT
  'qa_internal_nonproduction_or_bot_analytics_older_than_90_days',
  'analytics_events',
  COUNT(*)::bigint,
  'Delete test/internal/non-production/bot rows after review.'
FROM analytics_events, retention_config
WHERE created_at < short_analytics_cutoff
  AND (
    is_qa = true
    OR is_internal = true
    OR is_bot_suspected = true
    OR environment::text <> 'production'
  )

UNION ALL

SELECT
  'stale_pending_assets_older_than_24_hours',
  'assets',
  COUNT(*)::bigint,
  'Verify object absence/deletion, then mark/delete pending rows.'
FROM assets, retention_config
WHERE status::text = 'pending'
  AND created_at < stale_pending_asset_cutoff

UNION ALL

SELECT
  'failed_or_deleted_asset_rows_older_than_30_days',
  'assets',
  COUNT(*)::bigint,
  'Verify object cleanup, then remove stale local rows.'
FROM assets, retention_config
WHERE status::text IN ('failed', 'deleted')
  AND updated_at < failed_asset_cutoff

UNION ALL

SELECT
  'stripe_webhook_events_older_than_13_months',
  'stripe_webhook_events',
  COUNT(*)::bigint,
  'Delete old idempotency rows only after final replay/legal window approval.'
FROM stripe_webhook_events, retention_config
WHERE created_at < stripe_webhook_cutoff

UNION ALL

SELECT
  'platform_insights_snapshots_older_than_13_months',
  'artist_platform_insights_snapshots',
  COUNT(*)::bigint,
  'Delete old raw provider snapshots after aggregation/window review.'
FROM artist_platform_insights_snapshots, retention_config
WHERE captured_at < insights_snapshot_cutoff

UNION ALL

SELECT
  'audit_logs_older_than_12_months',
  'audit_logs',
  COUNT(*)::bigint,
  'Purge only after legal/security retention approval and no legal hold.'
FROM audit_logs, retention_config
WHERE created_at < audit_log_cutoff

UNION ALL

SELECT
  'completed_dsar_records_older_than_3_years',
  'dsar_requests',
  COUNT(*)::bigint,
  'Purge limited DSAR metadata only after accountability window expires.'
FROM dsar_requests, retention_config
WHERE status::text = 'completed'
  AND completed_at IS NOT NULL
  AND completed_at < dsar_cutoff

UNION ALL

SELECT
  'deleted_local_users_older_than_30_days',
  'users',
  COUNT(*)::bigint,
  'Review local anonymized anchors and provider deletion completion.'
FROM users, retention_config
WHERE deleted_at IS NOT NULL
  AND deleted_at < deleted_user_cutoff

ORDER BY candidate_group;
