# Pruebas y validación

## Comandos

```sh
npm ci
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
npm audit --omit=dev --audit-level=low
```

- `npm run build` ejecuta `ng build` de producción con los límites de tamaño originales.
- `npm test` ejecuta las pruebas en Chrome Headless. Necesitas Chrome instalado.
- `npm audit` revisa las dependencias de producción.

En Windows, si las pruebas no detectan Chrome, define la ruta antes de ejecutarlas:

```powershell
$env:CHROME_BIN = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npm test -- --watch=false --browsers=ChromeHeadless
```

## Integración continua

El workflow `verify.yml` hace `npm ci`, `npm run build`, las pruebas y la
auditoría de dependencias de producción. Corre en cada push a `develop` y a
`feature/**`, y en cada pull request a `develop` o `main`.

El despliegue a GitHub Pages (`deploy-pages.yml`) solo se ejecuta con un push a `main`.

## Validación de la integración HTTP

Esto es lo que cubre la validación de la integración HTTP inicial (el número
exacto de pruebas está en la salida de `npm test`):

- Contrato REST, mappers y composición del dashboard.
- HUMIDITY, sensores `INACTIVE` y sin sensor, lecturas offline y `NO_DATA`.
- Una sola solicitud compartida, y estados de carga, error, vacío y cargado.
- Bearer sin cabeceras de identidad, alcance de credenciales y token temporal
  deshabilitado en producción.
- Las pruebas de mocks y de composición que ya existían.

Las plantillas, los SCSS, las fuentes y los componentes visuales no cambiaron.
No se modificaron dependencias ni el backend.

La respuesta HTTP se comprobó con `HttpTestingController`, usando el DTO real de Core.
Probar contra una instancia real requiere iniciar Core y configurar un JWT válido.
