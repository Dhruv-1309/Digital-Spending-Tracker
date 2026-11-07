# 2. Integer Paise Financial Representation and Elimination of IEEE-754 Floating-Point Drift

**Status:** Accepted  
**Date:** November 2026  
**Deciders:** Core Engineering Team  
**Consulted:** PRD v3.0 Specification, Currency & Paise Calculations  

---

## Context and Problem Statement

JavaScript numbers are 64-bit binary floating-point values conforming to the IEEE-754 standard. In financial applications, representing fractional currencies using native floats produces cumulative binary rounding drift:

```javascript
0.10 + 0.20 === 0.30000000000000004 // true in JavaScript
19.99 * 100 === 1998.9999999999998   // true in JavaScript
```

In personal finance, this causes subtle, unacceptable bugs:
1. Budget limits fail to match sum of category transactions (e.g. ₹9,999.99999999 vs ₹10,000.00).
2. Exporting and re-importing CSV/JSON backups alters totals over time.
3. Database queries using exact float comparisons miss boundary records.

---

## Decision Drivers

- **Zero Tolerance for Financial Inaccuracy:** Every arithmetic operation (sum, subtraction, budget delta, safe-to-spend today) must be mathematically exact to the subunit.
- **Indian Financial Localization:** The Indian Rupee (INR) is divided into 100 Paise.
- **Cross-Layer Parity:** Database, backend API, shared libraries, and frontend state must speak the exact same data format without conversion ambiguity.

---

## Considered Options

1. **Floating-Point Rupee Floats with `toFixed(2)` Post-Processing:** Fragile; requires continuous string parsing, susceptible to intermediate precision loss during multi-step statistical aggregations (SMA, variance).
2. **Arbitrary-Precision Decimal Libraries (e.g. `bignumber.js`, `decimal.js`):** High precision, but adds bundle weight (30-50 kB), incurs performance serialization penalties, and complicates JSON schemas.
3. **Integer Subunits (Paise) as `BigInt` / `number` (Chosen):** Represent all monetary values as integer subunits (1 Rupee = 100 Paise).

---

## Decision Outcome

Chosen option: **Integer Paise Representation**.

### Architectural Details

- **Database Storage:** Prisma schema stores monetary values as `BigInt` (`@db.BigInt` mapped to SQL `BIGINT` `amount_paise`). This handles transactions up to ₹90,000,000,000,000,000 without overflow.
- **Backend API Contract:** Serializes `BigInt` to JSON numeric values. Express application configures `BigInt.prototype.toJSON = function () { return Number(this); }`.
- **Shared Mathematical Functions (`@moneytracker/shared`):**
  - `rupeesToPaise(rupees: number): number` — `Math.round(rupees * 100)`
  - `paiseToRupees(paise: number | bigint): number` — `Number(paise) / 100`
  - `formatPaise(paise: number | bigint): string` — formats into Indian comma groupings (`₹1,23,456.50`).
- **Validation Caps (`CORE-3`):**
  - Validation schema enforces a maximum amount cap of ₹10,00,00,000 (10 Crore = 1,000,000,000 paise).
  - Maximum of 2 decimal places allowed during input.
  - Scientific exponent notation (e.g. `1e6`) is strictly rejected.

---

## Consequences

### Positive
- **100% Deterministic Arithmetic:** Summing 10,000 transactions produces the exact integer sum with zero binary float drift.
- **Bidirectional Idempotency:** Validated by 50,000 property-based fuzz tests (`QA-12` via `fast-check`), verifying `rupeesToPaise` and `paiseToRupees` round-trip without loss.
- **Performance:** Native integer addition executes in under 1 microsecond.

### Negative
- **Presentation Formatting Required:** Any UI display must explicitly pass amounts through `formatPaise` or `paiseToRupees`.
