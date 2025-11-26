/*
  Convex performance/load test for announcements listByOrg query.
  Usage (local):
    EXPO_PUBLIC_CONVEX_URL="https://YOUR_CONVEX_URL" npm run perf:convex:announcements

  Docker (service sets EXPO_PUBLIC_CONVEX_URL):
    docker-compose -f docker-compose.test.yml run --rm test-performance-convex

  Parameters via env vars:
    ORG_ID (default: sait)
    REQUESTS (total queries, default: 100)
    CONCURRENCY (parallel in-flight queries, default: 10)
    ACTIVE_ONLY (default: true)
    LIMIT (default: 50)
    OUT_JSON (output path, default: testing/performance/convex/announcements-load-report.json)
*/

// Minimal Convex performance harness (no generated API types required)
// We avoid importing .ts extensions to satisfy current tsconfig (no allowImportingTsExtensions).
// Direct dynamic import of Convex client keeps this self-contained.
import fs from "fs";
import path from "path";

// Direct HTTP query approach (avoids needing ConvexClient / WebSocket in Node)
// Convex query endpoint expects JSON: { path: "module:function", args: {...} }
async function runConvexQuery(baseUrl: string, pathName: string, args: any) {
  const res = await fetch(`${baseUrl}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: pathName, args }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return await res.json();
}

function hrtimeMs(start: bigint, end: bigint): number {
  return Number(end - start) / 1_000_000;
}

async function main() {
  const url = process.env.EXPO_PUBLIC_CONVEX_URL;
  if (!url) {
    console.error("Missing EXPO_PUBLIC_CONVEX_URL; aborting.");
    process.exit(1);
  }

  const ORG_ID = process.env.ORG_ID || "cmha-calgary";
  const REQUESTS = parseInt(process.env.REQUESTS || "100", 10);
  const CONCURRENCY = parseInt(process.env.CONCURRENCY || "10", 10);
  const ACTIVE_ONLY = (process.env.ACTIVE_ONLY || "true") === "true";
  const LIMIT = parseInt(process.env.LIMIT || "50", 10);
  const OUT_JSON = process.env.OUT_JSON || "testing/performance/convex/announcements-load-report.json";

  const listByOrgRef = "announcements:listByOrg";

  const latencies: number[] = [];
  let errors = 0;
  const errorSamples: { status?: number; message?: string }[] = [];

  async function runQueryBatch(batchSize: number) {
    const tasks: Promise<void>[] = [];
    for (let i = 0; i < batchSize; i++) {
      const start = process.hrtime.bigint();
      const p = runConvexQuery(url, listByOrgRef, { orgId: ORG_ID, activeOnly: ACTIVE_ONLY, limit: LIMIT })
        .then((result: any) => {
          const end = process.hrtime.bigint();
          latencies.push(hrtimeMs(start, end));
          const announcements = result?.value?.announcements;
          if (!result || result.status !== 'success' || !Array.isArray(announcements)) {
            errors += 1;
            if (errorSamples.length < 5) {
              errorSamples.push({ message: JSON.stringify(result).slice(0, 240) });
            }
          }
        })
        .catch((e: any) => {
          const end = process.hrtime.bigint();
            latencies.push(hrtimeMs(start, end));
            errors += 1;
            if (errorSamples.length < 5) {
              errorSamples.push({ message: String(e?.message || e).slice(0,200) });
            }
        });
      tasks.push(p);
    }
    await Promise.all(tasks);
  }

  const batches = Math.ceil(REQUESTS / CONCURRENCY);
  for (let b = 0; b < batches; b++) {
    const remaining = REQUESTS - b * CONCURRENCY;
    const size = Math.min(CONCURRENCY, remaining);
    await runQueryBatch(size);
  }

  latencies.sort((a, b) => a - b);
  const count = latencies.length;
  const min = count ? latencies[0] : 0;
  const max = count ? latencies[count - 1] : 0;
  const avg = count ? latencies.reduce((a, c) => a + c, 0) / count : 0;
  const quantile = (arr: number[], q: number) => {
    if (!arr.length) return 0;
    const idx = Math.floor(arr.length * q);
    return arr[Math.min(idx, arr.length - 1)];
  };
  const p50 = quantile(latencies, 0.5);
  const p90 = quantile(latencies, 0.9);
  const p95 = quantile(latencies, 0.95);
  const p99 = quantile(latencies, 0.99);

  const report = {
    timestamp: new Date().toISOString(),
    convexUrl: url,
    orgId: ORG_ID,
    requests: REQUESTS,
    concurrency: CONCURRENCY,
    activeOnly: ACTIVE_ONLY,
    limit: LIMIT,
    metrics: { count, errors, min, max, avg, p50, p90, p95, p99 },
    errorSamples,
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2));

  console.log("Convex announcements load test complete: \n", report);

  // Simple threshold example (adjust as needed)
  if (!count) {
    console.warn("⚠️ No successful measurements recorded (all errored or zero requests).");
  } else {
    const p95Val: number = p95 || 0;
    if (p95Val > 500) {
      console.warn(`⚠️ p95 latency ${p95Val.toFixed(2)}ms exceeds 500ms threshold`);
      process.exitCode = 2;
    } else {
      console.log(`✅ p95 latency ${p95Val.toFixed(2)}ms within threshold`);
    }
    if (errors > 0) {
      console.warn(`⚠️ Non-zero errors (${errors}) detected.`);
      if (!process.exitCode) process.exitCode = 3; // distinct code if latency was fine but errors present
    }
  }
}

main().catch((e) => {
  console.error("Unhandled error in load test", e);
  process.exit(1);
});
