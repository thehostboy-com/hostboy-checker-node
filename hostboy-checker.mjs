import { createHash, randomBytes } from 'node:crypto';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { availableParallelism, tmpdir } from 'node:os';
import { join } from 'node:path';
import { getHeapStatistics } from 'node:v8';

async function main() {
  const key = process.env.HOSTBOY_CHECKER_KEY;
  const endpoint = new URL(process.env.HOSTBOY_REPORT_URL);
  if (!key || endpoint.username || endpoint.password || endpoint.hash ||
      (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && endpoint.hostname === '127.0.0.1'))) {
    throw new Error('Configure an HTTPS report URL and checker key');
  }
  const block = Buffer.alloc(1024 * 1024, 97);
  const start = performance.now();
  for (let i = 0; i < 32; i++) createHash('sha256').update(block).digest();
  const hashMs = performance.now() - start;
  let diskMs = null;
  let directory;
  try {
    directory = mkdtempSync(join(tmpdir(), 'hostboy-'));
    const file = join(directory, 'block');
    const started = performance.now();
    writeFileSync(file, block);
    readFileSync(file);
    diskMs = performance.now() - started;
  } catch {
    // Some hosts restrict temporary storage.
  } finally {
    if (directory) rmSync(directory, { force: true, recursive: true });
  }
  const payload = JSON.stringify({
    runtime: 'node', schemaVersion: 1, version: process.versions.node, suite: 'hostboy-v1', requestId: randomBytes(16).toString('hex'), hashMs, diskMs,
    memoryLimitBytes: getHeapStatistics().heap_size_limit, availableParallelism: availableParallelism()
  });
  let response;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      response = await fetch(endpoint, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000),
        headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: payload
      });
      if (response.ok) break;
      if (response.status < 500 || attempt === 2) throw new Error('Report rejected (HTTP ' + response.status + ')');
    } catch (error) {
      if (error.message.startsWith('Report rejected') || attempt === 2) throw error;
    }
    await new Promise(resolve => setTimeout(resolve, 250 * (2 ** attempt)));
  }
  if (!response?.ok) throw new Error('Report rejected');
  console.log('TheHostBoy report accepted');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
