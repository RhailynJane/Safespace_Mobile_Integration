# Convex Announcements Performance Test Cases

| ID | Scenario | Params | Metrics Target | Pass Criteria |
|----|----------|--------|----------------|---------------|
| TC-PERF-ANN-01 | Baseline latency | requests=100 concurrency=10 limit=50 activeOnly=true | p95 < 500ms, errorRate = 0% | p95 < 500ms AND errors=0 |
| TC-PERF-ANN-02 | High concurrency stress | requests=500 concurrency=50 limit=50 activeOnly=true | p95 < 750ms, errorRate < 1% | p95 < 750ms AND errorRate < 1% |
| TC-PERF-ANN-03 | Ramp concurrency (10→100) | 5 segments of 100 each | p95 growth < 2x baseline | Max segment p95 < 2 * baseline p95 |
| TC-PERF-ANN-04 | Large payload limit | requests=100 concurrency=10 limit=200 activeOnly=false | p95 < 600ms | p95 < 600ms |
| TC-PERF-ANN-05 | Active vs all comparison | A) activeOnly=true B) activeOnly=false | Delta p95 < 15% | |p95(all) - p95(active)| / p95(active) < 0.15 |
| TC-PERF-ANN-06 | Error handling invalid org | orgId=invalid-org requests=50 concurrency=10 | 100% errors, fast fail < 200ms p95 | p95 < 200ms AND errors=100% |
| TC-PERF-ANN-07 | Threshold enforcement | baseline params | Non-zero exit if p95>500 | Script exits code !=0 on breach |
| TC-PERF-ANN-08 | Scaling limit parameter | limits: 10,50,100 (each 100 req) | p95 trend roughly linear | p95(100) < 2 * p95(10) |
| TC-PERF-ANN-09 | Stability over time | 1000 requests concurrency=20 | No memory leak (steady avg) | Avg drift < 10% across quartiles |
| TC-PERF-ANN-10 | Docker vs local parity | Same params both envs | p95 delta < 20% | |p95(docker)-p95(local)|/p95(local) < 0.20 |

## Execution Notes
- Endpoint: `/api/query` with path `announcements:listByOrg`.
- Auth: Not required for read query; if future auth needed add Bearer token.
- Collect JSON report at `testing/performance/convex/announcements-load-report.json` per run.

## Improvement Backlog
- Add automatic token injection for protected queries.
- Export CSV for longitudinal tracking.
- Integrate into CI with nightly ramp test.
