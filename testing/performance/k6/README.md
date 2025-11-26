# k6 Performance Testing

This directory contains k6 scripts for exercising critical SafeSpace feature endpoints.

## Scripts
- `announcements-smoke.js` : Lightweight smoke load (5 VUs / 30s) hitting announcements listing endpoint.

## Running Locally (requires k6 installed)
```powershell
npm run perf:k6:local
```

## Running in Docker
```powershell
docker-compose -f docker-compose.test.yml run --rm k6-smoke
```

Set `BASE_URL` (defaults to `http://host.docker.internal:3000`) if backend runs elsewhere:
```powershell
$env:BASE_URL="http://localhost:4000"; docker-compose -f docker-compose.test.yml run --rm k6-smoke
```

## Customizing Load
Edit `options` in the script (e.g. `vus`, `duration`) or extend with stages:
```javascript
export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 }
  ]
};
```

## Adding New Scripts
Create a new file under `testing/performance/k6/` and reference it via a new service in `docker-compose.test.yml` or run ad hoc:
```powershell
k6 run testing/performance/k6/new-script.js
```

## Choosing k6 vs Artillery
- **k6**: Rich metrics, threshold assertions, cloud & Grafana ecosystem integration.
- **Artillery**: Simple JS/YAML config, good for quick HTTP scenario definitions.
Use both: Artillery for quick prototyping, k6 for sustained/load analysis and thresholds.
