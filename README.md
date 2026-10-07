# MachineGuard Web

Frontend Core sobre el proyecto existente Angular 18.2, standalone, TypeScript y SCSS. Environmental Dashboard con datos mock, sin SSR ni dependencias nuevas. No requiere Angular Material.

## Ejecutar

```sh
npm ci
npm start
```

Abrir http://localhost:4200/dashboard. `/` redirige a `/dashboard`.

```sh
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

Las pruebas requieren Chrome. Si no se detecta en Windows:

```powershell
$env:CHROME_BIN = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npm test -- --watch=false --browsers=ChromeHeadless
```

## Arquitectura

```text
src/app/
  core/                  Configuración API, HttpClient e integración futura IAM
  layout/                MainLayout, Sidebar y Header
  bounded-contexts/
    environmental-monitoring/
      domain/            MonitoringZone, MonitoringPoint, SensorNode,
                         Measurement, Threshold, SafeRange y Deviation
      application/       Servicio de lectura y MonitoringZoneViewModel
      infrastructure/    Mock/API repositories y cliente API inactivo
      presentation/      ZoneCard y metadatos visuales de estado
    alert-incident-management/
      domain/            Alert, Incident, Acknowledgement, Escalation,
                         CorrectiveAction y estados
      application/       AlertService
      infrastructure/    Mock/API repositories y cliente API inactivo
      presentation/      LatestAlerts
    traceability-quality/ Reserva documentada para ampliaciones
    iam/                 Modelos de perfil/contexto, WorkspaceService,
                         MockWorkspaceRepository y AuthContextService
  dashboard/             DashboardFacade, resumen y pantalla de composición
  shared/                Iconos, badges genéricos y placeholder reutilizable
```

Flujo: componente → DashboardFacade → servicios de aplicación de cada contexto → contratos de repositorio → implementación mock/API. El Dashboard no es un Bounded Context. Shared no importa modelos de dominio; cada contexto conserva sus conceptos y acceso a datos.

La facade calcula conteos a partir de las zonas y compone el identificador de la alerta reconocible. Los componentes no hacen HTTP ni interpretan DTOs. Las interfaces de repositorio usan `InjectionToken` para seleccionar implementaciones en `app.config.ts`.

## Comportamiento del dashboard

- Cold Room A: 11.2 °C / 58 %, Out of range, máximo 8 °C.
- Dry Store: 24.0 °C / 46 %, Normal, rango 15–28 °C.
- Zone C: 27.0 °C / 71 %, Near limit, máximo 28 °C.
- Loading Dock: Offline, sin mediciones actuales.
- Los cuatro conteos se derivan del estado de las zonas.
- `Acknowledge` actualiza el repositorio mock y la tabla de alertas durante la sesión. No modifica las mediciones ni resuelve la desviación ambiental. Rechaza reconocimientos duplicados. Recargar reinicia los mocks.
- `View details` e `Inspect` abren un diálogo con las condiciones actuales.
- `Add Monitored Point` abre `/zones?action=add-point`, un placeholder explícito; no implementa CRUD.
- `/zones`, `/alerts`, `/incidents`, `/reports` y `/devices` tienen placeholders y carga lazy, al igual que el dashboard.
- Facility y EN/ES son selectores de presentación; aún no filtran ni traducen. Los botones de notificaciones y usuario abren paneles de preview. El perfil Alex Morgan proviene de un repositorio mock de IAM, solo para presentación; no crea credenciales ni una identidad autenticada.
- Grid de cuatro columnas en desktop (desde 1101 px), dos en laptop/tablet y una en móvil. Sidebar plegable bajo 760 px. Latest Alerts usa filas responsive.

## Measurements y reglas provisionales

`Measurement` conserva `environmentalVariable`, `measuredValue`, zona, punto, organización y fecha. `zone.mapper.ts` selecciona la última medición por variable entre los puntos con nodos online, y crea el read model de temperatura y humedad. Excluye lecturas de puntos totalmente offline.

Los estados usan thresholds de ambas variables: fuera de cualquier rango → Out of range; dentro del 10 % de un extremo → Near limit; resto → Normal. Una zona sin nodos online es Offline. El mock usa límites de humedad 30–75 %. El margen del 10 %, los rangos y la selección del último punto son decisiones provisionales de la demo; deben alinearse con las reglas del Core. Si hay varias mediciones de la misma variable en distintos puntos, se muestra la más reciente, no un promedio.

La conectividad proviene de `SensorNode.status`, sin timers. Un nodo online sin lecturas muestra un guion; esta iteración no introduce un quinto estado de disponibilidad. La política de mediciones ausentes y obsoletas queda pendiente del contrato real.

## Sustituir los mocks por HTTP

1. Confirmar Swagger, DTOs, rutas, paginación, timestamps, reglas de estado y body de reconocimiento.
2. Implementar DTOs y mappers dentro de `infrastructure/api` de cada contexto. Los clientes actuales son scaffolds inactivos; sus tipos de transporte ilustrativos no afirman un contrato del backend.
3. Configurar `API_CONFIG` con la URL real. `MonitoringApiClient` no tiene endpoint predefinido: falla explícitamente si no se configura `monitoringSnapshotPath`. Si el backend ofrece endpoints separados, reemplazar la composición interna del cliente; no crear un endpoint snapshot artificial.
4. Adaptar `ApiMonitoringRepository` y `ApiAlertRepository` a los contratos existentes. Agregar refresco/invalidación al repositorio de alertas tras reconocer para actualizar la lista HTTP. Los componentes y la facade permanecen independientes del transporte.
5. Cambiar ambos providers en `app.config.ts`, una vez terminados los adaptadores:

```ts
{ provide: MONITORING_REPOSITORY, useClass: ApiMonitoringRepository },
{ provide: ALERT_REPOSITORY, useClass: ApiAlertRepository },
```

Las rutas propuestas de alertas están centralizadas en `alerts-api.client.ts`: `alerts` y `alerts/{id}/acknowledgements`, bajo el base URL. No se hacen llamadas al backend en modo mock. Todavía no hay operaciones HTTP de incidentes ni reportes.

`AuthContextService` empieza con contexto `null`. El futuro IAM suministrará JWT, organización y usuario. El interceptor adjunta `Authorization`, `X-Organization-Id` y `X-User-Id` solo a la API configurada y solo si existen valores. No se guardan tokens ni se inventa una sesión autenticada. El backend debe validar identidad y pertenencia a la organización.

## Validación

- Build de producción con budgets originales, sin errores ni advertencias.
- 11 pruebas en Chrome Headless: variables, última lectura, puntos offline, excursión de humedad, composición y conteos, reconocimiento sin resolver la desviación, rechazo duplicado y alcance de headers IAM.
- Smoke test en Chrome: redirección, seis rutas, Add Monitored Point, diálogo, menú móvil y reconocimiento.
- Layout verificado en 1440, 1024, 768 y 390 px, sin overflow horizontal de la página; cero errores de ejecución y cero solicitudes `/api/v1`.

Se sustituyó el template de bienvenida Angular por el router outlet y se adaptó su test. No se recreó el proyecto ni se modificaron las dependencias. No se implementaron backend, autenticación, CRUD, reportes, WebSockets ni deployment.

## Design system aplicado

Referencia visual: mockup Environmental Dashboard y láminas del design system adjuntos. Paleta exacta de marca: primary `#0F4C5C`, primary container `#D6EEF2`, OK `#2A9D8F`, warning `#E9A23B`, error `#D62839`, offline `#8A97A5`, text `#0B1F2A`, secondary text `#52667A`, background `#F8FBFA`, surface `#FFFFFF`.

