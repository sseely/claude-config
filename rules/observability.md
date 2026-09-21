# Observability

## SLO-first design

Before implementation: define 'working' as a measurable SLI + SLO for
every externally-accessed operation — API endpoints, scheduled jobs,
queue consumers (internal helpers don't need SLIs). SLI: a metric (error
rate, latency p95, queue depth). SLO: a threshold that triggers a page
(e.g., error rate < 0.1%, p95 < 200ms). If a key operation has no
definable SLI, stop and define it before writing the handler.

## Metrics — RED method

Instrument every external call, background job, and queue consumer with
**Rate** (events/sec), **Error rate** (failures / total, not just a
count), and **Duration** (p50/p95/p99, not just average). Queues and
jobs also need queue depth/backlog, processing lag, and retry rate. Name
metrics consistently: `<service>.<component>.<operation>.<unit>` (e.g.
`api.payment.charge.duration_ms`).

## Distributed tracing

Every service boundary crossing must propagate trace context: inject and
extract it on every outbound/inbound request (`traceparent` / W3C Trace
Context, or vendor equivalent), include `trace_id` on every log line in
a request handler, use human-readable span names (`POST
/orders/{id}/confirm`, not `handler_func_42`), and sample adaptively in
production — never 0%.

## Logs (see also logging.md)

Logs must be correlated: every request-path log includes `trace_id` and
`span_id`; every background job log includes `job_id` and
`attempt_number`. `logging.md` owns field lists and error-log content.

## Alerting

Alert on **symptoms** (SLO burn rate), not **causes** (CPU, memory,
individual error spikes). Use multi-window burn-rate alerts: fast burn
(1h window, 2% budget consumed) plus slow burn (6h window, 5% budget
consumed). Every alert must be actionable within 5 minutes or it
shouldn't page. Route: critical (immediate page) → warning (ticket
within 24h) → info (dashboard only).

## On-call readiness (required before merge)

Every feature that introduces new failure modes must have: the 2-3 most
likely failure modes identified and documented; for each, how an
on-call engineer detects it (metric threshold, log pattern, alert name)
and the mitigation; and a runbook entry or inline `// on-call:` comment
on non-obvious recovery procedures — concrete test: a runbook entry is
required whenever the recovery step is not simply "retry" or "restart".
Format: `// on-call: if <condition>, <mitigation>. Runbook: <link>`.

## Dashboards

Every production feature must be visible on a dashboard within one
sprint of launch (request rate, error rate, p95 latency, background job
success/failure rate). Do not merge a feature with new critical paths
without updating the service dashboard. For AI-feature post-deployment
monitoring and drift, see `docs/nist-ai-rmf/crosswalk.md`.

## What not to do

Do not alert on individual error counts (use rates); do not use average
latency as the primary SLI (use p95/p99); do not omit trace context from
async/background paths; do not log at DEBUG in production by default.
