# Alert and incident workflow

The HTTP configuration uses the real Core API. Run `npm ci && npm start` with
Core on port 8080, or pass `--proxy-config <file>` to `npm start --` for a different
local backend. Production uses the same-origin `/api/v1` reverse proxy. GitHub
Pages alone does not provide Core or a database.

## Access and pages

- Sign in with an existing IAM account. The Bearer interceptor supplies identity;
  pages never submit an organization or author identifier.
- `/alerts`: filter alerts by zone/status and open the related incident.
- `/incidents`: filter incidents by zone, status and opening period. Times entered
  in local date controls are converted to UTC. Core returns up to 500 recent
  matches; narrow the period for older history.
- `/incidents/:incidentId`: read the alert, acknowledgement, actions and resolution.
  ADMIN can acknowledge, record a corrective action and confirm resolution.
  VIEWER can only read. Core independently enforces these permissions and tenant
  boundaries; hiding controls does not replace authorization.
- Dashboard alerts use the same repositories and link to the incident workspace.

Lists/details refresh every 15 seconds and after confirmed commands. Loading,
empty, connection error, not-found and stale-state conflict have explicit states.
A failed save retains entered text; an in-flight command blocks duplicate clicks.
If a command's confirmation is lost, refresh the detail before retrying: human
attention commands are not automatically replayed.

## Closure and recovery

A safe measurement does not close the incident automatically. Detail exposes
`withinSafeRange` and caller-specific `resolutionAllowed`. The page explains
whether corrective evidence or environmental recovery is missing. Core rechecks
the latest conditions when resolution is submitted and can reject it with 409.
The original alert and corrective history remain available after resolution.

The transport mapper preserves Core LOW/MEDIUM/HIGH/CRITICAL severity levels
while mapping their visual tones to the existing INFO/WARNING/CRITICAL palette.
Zone names come from Monitoring. Server-provided alert messages and user-entered
evidence are displayed verbatim; interface controls support Spanish and English.

`npm run start:mock` explicitly labels demo mode. It does not fabricate real
incidents or silently fall back to sample records after an HTTP failure.

## Verification

```sh
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

On 2026-10-30 the production build and 52 tests passed. An isolated local Core
with PostgreSQL 17.5 and the real Python Edge HTTP client was also exercised in
the browser: out-of-range reading → acknowledge → corrective action → safe new
reading → manual resolution. The resulting closed alert and linked traceability
excursion were confirmed through Core. Desktop (1440px) and mobile (390px), both
languages and VIEWER read-only access were checked. This is local integration
evidence, not a production deployment or a physical sensor test.
