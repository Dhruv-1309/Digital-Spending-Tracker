import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = path.resolve('docs/redesign/screenshots/states');
const PORT = 5176;

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const screens = ['dashboard', 'transactions', 'autopay', 'analytics', 'auth', 'profile'];
const states = ['populated', 'loading', 'empty', 'error'];
const viewports = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 },
];

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('Starting Vite server on port', PORT);
  const vite = spawn('npx', ['--workspace=apps/web', 'vite', '--port', String(PORT)], {
    shell: true,
    stdio: 'pipe',
  });

  vite.stdout.on('data', (d) => process.stdout.write(d.toString()));
  vite.stderr.on('data', (d) => process.stderr.write(d.toString()));

  // Wait for server to be up
  console.log('Waiting for Vite server to initialize...');
  await sleep(4000);

  let count = 0;
  for (const screen of screens) {
    for (const state of states) {
      for (const vp of viewports) {
        const outName = `${screen}-${state}-${vp.name}.png`;
        const outPath = path.join(OUT_DIR, outName);
        const url = `http://localhost:${PORT}/#audit?screen=${screen}&state=${state}`;

        console.log(`[${++count}/${screens.length * states.length * viewports.length}] Capturing ${outName}...`);
        
        const cmd = `"${CHROME_PATH}" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=2000 --window-size=${vp.width},${vp.height} --screenshot="${outPath}" "${url}"`;
        try {
          execSync(cmd, { stdio: 'ignore' });
        } catch (e) {
          console.error(`Failed to capture ${outName}:`, e.message);
        }
      }
    }
  }

  console.log('All screenshots captured! Shutting down Vite server...');
  vite.kill();
  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /F /T /PID ${vite.pid}`, { stdio: 'ignore' });
    } catch {}
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
