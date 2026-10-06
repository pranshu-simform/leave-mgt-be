-- CreateIndex
CREATE INDEX "leave_request_events_request_id_created_at_id_idx" ON "leave_request_events"("request_id", "created_at", "id");
