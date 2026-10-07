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

## Comportamiento del dashboard en modo mock

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

## Measurements y reglas del modo mock

`Measurement` conserva `environmentalVariable`, `measuredValue`, zona, punto, organización y fecha. `zone.mapper.ts` selecciona la última medición por variable entre los puntos con nodos online, y crea el read model de temperatura y humedad. Excluye lecturas de puntos totalmente offline.

Los estados usan thresholds de ambas variables: fuera de cualquier rango → Out of range; dentro del 10 % de un extremo → Near limit; resto → Normal. Una zona sin nodos online es Offline. El mock usa límites de humedad 30–75 %. El margen del 10 %, los rangos y la selección del último punto son decisiones provisionales de la demo; deben alinearse con las reglas del Core. Si hay varias mediciones de la misma variable en distintos puntos, se muestra la más reciente, no un promedio.

La conectividad proviene de `SensorNode.status`, sin timers. Un nodo online sin lecturas muestra un guion; esta iteración no introduce un quinto estado de disponibilidad. La política de mediciones ausentes y obsoletas queda pendiente del contrato real.

## Integración HTTP con Environmental Monitoring

El modo predeterminado usa el Core real: `ApiMonitoringRepository` reemplaza `MockMonitoringRepository` mediante el provider `MONITORING_REPOSITORY` en `app.config.ts`. No hay fallback automático a datos ficticios si falla la API.

```text
EnvironmentalDashboardComponent
→ DashboardFacade
→ EnvironmentalMonitoringService
→ MonitoringRepository (contrato)
→ ApiMonitoringRepository
→ MonitoringApiClient / ApiClient
→ HttpClient + interceptor Bearer
→ GET /api/v1/environmental-monitoring/zones
```

La API devuelve `MonitoringZoneDto[]`. El mapper `infrastructure/mappers/monitoring-zone.mapper.ts` convierte el contrato REST a `MonitoringSnapshot`; `application/services/zone.mapper.ts` proyecta los `MonitoringZoneViewModel` existentes. Los componentes no conocen los DTOs ni hacen HTTP.

El estado ambiental y los conteos de nodos son los enviados por Core. HUMIDITY se traduce al vocabulario interno RELATIVE_HUMIDITY; sensores INACTIVE no se cuentan como offline. Las lecturas sensorless siguen siendo válidas. Se muestra la última medición de cada variable por fecha, sin inventar promedios. Si otro punto provoca una desviación, se conserva el estado de zona de Core.

La respuesta de `/zones` trae lecturas actuales, no un historial de seis muestras: el gráfico conserva su estilo y representa una lectura actual. No se inventan barras históricas ni duración de excursión. Los endpoints `/measurements/latest`, `/measurements/history` y `/zones/{id}` quedan disponibles en Core para futuras pantallas; el dashboard requiere solamente una llamada a `/zones`.

La UI original tiene cuatro estados. NO_DATA reutiliza la representación OFFLINE, con valores nulos; no se agrega un quinto badge ni se cambia el diseño. `lastSeenAt` usa `SensorResource.lastMeasurementAt`; el tiempo offline mostrado es el tiempo desde esa última lectura, no una duración de desconexión confirmada por el backend.

`EnvironmentalMonitoringService.state$` expone loading/error/empty/loaded. Dashboard y sidebar comparten la carga mediante shareReplay. Se reutilizan los estados visuales existentes: carga mientras espera, error para fallos HTTP, mensaje vacío cuando no hay zonas y tarjetas cuando hay datos. Para reintentar o cambiar token, recargar la página.

### Configuración y ejecución local

```powershell
npm install
npm start
```

La URL está en `src/environments/environment.ts` (desarrollo HTTP), `environment.production.ts` (producción HTTP) y `environment.mock.ts` (demo). El valor predeterminado es `/api/v1`. `proxy.conf.json` dirige `/api` al Core en `http://localhost:8080` durante `ng serve`, evitando requerir cambios CORS en el backend. Si el Core usa otro puerto, ajustar el proxy. En producción configurar el reverse proxy para el mismo origen o cambiar `apiBaseUrl` a la URL pública correcta y permitir ese origen en el backend.

### Inicio de sesión

La ruta `/login` autentica contra `POST /api/v1/auth/login` del IAM del Core. Todas las demás rutas están protegidas por `authGuard`: sin sesión redirigen a `/login` y, tras ingresar, vuelven a la ruta solicitada. El encabezado muestra el usuario y la organización reales y permite cerrar sesión (`POST /api/v1/auth/logout`).

`SessionService` (IAM) mantiene la sesión y la guarda en `sessionStorage` (`machineguard.session`), por lo que sobrevive a una recarga y termina al cerrar la pestaña. La contraseña nunca se almacena. Cuando el Core responde `401` por un access token vencido, `sessionRefreshInterceptor` renueva la sesión una sola vez con `POST /api/v1/auth/refresh` (el refresh token rota) y repite la solicitud; si la renovación falla, cierra la sesión y vuelve a `/login`.

`AccessTokenProvider` es el port de IAM y `ConfiguredAccessTokenProvider` entrega el JWT de la sesión. El interceptor adjunta únicamente `Authorization: Bearer <JWT>` y solo a la URL/origen/path configurados. No añade `X-Organization-Id` ni `X-User-Id`.

El modo mock (`npm run start:mock`) no usa Core ni sesión: los guards lo dejan pasar y el perfil es el fixture de presentación.

### Zonas y Reportes

