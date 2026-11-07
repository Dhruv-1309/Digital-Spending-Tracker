## Summary of Changes

<!-- Briefly describe the problem solved or feature added by this pull request -->

## Type of Change

- [ ] `feat`: New feature or user capability
- [ ] `fix`: Bug fix
- [ ] `refactor`: Internal code reorganization without changing external behavior
- [ ] `perf`: Performance improvement
- [ ] `test`: Adding or updating test suites
- [ ] `docs`: Documentation updates or additions
- [ ] `ops`: CI/CD, Docker, or build configuration

## Applicable Backlog / Issue References

- Closes #
- Backlog Item: `[ID]`

## Pre-Merge Quality Verification Checklist

- [ ] **Linting:** `npm run lint` passes with 0 errors.
- [ ] **Typecheck:** `npx tsc -b apps/web apps/api packages/shared` passes with 0 errors.
- [ ] **Tests:** `npm test` passes with zero regressions.
- [ ] **Build:** `npm run build` generates production artifacts without unhandled warnings.
- [ ] **Integer Paise:** All financial amounts are handled in integer paise without floating-point math.
- [ ] **Privacy First:** Zero tracking scripts, credential scrapers, or third-party cookies introduced.
- [ ] **Accessibility:** Interactive controls have focus states, ARIA attributes, and satisfy contrast requirements.
