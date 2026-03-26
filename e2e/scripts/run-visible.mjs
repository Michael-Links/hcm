import { spawn } from 'node:child_process';
import http from 'node:http';
import https from 'node:https';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const extraArgs = process.argv.slice(2);
const playwrightCli = require.resolve('@playwright/test/cli');
const isListCommand = extraArgs.includes('--list');

function probeUrl(url) {
  const client = url.startsWith('https:') ? https : http;

  return new Promise((resolve) => {
    const request = client.request(
      url,
      {
        method: 'GET',
        timeout: 3000,
      },
      (response) => {
        response.resume();
        resolve({ ok: true, statusCode: response.statusCode ?? 0 });
      },
    );

    request.on('timeout', () => {
      request.destroy(new Error('Timed out'));
    });
    request.on('error', (error) => {
      resolve({ ok: false, error: error.message });
    });
    request.end();
  });
}

async function resolveBaseUrl() {
  const configuredBaseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5137';
  if (isListCommand) {
    return configuredBaseUrl;
  }

  const directProbe = await probeUrl(configuredBaseUrl);
  if (directProbe.ok) {
    return configuredBaseUrl;
  }

  const configuredUrl = new URL(configuredBaseUrl);
  if (configuredUrl.hostname !== 'localhost') {
    throw new Error(`Could not reach ${configuredBaseUrl}: ${directProbe.error}`);
  }

  const fallbackUrl = new URL(configuredBaseUrl);
  fallbackUrl.hostname = '127.0.0.1';

  const fallbackProbe = await probeUrl(fallbackUrl.toString());
  if (fallbackProbe.ok) {
    console.warn(
      `Could not reach ${configuredBaseUrl}; falling back to ${fallbackUrl.toString()} for Playwright.`,
    );
    return fallbackUrl.toString();
  }

  throw new Error(
    `Could not reach ${configuredBaseUrl} or ${fallbackUrl.toString()}. ` +
      `Start the app first, or set PLAYWRIGHT_BASE_URL to the exact reachable origin.`,
  );
}

const baseUrl = await resolveBaseUrl();
const env = {
  ...process.env,
  PLAYWRIGHT_BASE_URL: baseUrl,
  PLAYWRIGHT_VISUAL: '1',
  PLAYWRIGHT_SLOWMO: process.env.PLAYWRIGHT_SLOWMO ?? '250',
};

console.log(`Starting visible Playwright run at ${baseUrl}`);

const child = spawn(process.execPath, [playwrightCli, 'test', '--headed', ...extraArgs], {
  stdio: 'inherit',
  env,
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});
