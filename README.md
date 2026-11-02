
# SubastaYa — Frontend

Frontend del sistema de subastas SubastaYa, desarrollado con React, TypeScript, Vite y React Router.

## Requisitos

- Node.js y npm.
- API de SubastaYa ejecutándose en `http://localhost:5113`.
- PostgreSQL configurado para el backend.

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

La API utiliza rutas `api/v1`, por ejemplo:

- `POST /api/v1/subastas`
- `POST /api/v1/subastas/{subastaId}/pujas`
- `GET /api/v1/subastas/{subastaId}`

El backend debe estar iniciado para consultar subastas, crear publicaciones, pujar y ver billeteras.

La URL base de la API puede configurarse mediante la variable de entorno `VITE_API_URL`.

Por defecto, se utiliza `http://localhost:5113/api/v1`.

## Notificaciones y validaciones

El frontend informa al usuario sobre los resultados de las operaciones mediante notificaciones visuales.

Se contemplan los siguientes escenarios:

- Puja realizada correctamente.
- Saldo insuficiente para realizar una oferta.
- Oferta inferior al mínimo permitido.
- Conflicto de concurrencia HTTP 409.
- Extensión de la subasta por una oferta cercana al cierre.
- Oferta superada por otro comprador.
- Finalización de una subasta.

Las notificaciones se muestran mediante el componente `Notificacion.tsx`.

Cuando aparecen varias notificaciones simultáneamente, se organizan verticalmente para evitar superposiciones.

El formulario de puja también incluye validaciones del monto y mensajes asociados a sus campos.

## Estados de las subastas

El frontend contempla los siguientes estados:

- `PROGRAMADA`: muestra el tiempo restante hasta el inicio e impide realizar ofertas.
- `ACTIVA`: permite realizar ofertas válidas.
- `FINALIZADA`: informa que la subasta terminó y deshabilita las pujas.
- `DESIERTA`: informa que terminó sin ofertas y deshabilita las pujas.

El vendedor no puede pujar en su propia publicación.

Para realizar una oferta desde la interfaz es necesario iniciar sesión.

## Actualizaciones en tiempo real con SignalR

El frontend utiliza `@microsoft/signalr` para conectarse al hub del backend:

`/hubs/subasta`

Al abrir el detalle de una publicación, el cliente establece una conexión y se une al grupo correspondiente a esa subasta mediante `UnirseASubasta`.

Se reciben los siguientes eventos:

### NuevaPujaRecibida

Cuando se registra una oferta, el frontend actualiza:

- Precio actual.
- Historial de pujas.
- Cantidad de ofertas.
- Estado de participación del usuario.
- Fecha de finalización, si hubo una extensión.

### SubastaFinalizada

Cuando el backend finaliza una subasta, el frontend:

- Actualiza el estado de la publicación.
- Actualiza el historial y la información disponible.
- Deshabilita las nuevas ofertas.
- Muestra un aviso informativo.

### Reconexión automática

Si SignalR pierde la conexión, el cliente intenta reconectarse automáticamente.

Después de reconectarse, vuelve a unirse al grupo correspondiente a la subasta y actualiza sus datos.

## Polling de respaldo

El frontend conserva las consultas periódicas como mecanismo de respaldo.

- Con SignalR conectado: comprueba los datos aproximadamente cada 30 segundos.
- Sin SignalR: realiza consultas cada 2,5 segundos.

Esto permite continuar actualizando la información cuando la conexión en tiempo real no está disponible.

## Sesión

La sesión se maneja actualmente desde el frontend.

No hay autenticación JWT implementada.

## Configuración del backend

Consultar el `README.md` de la raíz del repositorio para configurar PostgreSQL, las migraciones y la API.
