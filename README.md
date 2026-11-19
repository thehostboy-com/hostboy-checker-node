# TheHostBoy checker for Node.js

Measures a bounded SHA-256 workload, temporary-file read/write timing, Node heap limit, and available parallelism, then submits one schema v1 report to TheHostBoy.

## Requirements

- Node.js 18.14 or newer (or Node.js 20+)
- HTTPS access to your TheHostBoy instance

No npm packages are required.

## Community checker setup

Create an account and checker installation on TheHostBoy, verify a domain you control, and copy the one-time key. Use the community report endpoint:

```sh
export HOSTBOY_REPORT_URL='https://HOSTBOY_DOMAIN/api/v1/community/reports'
export HOSTBOY_CHECKER_KEY='YOUR_INSTALLATION_KEY'
node hostboy-checker.mjs
```

The report URL and key are provided by TheHostBoy. Keep the key private; it allows submissions for this installation. To run periodically, configure both environment variables in the hosting account's cron environment and schedule `node /absolute/path/hostboy-checker.mjs`. Do not commit a key or a `.env` file.

The script sends a report at most once per run, retries bounded transient failures, times out requests, and refuses redirects. The checker performs local CPU and temporary-storage work; it does not scan site files or collect visitor data.

The default endpoint for a user-contributed installation is `/api/v1/community/reports`. Provider-authorized installations use the exact report URL supplied by an administrator. Community results are labeled self-reported and kept out of provider plan rankings.
