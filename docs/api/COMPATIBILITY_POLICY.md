# API Backward-Compatibility Policy (BE-21)

This policy defines the versioning, schema evolution, and deprecation standards for the MoneyTracker REST API.

---

## 1. Versioning Architecture

- All production endpoints are strictly namespaced under a major version path prefix:
  ```
  https://api.moneytracker.app/api/v1/...
  ```
- Any backwards-incompatible change requires introducing a new major version route (e.g. `/api/v2/`) running concurrently alongside the existing version.

---

## 2. Backward-Compatible (Additive) Changes

The following changes are considered backwards-compatible and may be introduced within `/api/v1` without a major version increment:

1. **Adding new endpoints:** Introducing new resource paths or HTTP verbs.
2. **Adding optional request fields:** Adding fields to request payloads that have sensible defaults when omitted.
3. **Adding response fields:** Adding new properties to JSON response payloads. Clients must treat response objects as open schemas and ignore unrecognized keys.
4. **Performance optimizations:** Improving internal execution time, query plans, or compression ratios without altering payload semantics.
5. **Relaxing validation constraints:** Widening acceptable ranges or accepting previously disallowed formats.

---

## 3. Breaking Changes

The following modifications are considered breaking changes and are **strictly forbidden** within an active major version:

1. Removing an existing endpoint or HTTP method.
2. Renaming or removing request or response properties.
3. Changing the data type of an existing field (e.g., converting an integer paise amount to a float or string).
4. Making an optional request field mandatory.
5. Altering the semantics or calculation logic of an existing metric (e.g., changing the calculation basis of `safeToSpendToday`).
6. Adding new error status codes without fallback handling.

---

## 4. Deprecation Schedule & Sunset Policy

When an API version or endpoint is scheduled for retirement:

1. **Advance Notice:** A minimum of **6 months** advance notice will be published in `CHANGELOG.md` and returned via the HTTP `Sunset` and `Deprecation` response headers (RFC 8594):
   ```http
   Deprecation: @1772323200
   Sunset: Wed, 01 Mar 2027 00:00:00 GMT
   Link: <https://moneytracker.app/api/docs/v2-migration>; rel="deprecation"
   ```
2. **Dual-Run Window:** The legacy version will remain operational alongside the new version throughout the deprecation period.
3. **Client Telemetry:** Maintainers will monitor request volume to deprecated endpoints before final decommissioning.