Tokens en `src/styles.scss`; colores de estado en `_status.scss`; barras de lecturas en `_trend.scss`. Espaciado principal en múltiplos de 8 px, cards de 12 px, botones pill, sombras suaves y foco visible. Los colores de warning/offline siempre se acompañan de texto e iconos. Las fuentes Inter y JetBrains Mono son locales en `public/fonts`, con licencias OFL, sin solicitudes externas en runtime.

Las barras representan las últimas seis mediciones de temperatura, ordenadas por fecha, con alturas relativas al safe range y colores derivados de thresholds. El sistema calcula 7 de 8 nodos activos. El contador Updated refleja la antigüedad real de la última lectura mock y avanza con un timer de presentación; no simula nuevas mediciones ni realiza polling HTTP.

IAM ahora posee el contexto de autenticación en `bounded-contexts/iam`; `core/auth` conserva exports compatibles para los consumidores existentes. No se conectó autenticación real. Las alertas reconocidas conservan la desviación y el evento Normal se muestra como recuperación. Los detalles offline exponen la última conexión.
## Inventario de archivos

### Modificados

- `README.md`
- `src/app/app.component.html`
- `src/app/app.component.scss`
- `src/app/app.component.spec.ts`
- `src/app/app.component.ts`
- `src/app/app.config.ts`
- `src/app/app.routes.ts`
- `src/index.html`
- `src/styles.scss`

### Creados

