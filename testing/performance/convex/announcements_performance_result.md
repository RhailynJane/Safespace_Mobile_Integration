# Convex Announcements Performance Result (Latest Run)

**Run Timestamp:** 2025-11-24T03:02:33.987Z  
**Endpoint:** https://formal-pigeon-483.convex.cloud  
**Org:** cmha-calgary  
**Parameters:** requests=100 concurrency=10 activeOnly=true limit=50

## Metrics
- Count: 100
- Errors: 100 (all responses treated as shape mismatch)
- Min: 85.22 ms
- Max: 637.84 ms
- Avg: 144.05 ms
- P50: 90.65 ms
- P90: 621.50 ms
- P95: 632.93 ms (Threshold 500 ms BREACHED)
- P99: 637.84 ms

## Observed Response Samples (truncated)
All samples show a wrapper `{status:"success", value:{ announcements:[...] }}`. The harness currently expects top-level `announcements` but Convex HTTP API wraps results. This mismatch caused `errors=100`.

### Sample Payload (truncated)
```
{"status":"success","value":{"announcements":[{"active":true,"body":"We are thrilled to introduce our new Community Wellness Initiative, ...
```

## Root Cause Analysis
- The performance script checks `result.announcements`; actual data resides at `result.value.announcements`.
- Error classification inflated to 100% due to this shape discrepancy.
- Latency metrics are still valid; p95 above desired 500ms threshold, potentially influenced by unnecessary error handling overhead.

## Planned Fixes
1. Update harness to read `value.announcements`.
2. Re-run baseline test (TC-PERF-ANN-01) to establish correct error rate (expected 0%).
3. Add exit code failure when `errors > 0` for baseline scenario.

## Recommendations
- After shape fix, re-evaluate p95; if still >500ms, consider:
  - Increasing instance capacity / index tuning.
  - Reducing limit from 50 to targeted typical usage (e.g., 20).
  - Implementing caching layer (in-memory) for frequent reads.

## Next Actions
- Patch harness shape check.
- Re-run baseline and update this report.
- Implement CI threshold gating.
