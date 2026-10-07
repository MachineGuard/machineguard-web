# Traceability & Quality

Excursions and their evidence, read from the Core API (`/api/v1/traceability`).

- `infrastructure/api/excursions-api.client.ts`: excursions, excursion detail, Measurement History and Non-Conformity registration.
- `presentation/pages/excursions-list`: `/reports`, filterable by zone and status, with a banner per ongoing excursion.
- `presentation/pages/excursion-detail`: `/reports/excursions/:excursionId`, with peak, breached limit, duration, readings and Non-Conformities.

Traceability Reports (generation, list and download) are not implemented in the web application yet.
