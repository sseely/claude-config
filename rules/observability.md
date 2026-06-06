# Observability

## SLO-first design

Before implementation: define 'working' as measurable SLI + SLO for each operation.
Scope: every externally-accessed operation — API endpoints, scheduled jobs, and queue
consumers. Internal helper functions don't require SLIs.
- SLI: metric (error rate, latency p95, queue depth)
- SLO: threshold triggering page (e.g., error rate < 0.1%, p95 < 200ms)
Cannot define SLI? Feature not ready to build — stop.

## Metrics — RED method

Instrument every external call, background job, and queue consumer with:

- **Rate** — requests/events per second
- **Error rate** — failures / total (not just error count)
- **Duration** — p50, p95, p99 latency (not just average)

Additionally for queues and jobs:
- Queue depth / backlog
- Processing lag (time between enqueue and process)
- Retry rate

Name metrics consistently: `<service>.<component>.<operation>.<unit>`
Example: `api.payment.charge.duration_ms`

## Distributed tracing

Every service boundary crossing must propagate trace context:

- Inject trace ID and span ID into outbound HTTP headers (`traceparent` /
  W3C Trace Context, or vendor equivalent)
- Extract and continue the trace on every inbound request
- Every log line in a request handler must include `trace_id`
- Span names must be human-readable: `POST /orders/{id}/confirm`, not
  `handler_func_42`
- Sample rate: 100% in development, adaptive (head-based or tail-based)
  in production — never 0%

## Logs (see also logging.md)

In the context of observability, logs must be correlated:
- Every log in a request path includes `trace_id` and `span_id`
- Every background job log includes `job_id` and `attempt_number`
- Error logs include enough context to reproduce without re-running:
  relevant IDs, input parameters (sanitized), and the operation name

## Alerting

Alert on **symptoms** (SLO burn rate), not **causes** (CPU utilization,
memory usage, individual error spikes).

- Multi-window burn rate alerts: fast burn (1h window, 2% budget consumed)
  + slow burn (6h window, 5% budget consumed)
- Alert fatigue kills on-call. Every alert must be actionable within 5
  minutes or it should not page.
- Route: critical (immediate page) → warning (ticket within 24h) →
  info (dashboard only)

## On-call readiness (required before merge)

Every feature that introduces new failure modes must have:

1. The 2–3 most likely failure modes identified and documented
2. For each: how an on-call engineer detects it (metric threshold,
   log pattern, alert name) and what the mitigation is
3. A runbook entry or inline `// on-call:` comment on non-obvious
   recovery procedures

Format for inline on-call comments:
```
// on-call: if <condition>, <mitigation>. Runbook: <link or "see service README">
```

## Dashboards

Every production feature should be visible on a dashboard within one sprint
of launch. Minimum panels:

- Request rate and error rate (last 24h)
- p95 latency
- Any background job success/failure rate

Do not merge a feature that introduces new critical paths without updating
(or creating) the service dashboard.

## What not to do

- Do not alert on individual error counts — use rates
- Do not use average latency as the primary SLI — use p95 or p99
- Do not omit trace context from async or background paths — they are
  the hardest to debug in production
- Do not log at DEBUG in production paths by default — they flood log
  aggregators and obscure real signals
