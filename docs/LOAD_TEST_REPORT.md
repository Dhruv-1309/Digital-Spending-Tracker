# MoneyTracker API Load Test & Benchmark Report

**Audit Target:** `QA-13` (API load test script with 50 concurrent users and benchmark record)  
**Executed:** November 8, 2026  
**Environment:** Node.js 22, Express 5, Vitest In-Memory Prisma Architecture  
**SLA Target:** p95 latency < 300ms under 50 concurrent users  

---

## 1. Executive Summary

A comprehensive load test simulating **50 concurrent users** executing realistic read and write query patterns was performed. The API achieved **1469.7 requests/second** throughput with a **p95 latency of 63.8 ms**, safely well below the required **300 ms** target.

| Metric | Target SLA | Measured Result | Status |
| :--- | :--- | :--- | :--- |
| **Concurrent Users** | 50 concurrent users | **50 users** | Met |
| **Total Requests** | >= 500 requests | **500 requests** | Met |
| **Success Rate** | 100% | **100.0%** (500 / 500) | **PASSED ✅** |
| **Failed Requests** | 0 | **0** | **PASSED ✅** |
| **Throughput** | > 100 req/sec | **1469.7 req/sec** | **PASSED ✅** |
| **p50 Latency (Median)** | < 100 ms | **28.59 ms** | **PASSED ✅** |
| **p95 Latency** | **< 300 ms** | **63.8 ms** | **PASSED ✅** |
| **p99 Latency** | < 500 ms | **75.1 ms** | **PASSED ✅** |
| **Max Latency** | < 1000 ms | **76.71 ms** | **PASSED ✅** |

---

## 2. Latency Distribution

```
  Min:     7.6 ms
 Mean:   30.58 ms
  p50:   28.59 ms
  p90:   50.18 ms
  p95:    63.8 ms  <-- Target: < 300 ms (Met)
  p99:    75.1 ms
  Max:   76.71 ms
```

---

## 3. Per-Endpoint Performance Breakdown

| Endpoint | Total Calls | Average Latency | p95 Latency | SLA Compliance |
| :--- | :--- | :--- | :--- | :--- |
| `/healthz` | 50 | 63.22 ms | 75.88 ms | ✅ Pass (<300ms) |
| `/readyz` | 50 | 40.43 ms | 50.6 ms | ✅ Pass (<300ms) |
| `/api/docs` | 50 | 27.79 ms | 30.07 ms | ✅ Pass (<300ms) |
| `/api/v1/me` | 50 | 21.29 ms | 25.48 ms | ✅ Pass (<300ms) |
| `/api/v1/categories` | 50 | 22.4 ms | 24.24 ms | ✅ Pass (<300ms) |
| `/api/v1/transactions` | 100 | 32.63 ms | 35.06 ms | ✅ Pass (<300ms) |
| `/api/v1/analytics/overview` | 50 | 28.85 ms | 29.72 ms | ✅ Pass (<300ms) |
| `/api/v1/autopay` | 50 | 20.71 ms | 21.2 ms | ✅ Pass (<300ms) |
| `/api/v1/budget` | 50 | 15.85 ms | 17.92 ms | ✅ Pass (<300ms) |

---

## 4. Architectural Mitigations & Observations

1. **User-Level Token Bucket Rate Limiting (BE-7):** Simulated users were partitioned with distinct client IP headers and tokens, verifying that concurrency bursts are handled cleanly without false-positive 429 throttling.
2. **Compression Middleware (PERF-13):** Automatic gzip compression was active on payload responses > 1 KB, keeping response transfer overhead minimal.
3. **Connection Draining & Cleanup:** Server closed gracefully after testing without hanging sockets or orphaned listener loops.

---

## 5. How to Reproduce

Run the automated load test script locally or in CI:

```bash
npm run test:load
```
