import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\dhruv\\.gemini\\antigravity\\brain\\9f4bda35-ef77-4d82-8ec9-59eab9363178';
const DOCS_DIR = path.resolve('docs/redesign/screenshots');

const targets = [
  {
    name: 'sidebar-expanded-1440.png',
    url: 'http://localhost:5173/#audit?screen=dashboard&state=populated&sidebar=expanded',
    width: 1440,
    height: 900,
  },
  {
    name: 'sidebar-collapsed-1440.png',
    url: 'http://localhost:5173/#audit?screen=dashboard&state=populated&sidebar=collapsed',
    width: 1440,
    height: 900,
  },
  {
    name: 'sidebar-collapsed-transactions-1440.png',
    url: 'http://localhost:5173/#audit?screen=transactions&state=populated&sidebar=collapsed',
    width: 1440,
    height: 900,
  },
];

for (const target of targets) {
  const artifactPath = path.join(ARTIFACT_DIR, target.name);
  const docsPath = path.join(DOCS_DIR, target.name);

  console.log(`Capturing ${target.name}...`);
  const cmd = `"${CHROME_PATH}" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=2000 --window-size=${target.width},${target.height} --screenshot="${artifactPath}" "${target.url}"`;
  try {
    execSync(cmd, { stdio: 'inherit' });
    fs.copyFileSync(artifactPath, docsPath);
    console.log(`✓ Saved ${target.name} to artifact dir and docs dir`);
  } catch (err) {
    console.error(`✗ Error capturing ${target.name}:`, err.message);
  }
}
