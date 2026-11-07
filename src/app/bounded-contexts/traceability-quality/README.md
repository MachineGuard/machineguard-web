# Traceability & Quality

Excursions and their evidence, read from the Core API (`/api/v1/traceability`).

- `infrastructure/api/excursions-api.client.ts`: excursions, excursion detail, Measurement History and Non-Conformity registration.
- `presentation/pages/excursions-list`: `/reports`, filterable by zone and status, with a banner per ongoing excursion.
- `presentation/pages/excursion-detail`: `/reports/excursions/:excursionId`, with peak, breached limit, duration, readings and Non-Conformities.

## Historial y reportes sellados

`/history` consulta mediciones normales y con desviación por zona, período y variable opcional. Las fechas del formulario son locales y se envían como instantes UTC; la tabla conserva los instantes UTC recibidos. No hay paginación ni filtro remoto por punto. Core valida el período máximo.

`/reports/sealed` lista reportes guardados, con filtro de zona. ADMIN puede confirmar una generación para una zona y período. Cada envío explícito realiza un único POST; si la respuesta se pierde, se conserva el formulario y se invita a consultar la lista antes de volver a confirmar. VIEWER consulta y descarga, sin generar.

`/reports/sealed/:reportId` lee contenido, conteos, sello/checksum y verificación de integridad de Core. La descarga JSON pasa por HttpClient/IAM, guarda el archivo recibido y libera su URL temporal. El checksum del dominio no es el hash del archivo descargado. La interfaz no modifica ni reconstruye un reporte almacenado.

La lista anterior `/reports` y el detalle `/reports/excursions/:excursionId` se conservan, con enlaces explícitos hacia los flujos nuevos. En modo mock, los flujos nuevos explican que requieren conexión autenticada a Core; no producen evidencia oficial de ejemplo.
