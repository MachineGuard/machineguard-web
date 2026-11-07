# Arquitectura

## Carpetas

```text
src/app/
  core/                  Configuración de la API, HttpClient e integración con IAM
  layout/                Layout principal, barra lateral y cabecera
  bounded-contexts/
    environmental-monitoring/   Zonas, puntos, nodos, mediciones y rangos seguros
    alert-incident-management/  Alertas, incidentes, atención y acciones correctivas
    traceability-quality/       Reserva documentada para ampliaciones
    iam/                        Sesión, perfil de usuario y contexto de organización
  dashboard/             Pantalla principal y su fachada (DashboardFacade)
  shared/                Iconos, insignias genéricas y componentes reutilizables
```

IAM posee el contexto de autenticación en `bounded-contexts/iam`. `core/auth`
conserva exports compatibles para los consumidores existentes.

Cada **bounded context** (contexto acotado) es un área del sistema con sus propios
conceptos y su acceso a datos. El dashboard no es un contexto: compone los de las demás áreas.

## Flujo

```text
componente -> DashboardFacade -> servicios de aplicación de cada contexto
           -> contratos de repositorio -> implementación mock o API
```

- Los componentes no hacen HTTP ni interpretan los DTO (los objetos que llegan de Core).
- La fachada calcula los conteos a partir de las zonas y arma el identificador
  de la alerta que se puede reconocer.
- Las interfaces de repositorio usan `InjectionToken`. Así `app.config.ts`
  elige la implementación: mock o API.
- `shared` no importa modelos de dominio. Cada contexto conserva sus conceptos y su acceso a datos.

La aplicación no usa SSR.

## Notas

- Las descripciones de la maqueta inicial de la interfaz aplican solo al modo mock.
  Las rutas actuales de zonas, alertas, incidentes y reportes ya tienen implementación.
- `traceability-quality` está reservado para ampliaciones. Ver su
  [README](../src/app/bounded-contexts/traceability-quality/README.md).
