import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

async function generateBrandImages() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // 1. Generate Apple Touch Icon (180x180)
  await page.setViewportSize({ width: 180, height: 180 });
  const appleIconHtml = `<!doctype html>
<html>
  <head>
    <style>
      body {
        margin: 0;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #4f46e5 100%);
        width: 180px;
        height: 180px;
        overflow: hidden;
      }
      .coin {
        position: absolute;
        bottom: 22px;
        right: 22px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
        border: 3px solid #fef3c7;
        box-shadow: 0 8px 16px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #78350f;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 32px;
        font-weight: 900;
      }
      .wallet {
        width: 90px;
        height: 68px;
        background: #ffffff;
        border-radius: 14px;
        position: relative;
        box-shadow: 0 10px 25px rgba(0,0,0,0.25);
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding: 8px;
        box-sizing: border-box;
      }
      .wallet-top {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 22px;
        background: #e2e8f0;
        border-top-left-radius: 14px;
        border-top-right-radius: 14px;
      }
      .bars {
        display: flex;
        align-items: flex-end;
        gap: 6px;
        height: 30px;
        padding-left: 6px;
      }
      .bar1 { width: 9px; height: 16px; background: #10b981; border-radius: 2px; }
      .bar2 { width: 9px; height: 26px; background: #2563eb; border-radius: 2px; }
      .bar3 { width: 9px; height: 20px; background: #6366f1; border-radius: 2px; }
    </style>
  </head>
  <body>
    <div class="wallet">
      <div class="wallet-top"></div>
      <div class="bars">
        <div class="bar1"></div>
        <div class="bar2"></div>
        <div class="bar3"></div>
      </div>
    </div>
    <div class="coin">₹</div>
  </body>
</html>`;

  await page.setContent(appleIconHtml);
  const appleIconPath = path.resolve('apps/web/public/apple-touch-icon.png');
  await page.screenshot({ path: appleIconPath });
  console.log('Generated:', appleIconPath);

  // 2. Generate OG Social Preview Banner (1200x630)
  await page.setViewportSize({ width: 1200, height: 630 });
  const ogHtml = `<!doctype html>
<html>
  <head>
    <style>
      body {
        margin: 0;
        padding: 0;
        width: 1200px;
        height: 630px;
        background: #0b0f19;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #f8fafc;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 64px 80px;
        box-sizing: border-box;
        position: relative;
        overflow: hidden;
      }
      .glow-1 {
        position: absolute;
        top: -120px;
        right: -80px;
        width: 600px;
        height: 600px;
        background: radial-gradient(circle, rgba(37, 99, 235, 0.28) 0%, rgba(79, 70, 229, 0.12) 50%, transparent 70%);
        pointer-events: none;
      }
      .glow-2 {
        position: absolute;
        bottom: -150px;
        left: -100px;
        width: 500px;
        height: 500px;
        background: radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%);
        pointer-events: none;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .logo {
        width: 54px;
        height: 54px;
        border-radius: 16px;
        background: #2563eb;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        font-weight: bold;
        box-shadow: 0 8px 24px rgba(37,99,235,0.4);
      }
      .brand-name {
        font-size: 32px;
        font-weight: 800;
        letter-spacing: -0.5px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 14px;
        border-radius: 9999px;
        background: rgba(37, 99, 235, 0.18);
        border: 1px solid rgba(59, 130, 246, 0.35);
        color: #60a5fa;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 18px;
      }
      .headline {
        font-size: 56px;
        font-weight: 800;
        line-height: 1.15;
        letter-spacing: -1px;
        max-width: 850px;
      }
      .gradient-text {
        background: linear-gradient(90deg, #60a5fa 0%, #818cf8 50%, #34d399 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .subhead {
        font-size: 22px;
        color: #94a3b8;
        line-height: 1.5;
        max-width: 760px;
        margin-top: 16px;
      }
      .footer-pills {
        display: flex;
        align-items: center;
        gap: 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 28px;
      }
      .pill {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        color: #cbd5e1;
        font-weight: 500;
      }
      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #10b981;
      }
    </style>
  </head>
  <body>
    <div class="glow-1"></div>
    <div class="glow-2"></div>
    <div>
      <div class="brand">
        <div class="logo">₹</div>
        <div class="brand-name">MoneyTracker</div>
      </div>
    </div>
    <div>
      <div class="badge">🛡️ Zero Bank Aggregators • 100% On-Device Privacy</div>
      <div class="headline">
        Master your personal cashflow. <br />
        <span class="gradient-text">Without selling your financial data.</span>
      </div>
      <div class="subhead">
        Owned, integer-precise personal finance with statistical anomaly detection and offline-first IndexedDB sync.
      </div>
    </div>
    <div class="footer-pills">
      <div class="pill"><span class="dot"></span> Integer Paise Precision (0.1 + 0.2 = 0.3)</div>
      <div class="pill"><span class="dot"></span> Offline-First IndexedDB Sync Queue</div>
      <div class="pill"><span class="dot"></span> Aligned with India DPDP Act 2023</div>
    </div>
  </body>
</html>`;

  await page.setContent(ogHtml);
  const ogImagePath = path.resolve('apps/web/public/og-image.png');
  await page.screenshot({ path: ogImagePath });
  console.log('Generated:', ogImagePath);

  await browser.close();
}

generateBrandImages().catch((err) => {
  console.error(err);
  process.exit(1);
});
