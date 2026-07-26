SELECT
  COUNT(DISTINCT CASE WHEN name = 'visited' THEN session_hash END) AS users,
  COUNT(DISTINCT CASE WHEN name = 'edited' THEN session_hash END) AS edited,
  COUNT(DISTINCT CASE WHEN name = 'adjusted' THEN session_hash END) AS adjusted,
  COUNT(DISTINCT CASE WHEN name = 'printed' THEN session_hash END) AS printed,
  COUNT(DISTINCT CASE WHEN name = 'returned' THEN session_hash END) AS returned,
  COUNT(DISTINCT CASE WHEN name = 'visited' AND occurred_on >= date('now', '-6 days') THEN session_hash END) AS users_7d,
  COUNT(DISTINCT CASE WHEN name = 'printed' AND occurred_on >= date('now', '-6 days') THEN session_hash END) AS printed_7d
FROM product_events;
