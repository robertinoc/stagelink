WITH checks AS (
  SELECT
    'duplicate_user_email_case_insensitive' AS check_name,
    'critical' AS severity,
    COUNT(*)::bigint AS issue_count
  FROM (
    SELECT lower(email)
    FROM users
    GROUP BY lower(email)
    HAVING COUNT(*) > 1
  ) duplicates

  UNION ALL

  SELECT
    'duplicate_artist_username_case_insensitive',
    'critical',
    COUNT(*)::bigint
  FROM (
    SELECT lower(username)
    FROM artists
    GROUP BY lower(username)
    HAVING COUNT(*) > 1
  ) duplicates

  UNION ALL

  SELECT
    'artists_without_page',
    'warning',
    COUNT(*)::bigint
  FROM artists a
  LEFT JOIN pages p ON p.artist_id = a.id
  WHERE p.id IS NULL

  UNION ALL

  SELECT
    'artists_without_owner_membership',
    'critical',
    COUNT(*)::bigint
  FROM artists a
  LEFT JOIN artist_memberships am ON am.artist_id = a.id AND am.role = 'owner'
  WHERE am.id IS NULL

  UNION ALL

  SELECT
    'duplicate_block_positions_per_page',
    'warning',
    COUNT(*)::bigint
  FROM (
    SELECT page_id, position
    FROM blocks
    GROUP BY page_id, position
    HAVING COUNT(*) > 1
  ) duplicates

  UNION ALL

  SELECT
    'subscriber_block_artist_mismatch',
    'critical',
    COUNT(*)::bigint
  FROM subscribers s
  JOIN blocks b ON b.id = s.block_id
  JOIN pages p ON p.id = b.page_id
  WHERE p.artist_id <> s.artist_id

  UNION ALL

  SELECT
    'subscriber_page_artist_mismatch',
    'critical',
    COUNT(*)::bigint
  FROM subscribers s
  JOIN pages p ON p.id = s.page_id
  WHERE p.artist_id <> s.artist_id

  UNION ALL

  SELECT
    'duplicate_subscribers_case_insensitive',
    'critical',
    COUNT(*)::bigint
  FROM (
    SELECT artist_id, lower(email)
    FROM subscribers
    GROUP BY artist_id, lower(email)
    HAVING COUNT(*) > 1
  ) duplicates

  UNION ALL

  SELECT
    'analytics_block_artist_mismatch',
    'critical',
    COUNT(*)::bigint
  FROM analytics_events ae
  JOIN blocks b ON b.id = ae.block_id
  JOIN pages p ON p.id = b.page_id
  WHERE p.artist_id <> ae.artist_id

  UNION ALL

  SELECT
    'multiple_primary_custom_domains_per_artist',
    'critical',
    COUNT(*)::bigint
  FROM (
    SELECT artist_id
    FROM custom_domains
    WHERE is_primary = true
    GROUP BY artist_id
    HAVING COUNT(*) > 1
  ) duplicates

  UNION ALL

  SELECT
    'smart_links_destinations_not_array',
    'critical',
    COUNT(*)::bigint
  FROM smart_links
  WHERE jsonb_typeof(destinations::jsonb) <> 'array'

  UNION ALL

  SELECT
    'shopify_product_handles_not_array',
    'critical',
    COUNT(*)::bigint
  FROM shopify_connections
  WHERE jsonb_typeof(product_handles::jsonb) <> 'array'

  UNION ALL

  SELECT
    'insights_snapshot_connection_artist_mismatch',
    'critical',
    COUNT(*)::bigint
  FROM artist_platform_insights_snapshots s
  JOIN artist_platform_insights_connections c ON c.id = s.connection_id
  WHERE c.artist_id <> s.artist_id OR c.platform <> s.platform

  UNION ALL

  SELECT
    'uploaded_assets_without_delivery_url',
    'warning',
    COUNT(*)::bigint
  FROM assets
  WHERE status = 'uploaded' AND delivery_url IS NULL
)
SELECT check_name, severity, issue_count
FROM checks
WHERE issue_count > 0
ORDER BY
  CASE severity
    WHEN 'critical' THEN 0
    WHEN 'warning' THEN 1
    ELSE 2
  END,
  check_name;
