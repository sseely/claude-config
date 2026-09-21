## Observation: PostgreSQL rejects FOR UPDATE combined with GROUP BY
- **Context**: T25 (payments-setup) wrote vitest cases against a real Postgres 16 for coupon redemption.
- **Finding**: `SELECT ... FROM coupons c ... GROUP BY c.id ... FOR UPDATE OF c` fails with "FOR UPDATE is not allowed with GROUP BY clause"; the original handleRedeemCoupon 500ed on every call. Fix: lock the row with a plain `SELECT ... FOR UPDATE`, then run the aggregate as a second statement in the same transaction.
- **Impact**: any *-setup template that combines row locking with an aggregate (compliance-setup cleanup, analytics counters) has the same failure mode; templates were never executed against a real database before this mission.
- **Confidence**: High (reproduced by execution).
