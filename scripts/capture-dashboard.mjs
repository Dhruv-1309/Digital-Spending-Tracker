import { spawn, execSync } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 5188;
const CDP_PORT = 9225;
const OUT_DIR = path.resolve('docs/redesign/screenshots');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function main() {
  console.log('Starting Vite server on port', PORT);
  const vite = spawn('npx', ['--workspace=apps/web', 'vite', '--port', String(PORT)], {
    shell: true,
    stdio: 'pipe',
  });

  await sleep(3500);

  const chrome = spawn(CHROME_PATH, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${CDP_PORT}`,
    'about:blank'
  ]);

  await sleep(2000);

  const targets = await getJson(`http://localhost:${CDP_PORT}/json`);
  const pageTarget = targets.find(t => t.type === 'page');
  if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
    throw new Error('No CDP page target found');
  }

  const ws = new globalThis.WebSocket(pageTarget.webSocketDebuggerUrl);

  const viewports = [
    { name: 'dashboard-1440.png', width: 1440, height: 900, dsf: 1, mobile: false, state: 'populated' },
    { name: 'dashboard-390.png', width: 390, height: 844, dsf: 2, mobile: true, state: 'populated' },
    { name: 'dashboard-375.png', width: 375, height: 667, dsf: 2, mobile: true, state: 'populated' },
    { name: 'dashboard-empty-1440.png', width: 1440, height: 900, dsf: 1, mobile: false, state: 'empty' },
  ];

  let currentIdx = 0;
  let nextMsgId = 1;

  function sendCmd(method, params = {}) {
    const id = nextMsgId++;
    ws.send(JSON.stringify({ id, method, params }));
    return id;
  }

  ws.addEventListener('open', () => {
    sendCmd('Page.enable');
    processNextViewport();
  });

  function processNextViewport() {
    if (currentIdx >= viewports.length) {
      console.log('All dashboard screenshots captured successfully!');
      ws.close();
      cleanup();
      return;
    }

    const vp = viewports[currentIdx];
    console.log(`Setting up ${vp.name} (${vp.width}x${vp.height}, mobile=${vp.mobile})...`);
    sendCmd('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.dsf,
      mobile: vp.mobile
    });
    sendCmd('Page.navigate', {
      url: `http://localhost:${PORT}/#audit?screen=dashboard&state=${vp.state}`
    });
  }

  ws.addEventListener('message', async (event) => {
    const res = JSON.parse(event.data);
    if (res.method === 'Page.loadEventFired') {
      await sleep(1500);
      const captureId = sendCmd('Page.captureScreenshot', { format: 'png' });
      ws._pendingCaptureId = captureId;
    } else if (res.id && res.id === ws._pendingCaptureId) {
      const vp = viewports[currentIdx];
      const outPath = path.join(OUT_DIR, vp.name);
      fs.writeFileSync(outPath, Buffer.from(res.result.data, 'base64'));
      console.log(`Saved screenshot: ${outPath}`);
      currentIdx++;
      await sleep(500);
      processNextViewport();
    }
  });

  function cleanup() {
    chrome.kill();
    vite.kill();
    try {
      execSync(`taskkill /F /T /PID ${chrome.pid}`, { stdio: 'ignore' });
      execSync(`taskkill /F /T /PID ${vite.pid}`, { stdio: 'ignore' });
    } catch {}
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
