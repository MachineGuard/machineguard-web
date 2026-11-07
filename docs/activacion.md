# Activación de cuenta

La ruta pública `/activate?token=...` activa la cuenta del administrador de una
organización piloto. Recibe el enlace de invitación que entrega el equipo de MachineGuard.

## Qué hace

- Lee `token` de la URL y lo quita de la barra de direcciones al cargar la página.
  La página no guarda ni registra el token.
- Pide la contraseña y su repetición. Usa las mismas reglas que Core: al menos
  12 caracteres y como máximo 72 bytes UTF-8.
- Envía `POST /api/v1/auth/invitations/accept` con `{ "token", "password" }`.
  Esta llamada no lleva `Authorization`: el interceptor la excluye por
  coincidencia exacta de ruta, igual que `login` y `refresh`.
- Core responde `201` y no abre sesión. Después de activar, la página muestra un
  botón para ir a `/login`.

## Estados

| Situación | Qué ve la persona |
|---|---|
| Sin `token` en la URL | Aviso de enlace incompleto, sin formulario |
| Core responde `401` | Enlace no válido o vencido, sin formulario |
| Core responde `400` o la contraseña no cumple la regla | Mensaje de contraseña; el texto escrito se conserva |
| Sin conexión o error `502` o superior | Mensaje de conexión; el texto escrito se conserva |
| Core responde `201` | Cuenta activada y botón para iniciar sesión |

## Límites

- La invitación vence a las 24 horas y solo sirve una vez
  (ver `docs/pilot-requests.md` en el repositorio de Core).
- Si el token se pierde antes de entregarse, Core no lo reemite.
- En modo mock no hay Core, así que la activación no se puede completar.
