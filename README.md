# MachineGuard Web

Es la pantalla de MachineGuard. Es una aplicación Angular donde inicias sesión y
ves las zonas monitoreadas: temperatura, humedad y si están dentro de rango. También
ves las alertas, los incidentes y los reportes de excursiones. Los datos llegan de
Core por HTTP.

Usa Angular 22, TypeScript y SCSS. No usa renderizado en servidor (SSR).

## Arrancar en local

Necesitas Node 22.22.3 (está en `.nvmrc`) y Core corriendo en `http://localhost:8080`.

```sh
npm ci
npm start
```

Abre http://localhost:4200/dashboard. La ruta `/` redirige a `/dashboard`.

Si no tienes Core a mano, puedes usar el modo demo con `npm run start:mock`.
Ver [modo mock](docs/modo-mock.md).

## Probar

```sh
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

Ambos comandos deben terminar sin errores. Las pruebas necesitan Chrome instalado.
Detalles, auditoría de dependencias y ayuda para Windows en
[pruebas](docs/pruebas.md).

## Cómo encaja

```text
ESP32 (Embedded)  ->  Edge (gateway local)  ->  Core (API central)  ->  Web (ESTE REPOSITORIO)
```

La Web solo habla con Core, por HTTP y con el token de la sesión. No habla con
Edge ni con los nodos.

## Estructura

```text
src/app/           Código de la aplicación (ver docs/arquitectura.md)
src/environments/  URL de la API según el modo: desarrollo, producción o mock
src/i18n/          Textos en español (es.json) e inglés (en.json)
public/            Fuentes locales y favicon
proxy.conf.json    En npm start, envía /api a Core en localhost:8080
docs/              Documentación detallada
```

## Más detalle

- [Arquitectura](docs/arquitectura.md): carpetas, áreas del sistema y flujo de datos.
- [Integración con Core](docs/integracion-core.md): HTTP, inicio de sesión, proxy y rutas.
- [Modo mock](docs/modo-mock.md): datos de demostración sin Core.
- [Interfaz](docs/interfaz.md): dashboard, idiomas y diseño visual.
- [Pruebas y validación](docs/pruebas.md): build, pruebas, auditoría y validación de la integración.
- [Flujo de alertas e incidentes](docs/alert-incident-workflow.md): consultas, permisos, atención y recuperación.
