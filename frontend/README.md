
# SubastaYa — Frontend

Frontend del sistema de subastas SubastaYa, desarrollado con React, TypeScript, Vite y React Router.

## Requisitos

- Node.js y npm.
- API de SubastaYa ejecutándose en `http://localhost:5113`.

## Iniciar la aplicación

Desde la carpeta `frontend`:

```bash
npm install
npm run dev
```

Abrir `http://localhost:5173`.

Para construir la versión de producción:

```bash
npm run build
```

Para ejecutar el análisis estático configurado:

```bash
npm run lint
```

## Organización de `src`

- `pages/`: pantallas de inicio, catálogo, detalle, creación de subastas, actividad, billetera y perfil.
- `subastas/`: componentes relacionados con subastas y pujas.
- `api/`: llamadas HTTP a la API y manejo de respuestas y errores.
- `sesion/`: contexto de sesión en el frontend.
- `tiempo-real/`: conexión SignalR compartida, recepción de eventos y avisos de actualización.
- `router/`: navegación y rutas.
- `components/`, `styles/`: componentes y estilos compartidos.

## Integración con el backend

La API utiliza rutas `api/v1` (por ejemplo, `POST /api/v1/subastas` y `POST /api/v1/subastas/{subastaId}/pujas`).

El backend debe estar iniciado para consultar subastas, crear publicaciones, pujar y ver billeteras.

La URL de la API se obtiene de `VITE_API_URL`; si no está configurada, se utiliza `http://localhost:5113/api/v1`.

A partir de esa dirección se construye la URL del hub SignalR: `/hubs/subasta`.

### Actualización en tiempo real

La aplicación utiliza `TiempoRealProvider`, definido en `src/tiempo-real/TiempoRealContext.tsx`, para mantener una conexión SignalR compartida.

Los componentes usan `useTiempoReal()` para enterarse de los cambios y consultar nuevamente los datos mediante la API.

| Evento | Actualización solicitada |
|---|---|
| `NuevaPujaRecibida` | Subastas, pujas, actividad y billeteras |
| `SubastaActivada` | Subastas, catálogo y actividad |
| `SubastaFinalizada` | Subastas, actividad y billeteras |
| `SubastaCreada` | Listados y publicaciones |
| `BilleteraActualizada` | Saldo y movimientos de billetera |

Las pantallas de **Inicio**, **Catálogo**, **Detalle de subasta**, **Billetera** y **Mi actividad** reaccionan a los avisos que les corresponden.

SignalR comunica que hubo un cambio; las cifras y los estados se obtienen de la API, no de los mensajes del hub.

El backend emite estos avisos generales sin incluir datos financieros o identificadores de comprador.

### Reconexión y polling

- Con SignalR conectado, las actualizaciones se solicitan cuando llega un evento y se mantiene una comprobación de respaldo aproximadamente cada **30 segundos**.
- Con SignalR desconectado, se intenta restablecer la conexión y se consulta la API aproximadamente cada **2,5 segundos**, siempre que el backend responda.
- Si el backend está apagado, las consultas fallan. Tras reiniciarlo, debe comprobarse que la pantalla se recupere; en pruebas locales se observó que algunos errores persistían hasta presionar **F5**. La recuperación sin recarga no se considera verificada.

La sesión se maneja actualmente desde el frontend; no hay autenticación JWT implementada.

Consultar el [`README.md` principal](../README.md) para configurar PostgreSQL, las migraciones, la API y las pruebas de concurrencia.
