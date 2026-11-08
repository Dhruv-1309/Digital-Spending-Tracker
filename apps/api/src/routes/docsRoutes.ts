import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const docsRouter = Router();

function resolveOpenApiPath(): string | null {
  const candidates = [
    path.resolve(process.cwd(), 'docs/openapi.yaml'),
    path.resolve(process.cwd(), '../../docs/openapi.yaml'),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../docs/openapi.yaml'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

let cachedSpec: string | null = null;

// Serves the raw OpenAPI 3.1 YAML definition
docsRouter.get(['/openapi.yaml', '/api/openapi.yaml'], (_req, res) => {
  const specPath = resolveOpenApiPath();
  if (!specPath) {
    res.status(404).type('text/plain').send('OpenAPI specification not found');
    return;
  }
  if (!cachedSpec) {
    cachedSpec = fs.readFileSync(specPath, 'utf8');
  }
  res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(cachedSpec);
});

// Serves the interactive API reference powered by Scalar UI
docsRouter.get(['/docs', '/api/docs'], (_req, res) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https://cdn.jsdelivr.net; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src 'self' https://cdn.jsdelivr.net data:; img-src 'self' data: https://cdn.jsdelivr.net; connect-src 'self' http: https:;",
  );
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MoneyTracker API Documentation</title>
    <meta name="description" content="MoneyTracker REST API specification: integer paise precision, statistical anomalies, and offline sync." />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23059669'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-1.5H9.5a1 1 0 01-1-1v-1a1 1 0 011-1h4a.5.5 0 00.5-.5v-1a.5.5 0 00-.5-.5H9a1 1 0 010-2h2V6h2v1.5h1.5a1 1 0 011 1v1a1 1 0 01-1 1h-4a.5.5 0 00-.5.5v1a.5.5 0 00.5.5h4.5a1 1 0 011 1v1a1 1 0 01-1 1H13v1.5z'/></svg>" />
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background-color: #0f172a;
        color: #f8fafc;
      }
      .fallback {
        max-width: 720px;
        margin: 4rem auto;
        padding: 2rem;
        background: #1e293b;
        border-radius: 12px;
        border: 1px solid #334155;
      }
      .fallback h1 { margin-top: 0; color: #38bdf8; }
      .fallback a { color: #38bdf8; text-decoration: underline; }
    </style>
  </head>
  <body>
    <div id="api-reference" data-url="/api/openapi.yaml"></div>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
    <noscript>
      <div class="fallback">
        <h1>MoneyTracker API Documentation</h1>
        <p>Interactive API reference requires JavaScript enabled.</p>
        <p>You can inspect the raw OpenAPI specification directly: <a href="/api/openapi.yaml">/api/openapi.yaml</a></p>
      </div>
    </noscript>
  </body>
</html>`;

  res.send(html);
});
