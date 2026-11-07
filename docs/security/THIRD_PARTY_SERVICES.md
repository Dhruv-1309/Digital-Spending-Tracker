# Third-Party Service Disclosure & Network Manifest

**Document Version:** 1.0.0  
**Effective Date:** November 7, 2026  
**Applicability:** MoneyTracker Web Application (`apps/web`), REST API (`apps/api`), and Monorepo Infrastructure  

---

## 1. Privacy-First Commitment

MoneyTracker is architected as a privacy-preserving financial tracker with an offline-first foundation. The application enforces a strict zero-surveillance baseline:
- **Zero Third-Party Tracking Pixels:** No Meta Pixel, TikTok Pixel, LinkedIn Insights, or Twitter/X tags.
- **Zero Behavioral Analytics SDKs:** No Google Analytics (GA4), Segment, Mixpanel, Hotjar, or Amplitude.
- **Zero Third-Party Advertising SDKs:** No Google AdSense, prebid, or ad exchanges.
- **Zero External Font or Style CDNs:** All typography (Inter, Plus Jakarta Sans) and styles are bundled and served from the application origin (`/assets/fonts/`).

---

## 2. Web Client Network Requests (`apps/web`)

All outbound HTTP(S) and WebSocket connections initiated from the browser runtime are enumerated below. Any outbound network request not explicitly listed here is prohibited by the Content Security Policy (CSP).

| Destination Host / Origin | Service / Purpose | Data Transmitted | Trigger / Frequency |
| :--- | :--- | :--- | :--- |
| `origin` (`'self'`) | MoneyTracker API (`/api/v1/*`) | Encrypted user profile, transactions, autopay plans, categories, and sync queue payloads | User actions (CRUD), page loads, offline queue flush |
| `https://identitytoolkit.googleapis.com` | Firebase Authentication REST API | User email, hashed password credentials, password reset requests | Sign-in, sign-up, password reset, email verification |
| `https://securetoken.googleapis.com` | Firebase Auth Token Refresh | Short-lived Firebase refresh tokens | Hourly background refresh or on-demand session renewal |
| `https://accounts.google.com` | Google OAuth 2.0 Identity Provider | OAuth credential challenge, public profile claim | User initiates Google Sign-In via popup |
| `https://*.firebaseapp.com` | Firebase OAuth Authentication Handler | OAuth callback redirects and iframe communication | Google Sign-In redirect/popup exchange |

---

## 3. Backend API Network Requests (`apps/api`)

All outbound connections initiated by the Node.js/Express server runtime are documented below:

| Destination Host / Protocol | Service / Provider | Data Transmitted | Security Protocol |
| :--- | :--- | :--- | :--- |
| PostgreSQL Host (`5432` / TLS) | Neon / Managed PostgreSQL | Relational financial records (paise integers, user IDs, ISO timestamps) | TLS 1.3 encrypted connection with pooled sessions |
| `https://www.googleapis.com` | Google Identity X.509 Certificate Retrieval | None (fetches public keys to verify Firebase ID tokens) | HTTPS with response caching |
| `https://identitytoolkit.googleapis.com` | Firebase Admin SDK (User Management) | Firebase User ID (`uid`) | HTTPS via authenticated Google Service Account |

---

## 4. Subresource Integrity (SRI) & Static Asset Hosting Policy

### 4.1 Self-Hosted Assets
All JavaScript bundles, CSS stylesheets, SVG iconography (Lucide), and web fonts (`.woff2`) are compiled by Vite/Rolldown into content-addressed immutable static assets under `/assets/`.
- Content-addressed filenames (e.g. `index-[hash].js`, `vendor-react-[hash].js`) prevent cache tampering and provide deterministic cache validation.
- The build artifact is hosted directly on Vercel / Nginx edge servers under strict `Cache-Control: public, max-age=31536000, immutable`.

### 4.2 Prohibited Remote Assets
The production Content Security Policy explicitly forbids runtime script, style, and font loading from external CDNs:
```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: https://*.googleusercontent.com; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com; frame-src https://*.firebaseapp.com https://accounts.google.com;
```

---

## 5. Verification & Auditing Protocol

Compliance with this disclosure is verified via:
1. **Network Observer Audits:** Browser DevTools Network tab inspects 100% of outbound frames during cold boot, navigation, sync, and sign-out.
2. **CSP Violation Reporting:** Unrecognized external connections trigger immediate client-side CSP block events.
3. **Automated Dependabot Scans:** Transitive dependency introductions are scanned weekly against known vulnerability and telemetry trackers.
