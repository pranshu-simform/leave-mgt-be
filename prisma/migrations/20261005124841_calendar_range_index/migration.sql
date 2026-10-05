-- Range lookup for the company-wide calendar, its count and the summary (no user_id to lead the
-- exclusion index). Chosen by EXPLAIN: see docs/query-plans.md.
CREATE INDEX leave_requests_active_range_gist ON leave_requests
  USING gist (daterange(start_date, end_date, '[]'))
  WHERE status IN ('PENDING', 'APPROVED');
