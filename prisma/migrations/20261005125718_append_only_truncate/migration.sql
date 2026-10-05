-- The row triggers on leave_balance_ledger and leave_request_events stop UPDATE and DELETE, but
-- TRUNCATE does not fire row triggers and would wipe the audit trail. Block it as well.
CREATE TRIGGER leave_balance_ledger_no_truncate
  BEFORE TRUNCATE ON leave_balance_ledger
  FOR EACH STATEMENT EXECUTE FUNCTION forbid_mutation();

CREATE TRIGGER leave_request_events_no_truncate
  BEFORE TRUNCATE ON leave_request_events
  FOR EACH STATEMENT EXECUTE FUNCTION forbid_mutation();
