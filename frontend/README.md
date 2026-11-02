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

- `pages/`: pantallas de inicio, búsqueda, detalle, creación de subastas, actividad, billetera y perfil.
- `subastas/`: componentes relacionados con subastas y pujas.
- `api/`: llamadas HTTP a la API y manejo de respuestas y errores.
- `sesion/`: contexto de sesión en el frontend.
- `router/`: navegación y rutas.
- `components/`, `styles/`: componentes y estilos compartidos.

## Integración con el backend

La API utiliza rutas `api/v1` (por ejemplo, `POST /api/v1/subastas` y
`POST /api/v1/subastas/{subastaId}/pujas`). El backend debe estar iniciado
para consultar subastas, crear publicaciones, pujar y ver billeteras.

La pantalla de detalle utiliza SignalR mediante `/hubs/subasta` para recibir los eventos `NuevaPujaRecibida` y `SubastaFinalizada`.
El cliente se une al grupo de la subasta y dispone de reconexión automática.

Se mantiene el polling como respaldo: cada 2,5 segundos cuando SignalR está desconectado y aproximadamente cada 30 segundos cuando está conectado. La sesión se maneja actualmente desde el frontend; no hay autenticación JWT implementada.

Consultar el `README.md` de la raíz del repositorio para configurar PostgreSQL,
las migraciones y la API.