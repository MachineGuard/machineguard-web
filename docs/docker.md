# Docker

La imagen tiene dos etapas. Node 22.22.3 compila Angular. Después nginx sirve la
SPA desde la imagen `nginxinc/nginx-unprivileged`, que corre sin root y escucha en
el puerto 8080.

## Construir

```bash
docker build -t machineguard-web:local .
```

## Ejecutar

```bash
docker run --rm -p 127.0.0.1:8080:8080 \
  -e API_UPSTREAM=http://host.docker.internal:8080 \
  machineguard-web:local
```

Abre http://127.0.0.1:8080.

## API sin recompilar

La web llama a `/api/v1` del mismo origen. nginx reenvía `/api/` al valor de
`API_UPSTREAM`, que se lee al arrancar el contenedor. Para apuntar a otro Core
basta con cambiar esa variable y reiniciar. Escríbela sin barra final.

- En Docker Desktop, `host.docker.internal` apunta a la laptop.
- En Linux, añade `--add-host=host.docker.internal:host-gateway`.
- La plantilla de nginx está en `docker/nginx/default.conf.template`.

## Rutas

- Las rutas directas, como `/zones/zona-1`, devuelven `index.html` y la SPA resuelve la vista.
- Los archivos estáticos se sirven con caché larga. `index.html` no tiene caché.

## Pruebas fuera de la imagen

Las pruebas usan Chrome local, igual que la CI:

```bash
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
```

En Windows, si Karma no encuentra Chrome, define `CHROME_BIN` con la ruta del
ejecutable.

## Limpieza

```bash
docker image rm machineguard-web:local
```