- `public/favicon.svg`
- `public/fonts/inter-400.ttf`
- `public/fonts/inter-500.ttf`
- `public/fonts/inter-600.ttf`
- `public/fonts/inter-700.ttf`
- `public/fonts/inter-LICENSE.txt`
- `public/fonts/jetbrains-mono-400.ttf`
- `public/fonts/jetbrains-mono-500.ttf`
- `public/fonts/jetbrains-mono-600.ttf`
- `public/fonts/jetbrainsmono-LICENSE.txt`
- `src/app/bounded-contexts/alert-incident-management/application/services/alert.service.ts`
- `src/app/bounded-contexts/alert-incident-management/domain/models/alert.models.ts`
- `src/app/bounded-contexts/alert-incident-management/domain/repositories/alert.repository.ts`
- `src/app/bounded-contexts/alert-incident-management/infrastructure/api/alerts-api.client.ts`
- `src/app/bounded-contexts/alert-incident-management/infrastructure/repositories/api-alert.repository.ts`
- `src/app/bounded-contexts/alert-incident-management/infrastructure/repositories/mock-alert.repository.ts`
- `src/app/bounded-contexts/alert-incident-management/presentation/components/latest-alerts/latest-alerts.component.html`
- `src/app/bounded-contexts/alert-incident-management/presentation/components/latest-alerts/latest-alerts.component.scss`
- `src/app/bounded-contexts/alert-incident-management/presentation/components/latest-alerts/latest-alerts.component.ts`
- `src/app/bounded-contexts/environmental-monitoring/application/models/monitoring-zone.view-model.ts`
- `src/app/bounded-contexts/environmental-monitoring/application/services/environmental-monitoring.service.ts`
- `src/app/bounded-contexts/environmental-monitoring/application/services/zone.mapper.spec.ts`
- `src/app/bounded-contexts/environmental-monitoring/application/services/zone.mapper.ts`
- `src/app/bounded-contexts/environmental-monitoring/domain/models/monitoring.models.ts`
- `src/app/bounded-contexts/environmental-monitoring/domain/repositories/monitoring.repository.ts`
- `src/app/bounded-contexts/environmental-monitoring/infrastructure/api/monitoring-api.client.ts`
- `src/app/bounded-contexts/environmental-monitoring/infrastructure/repositories/api-monitoring.repository.ts`
- `src/app/bounded-contexts/environmental-monitoring/infrastructure/repositories/mock-monitoring.repository.ts`
- `src/app/bounded-contexts/environmental-monitoring/presentation/components/zone-card/zone-card.component.html`
- `src/app/bounded-contexts/environmental-monitoring/presentation/components/zone-card/zone-card.component.scss`
- `src/app/bounded-contexts/environmental-monitoring/presentation/components/zone-card/zone-card.component.ts`
- `src/app/bounded-contexts/environmental-monitoring/presentation/models/zone-status.presentation.ts`
- `src/app/bounded-contexts/iam/application/services/auth-context.service.ts`
- `src/app/bounded-contexts/iam/application/services/workspace.service.ts`
- `src/app/bounded-contexts/iam/domain/models/workspace-profile.ts`
- `src/app/bounded-contexts/iam/domain/repositories/workspace.repository.ts`
- `src/app/bounded-contexts/iam/infrastructure/repositories/mock-workspace.repository.ts`
- `src/app/bounded-contexts/traceability-quality/README.md`
- `src/app/core/auth/auth-context.service.ts`
- `src/app/core/config/api.config.ts`
- `src/app/core/http/api-client.ts`
- `src/app/core/interceptors/api-context.interceptor.spec.ts`
- `src/app/core/interceptors/api-context.interceptor.ts`
- `src/app/dashboard/components/status-summary/status-summary.component.html`
- `src/app/dashboard/components/status-summary/status-summary.component.scss`
- `src/app/dashboard/components/status-summary/status-summary.component.ts`
- `src/app/dashboard/models/dashboard.view-model.ts`
- `src/app/dashboard/pages/environmental-dashboard/environmental-dashboard.component.html`
- `src/app/dashboard/pages/environmental-dashboard/environmental-dashboard.component.scss`
- `src/app/dashboard/pages/environmental-dashboard/environmental-dashboard.component.ts`
- `src/app/dashboard/services/dashboard.facade.spec.ts`
- `src/app/dashboard/services/dashboard.facade.ts`
- `src/app/layout/header/header.component.html`
- `src/app/layout/header/header.component.scss`
- `src/app/layout/header/header.component.ts`
- `src/app/layout/main-layout/main-layout.component.html`
- `src/app/layout/main-layout/main-layout.component.scss`
- `src/app/layout/main-layout/main-layout.component.ts`
- `src/app/layout/sidebar/sidebar.component.html`
- `src/app/layout/sidebar/sidebar.component.scss`
- `src/app/layout/sidebar/sidebar.component.ts`
- `src/app/shared/components/feature-placeholder/feature-placeholder.component.html`
- `src/app/shared/components/feature-placeholder/feature-placeholder.component.scss`
- `src/app/shared/components/feature-placeholder/feature-placeholder.component.ts`
- `src/app/shared/components/icon/icon.component.ts`
- `src/app/shared/components/status-badge/status-badge.component.ts`
- `src/styles/_fonts.scss`
- `src/styles/_status.scss`
- `src/styles/_trend.scss`
