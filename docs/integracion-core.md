# Integración con Core

El modo predeterminado usa Core real por HTTP. Para ver datos de demostración sin
Core, ver [modo mock](modo-mock.md).

## Dirección de la API

- La URL base está en `src/environments/environment.ts` (desarrollo, HTTP),
  `environment.production.ts` (producción, HTTP) y `environment.mock.ts` (demo).
- El valor predeterminado es `/api/v1`.
- Durante `ng serve`, `proxy.conf.json` envía `/api` a Core en `http://localhost:8080`.
  Así no hace falta cambiar CORS en el backend. Si Core usa otro puerto, cambia el proxy.
- En producción, configura un reverse proxy con el mismo origen, o cambia
  `apiBaseUrl` por la URL pública correcta y permite ese origen en el backend.

## Zonas ambientales por HTTP

El modo predeterminado usa `ApiMonitoringRepository` en lugar de
`MockMonitoringRepository`. Está conectado en `app.config.ts`, con el provider
`MONITORING_REPOSITORY`. **Si la API falla, no hay respaldo con datos ficticios.**

Flujo:

```text
EnvironmentalDashboardComponent
-> DashboardFacade
-> EnvironmentalMonitoringService
-> MonitoringRepository (contrato)
-> ApiMonitoringRepository
-> MonitoringApiClient / ApiClient
-> HttpClient + interceptor Bearer
-> GET /api/v1/environmental-monitoring/zones
```

Detalles:

- La API devuelve `MonitoringZoneDto[]`. El mapper
  `infrastructure/mappers/monitoring-zone.mapper.ts` la convierte en
  `MonitoringSnapshot`. `application/services/zone.mapper.ts` crea los
  `MonitoringZoneViewModel`. Los componentes no conocen los DTO.
- El estado ambiental y los conteos de nodos son los que envía Core.
- `HUMIDITY` se traduce al término interno `RELATIVE_HUMIDITY`.
- Los sensores `INACTIVE` no cuentan como offline. Las lecturas sin sensor
  (sensorless) siguen siendo válidas.
- Se muestra la última medición de cada variable, por fecha. No se inventan promedios.
- Si otro punto provoca una desviación, se conserva el estado de zona que envía Core.
- La respuesta de `/zones` trae lecturas actuales, no un historial de seis muestras.
  El gráfico conserva su estilo, pero muestra una sola lectura. No se inventan
  barras históricas ni la duración de una excursión.
- Core tiene también `/measurements/latest`, `/measurements/history` y
  `/zones/{id}` para futuras pantallas. El dashboard solo llama a `/zones`.

Estados y actualización:

- `EnvironmentalMonitoringService.state$` expone `loading`, `error`, `empty` y `loaded`.
  El dashboard y la barra lateral comparten la carga con `shareReplay`.
- Se reutilizan los estados visuales que ya existían: carga, error ante fallos
  HTTP, mensaje cuando no hay zonas y tarjetas cuando hay datos.
- Se actualiza sola cada 15 s (`SNAPSHOT_REFRESH_MS`). Si una actualización falla,
  se conserva la última lectura. Solo la primera carga muestra el error.
- Para reintentar o cambiar el token, recarga la página.

Estado `NO_DATA`: se muestra igual que `OFFLINE`, con valores nulos. No hay
un quinto badge ni cambios de diseño.

`lastSeenAt` usa `SensorResource.lastMeasurementAt`. El tiempo offline es el
tiempo desde esa última lectura. No es una duración de desconexión confirmada por el backend.

Pendiente del contrato real: la política para mediciones ausentes u obsoletas.

## Zonas, reportes y rutas

- `/zones` lista las zonas con el estado de su configuración. `/zones/:zoneId`
  permite definir el Safe Range por variable, agregar Monitoring Points y
  registrar Sensor Nodes. Los formularios solo aparecen para el rol `ADMIN`.
  `VIEWER` ve la misma información en modo de consulta.
- `/reports` lista las excursiones, con filtros por zona y estado.
  `/reports/excursions/:excursionId` muestra el detalle, con el historial de
  mediciones y las no conformidades.
- Otras rutas: `/dashboard`, `/alerts`, `/incidents`, `/incidents/:incidentId`,
  `/history`, `/reports/sealed`, `/reports/sealed/:reportId` y `/devices`.

## Inicio de sesión

- La ruta `/login` autentica con `POST /api/v1/auth/login` del IAM de Core.
- Las demás rutas están protegidas por `authGuard`. Sin sesión, redirigen a
  `/login`. Después de entrar, vuelven a la ruta que pediste.
- El encabezado muestra el usuario y la organización reales. Cerrar sesión llama a
  `POST /api/v1/auth/logout`.
- `SessionService` guarda la sesión en `sessionStorage` (`machineguard.session`).
  Sobrevive a una recarga y termina al cerrar la pestaña. La contraseña nunca se guarda.
- Si Core responde `401` por un access token vencido, `sessionRefreshInterceptor`
  renueva la sesión una sola vez con `POST /api/v1/auth/refresh` (el refresh token
  rota) y repite la petición. Si la renovación falla, cierra la sesión y vuelve a `/login`.
- `AccessTokenProvider` es el port de IAM. `ConfiguredAccessTokenProvider` entrega
  el JWT de la sesión.
- El interceptor agrega solo `Authorization: Bearer <JWT>`, y solo a la URL, el
  origen y el path configurados. No agrega `X-Organization-Id` ni `X-User-Id`.

## Alertas

Las alertas usan `ApiAlertRepository` en modo HTTP y `MockAlertRepository` en mock.
Para el flujo completo, ver [alertas e incidentes](alert-incident-workflow.md).
