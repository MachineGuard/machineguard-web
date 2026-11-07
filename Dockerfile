FROM node:22.22.3-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.30.6-alpine
COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/machineguard-web/browser /usr/share/nginx/html
# Destino de /api/ al arrancar el contenedor. Sin barra final: la ruta /api/... se conserva tal cual.
ENV API_UPSTREAM=http://host.docker.internal:8080
EXPOSE 8080
