# Modo mock (demo)

El modo mock muestra la aplicación con datos ficticios, sin Core y sin inicio de sesión.

```powershell
npm run start:mock
```

Usa `MockMonitoringRepository` y no hace peticiones de monitoreo a Core. Los
guards dejan pasar las rutas, y el perfil es un fixture para presentación.
Las alertas y el perfil de la cabecera también son mocks: no son incidentes ni
una identidad autenticada reales.

## Datos de ejemplo

- Cold Room A: 11.2 °C / 58 %, Out of range, máximo 8 °C.
- Dry Store: 24.0 °C / 46 %, Normal, rango 15–28 °C.
- Zone C: 27.0 °C / 71 %, Near limit, máximo 28 °C.
- Loading Dock: Offline, sin mediciones actuales.
- Los cuatro conteos del resumen se derivan del estado de las zonas.

## Comportamiento

- `Acknowledge` actualiza el repositorio mock y la tabla de alertas durante la
  sesión. No cambia las mediciones ni resuelve la desviación ambiental. Rechaza
  reconocimientos duplicados. Al recargar, los mocks se reinician.
- `View details` e `Inspect` abren un diálogo con las condiciones actuales.
- `Add Monitored Point` abre `/zones?action=add-point`. Es un placeholder: no hay CRUD.
- El selector de facility es solo de presentación: no filtra datos.
- Los botones de notificaciones y de usuario abren paneles de vista previa.
- El perfil Alex Morgan sale de un repositorio mock de IAM. Es solo para
  presentación: no crea credenciales ni una identidad autenticada.
- La fachada muestra solo las alertas cuyos IDs de zona coinciden con las zonas
  cargadas. Así no mezcla alertas de demo con zonas UUID de Core.
- Un nodo online sin lecturas muestra un guion. El conteo de nodos activos en el
  mock es 7 de 8.

## Reglas de mediciones en mock

`Measurement` guarda `environmentalVariable`, `measuredValue`, zona, punto,
organización y fecha. `zone.mapper.ts` elige, entre los puntos con nodos online,
la última medición de cada variable. Con esa selección crea el modelo de lectura
de temperatura y humedad. Las lecturas de puntos totalmente offline se excluyen.

Los estados usan los thresholds de ambas variables:

- Fuera de cualquier rango: **Out of range**.
- Dentro del 10 % de un extremo: **Near limit**.
- Resto: **Normal**.
- Una zona sin nodos online: **Offline**.

El mock usa límites de humedad de 30–75 %. El margen del 10 %, los rangos y la
selección del último punto son decisiones provisionales de la demo. Deben
alinearse con las reglas de Core. Si hay varias mediciones de la misma variable
en distintos puntos, se muestra la más reciente, no un promedio.

La conectividad viene de `SensorNode.status`, sin temporizadores. Un nodo online
sin lecturas muestra un guion. No hay un quinto estado de disponibilidad.
