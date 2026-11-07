# Interfaz

## Dashboard

- Las tarjetas muestran cada zona: temperatura, humedad, estado y última lectura.
- El resumen cuenta las zonas por estado. Se calcula a partir de las zonas.
- Las tarjetas y el detalle muestran datos obsoletos y de dónde vienen las lecturas.
- `View details` e `Inspect` abren un diálogo con las condiciones actuales.
- El contador **Updated** muestra la antigüedad de la última lectura. Avanza con un
  temporizador de presentación. No inventa mediciones.
- Las barras del gráfico usan alturas relativas al Safe Range y colores según los
  thresholds. En modo HTTP muestran una lectura actual (ver [integración](integracion-core.md)).

## Alertas e incidentes

- Las alertas reconocidas conservan la desviación. El evento Normal se muestra como recuperación.
- Los detalles de zonas offline muestran la última conexión.
- El detalle del incidente explica los bloqueos de resolución y distingue el estado
  histórico y actual del mensaje original. Core revalida cada cierre. Si lo rechaza,
  la Web conserva el texto escrito.
- El rol `VIEWER` sigue siendo de consulta.

## Estados y colores

- Los colores de advertencia y de offline siempre van acompañados de texto e iconos.
- Los estados son: Normal, Near limit, Out of range, Offline y el estado sin datos
  (`NO_DATA`), que se muestra como Offline.

## Diseño responsive

- Cuatro columnas en escritorio (desde 1101 px), dos en laptop o tablet, una en móvil.
- La barra lateral se pliega bajo 760 px.
- La lista de últimas alertas usa filas adaptables.

## Sistema visual

Referencia visual: el mockup Environmental Dashboard y las láminas del design system.

Paleta de marca:

| Token | Valor |
|---|---|
| primary | `#0F4C5C` |
| primary container | `#D6EEF2` |
| OK | `#2A9D8F` |
| warning | `#E9A23B` |
| error | `#D62839` |
| offline | `#8A97A5` |
| text | `#0B1F2A` |
| secondary text | `#52667A` |
| background | `#F8FBFA` |
| surface | `#FFFFFF` |

- Los tokens están en `src/styles.scss`. Los colores de estado, en `_status.scss`,
  y las barras del gráfico, en `_trend.scss`.
- Espaciado en múltiplos de 8 px, tarjetas con radio de 12 px, botones tipo píldora,
  sombras suaves y foco visible.
- Las fuentes Inter y JetBrains Mono van locales en `public/fonts`, con licencia OFL.
  No hay solicitudes externas en tiempo de ejecución.

## Idiomas

- Los textos están en `src/i18n/es.json` y `src/i18n/en.json`, con las mismas
  claves planas, por ejemplo `zones.title` o `login.error.credentials`.
- Para agregar un texto: añade la clave en los dos archivos. Úsala con el pipe `t`
  (`{{ "zones.title" | t }}`, o con parámetros `{{ "dashboard.updated" | t: { n: 12 } }}`)
  o con `I18nService.t()` en TypeScript.
- Una prueba falla si a un idioma le falta una clave o un parámetro.
- El idioma predeterminado es el español. El selector EN/ES del encabezado cambia
  toda la interfaz sin recargar. La elección se guarda en `localStorage`
  (`machineguard.language`). Las fechas y horas siguen el idioma elegido.
- Los datos que vienen de Core (nombres de zonas, puntos y lotes) no se traducen.