- `/zones` lista las Monitoring Zones con el estado de su configuración; `/zones/:zoneId` permite definir el Safe Range por variable, agregar Monitoring Points y registrar Sensor Nodes. Los formularios solo se muestran al rol `ADMIN`; `VIEWER` ve la misma información en modo consulta.
- `/reports` lista las excursiones (filtros por zona y estado) y `/reports/excursions/:excursionId` muestra el detalle con el Measurement History y las no conformidades.
- El dashboard y el estado del sistema se actualizan solos cada 15 s. Si una actualización falla se conserva la última lectura; solo la primera carga muestra el estado de error.

### Modo mock

```powershell
npm run start:mock
```

Usa `MockMonitoringRepository` y no realiza solicitudes de monitorización al Core. Las alertas y el perfil del layout siguen siendo mocks: no representan incidentes ni una identidad autenticada reales. La facade muestra únicamente alertas cuyos IDs de zona correspondan a las zonas cargadas; así no mezcla las alertas demo con las zonas UUID de Core. No se implementó una API de Alert & Incident Management.

## Validación de la integración

- `npm run build` ejecuta `ng build` de producción con los budgets originales.
- 20 pruebas en Chrome Headless: contrato REST, mappers, HUMIDITY, sensores INACTIVE/sin sensor, lecturas offline, NO_DATA, una sola solicitud compartida, loading/error/empty/loaded, Bearer sin headers de identidad, alcance de credenciales y token temporal deshabilitado en producción; además de las pruebas existentes de mocks/composición.
- Templates, SCSS, fuentes y componentes visuales permanecen intactos. No se modificaron dependencias ni backend.
- La respuesta HTTP se verificó con HttpTestingController usando el DTO real de Core. El uso contra una instancia real requiere iniciar el Core y configurar un JWT válido.

## Archivos de esta integración HTTP

### Modificados

- `README.md`
- `angular.json`
- `package.json`
- `src/app/app.config.ts`
- `src/app/bounded-contexts/environmental-monitoring/application/services/environmental-monitoring.service.ts`
- `src/app/bounded-contexts/environmental-monitoring/application/services/zone.mapper.ts`
- `src/app/bounded-contexts/environmental-monitoring/domain/models/monitoring.models.ts`
- `src/app/bounded-contexts/environmental-monitoring/infrastructure/api/monitoring-api.client.ts`
- `src/app/bounded-contexts/environmental-monitoring/infrastructure/repositories/api-monitoring.repository.ts`
- `src/app/core/config/api.config.ts`
- `src/app/core/interceptors/api-context.interceptor.spec.ts`
- `src/app/core/interceptors/api-context.interceptor.ts`
- `src/app/dashboard/services/dashboard.facade.ts`

### Creados

- `proxy.conf.json`
- `src/app/bounded-contexts/environmental-monitoring/application/models/monitoring-load-state.ts`
- `src/app/bounded-contexts/environmental-monitoring/infrastructure/api/monitoring-zone.dto.ts`
- `src/app/bounded-contexts/environmental-monitoring/infrastructure/api/monitoring-zone.fixture.ts`
- `src/app/bounded-contexts/environmental-monitoring/infrastructure/mappers/monitoring-zone.mapper.spec.ts`
- `src/app/bounded-contexts/environmental-monitoring/infrastructure/mappers/monitoring-zone.mapper.ts`
- `src/app/bounded-contexts/environmental-monitoring/infrastructure/repositories/api-monitoring.repository.spec.ts`
- `src/app/bounded-contexts/iam/application/ports/access-token.provider.ts`
- `src/app/bounded-contexts/iam/infrastructure/auth/configured-access-token.provider.ts`
- `src/app/bounded-contexts/iam/infrastructure/auth/development-token.store.spec.ts`
- `src/app/bounded-contexts/iam/infrastructure/auth/development-token.store.ts`
- `src/environments/environment.mock.ts`
- `src/environments/environment.production.ts`
- `src/environments/environment.ts`

## Design system aplicado

Referencia visual: mockup Environmental Dashboard y láminas del design system adjuntos. Paleta exacta de marca: primary `#0F4C5C`, primary container `#D6EEF2`, OK `#2A9D8F`, warning `#E9A23B`, error `#D62839`, offline `#8A97A5`, text `#0B1F2A`, secondary text `#52667A`, background `#F8FBFA`, surface `#FFFFFF`.

Tokens en `src/styles.scss`; colores de estado en `_status.scss`; barras de lecturas en `_trend.scss`. Espaciado principal en múltiplos de 8 px, cards de 12 px, botones pill, sombras suaves y foco visible. Los colores de warning/offline siempre se acompañan de texto e iconos. Las fuentes Inter y JetBrains Mono son locales en `public/fonts`, con licencias OFL, sin solicitudes externas en runtime.

Las barras representan las últimas seis mediciones de temperatura, ordenadas por fecha, con alturas relativas al safe range y colores derivados de thresholds. El sistema calcula 7 de 8 nodos activos. El contador Updated refleja la antigüedad real de la última lectura y avanza con un timer de presentación; no simula nuevas mediciones ni realiza polling HTTP.

IAM ahora posee el contexto de autenticación en `bounded-contexts/iam`; `core/auth` conserva exports compatibles para los consumidores existentes. El interceptor usa tokens reales proporcionados externamente; el login frontend sigue pendiente. Las alertas reconocidas conservan la desviación y el evento Normal se muestra como recuperación. Los detalles offline exponen la última conexión.
## Inventario de la implementación visual original

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
