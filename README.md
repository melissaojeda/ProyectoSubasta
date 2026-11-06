
# SubastaYa - Sistema de Subastas Online

Sistema de subastas online con publicación de productos, pujas, billeteras virtuales, cierre automático de subastas y actualizaciones en tiempo real.

## Tecnologías utilizadas

- **Backend:** C#, .NET 8, ASP.NET Core, Entity Framework Core y PostgreSQL. Arquitectura en capas: `Application`, `Domain`, `Infrastructure` y `proyectoapi`.
- **Frontend:** React, TypeScript, Vite, React Router, HTML y CSS.
- **Tiempo real:** SignalR, con *polling* como mecanismo de respaldo.
- **Control de concurrencia:** concurrencia optimista mediante tokens de versión, con respuestas HTTP 409 ante conflictos detectados.

---

## Requisitos previos

- .NET SDK 8.0.
- Node.js y npm.
- PostgreSQL.
- Visual Studio o un entorno de desarrollo compatible.
- Herramienta `dotnet ef` para administrar las migraciones de Entity Framework Core.

---

## Instrucciones de instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/melissaojeda/ProyectoSubasta.git
cd ProyectoSubasta
```

### 2. Configurar PostgreSQL y el backend

La cadena de conexión se configura **localmente mediante User Secrets de .NET**, sin guardar contraseñas reales en `backend/proyectoapi/appsettings.json`.

**Desde Visual Studio:**

1. Abrir el proyecto `proyectoapi`.
2. Hacer clic derecho sobre `proyectoapi` en el Explorador de soluciones.
3. Seleccionar **Manage User Secrets** (Administrar secretos de usuario).
4. Configurar en `secrets.json` la conexión local, reemplazando `TU_CONTRASENA` por la contraseña de PostgreSQL:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=SubastaYaDb;Username=postgres;Password=TU_CONTRASENA"
  }
}
```

**No subir `secrets.json` ni contraseñas al repositorio.** Cada integrante debe configurar su propia conexión.

La carga automática de User Secrets corresponde al entorno `Development`. En otros entornos hay que proporcionar la conexión mediante un mecanismo de configuración apropiado, como variables de entorno.

Desde la raíz del repositorio, aplicar las migraciones de Entity Framework Core:

```bash
dotnet ef database update --project backend/Infrastructure --startup-project backend/proyectoapi
```

Iniciar el backend:

```bash
dotnet run --project backend/proyectoapi
```

Con la configuración de desarrollo utilizada en el proyecto:

- **API:** http://localhost:5113
- **Swagger:** http://localhost:5113/swagger

### 3. Configurar y ejecutar el frontend

En otra terminal, desde la raíz del repositorio:

```bash
cd frontend
npm install
npm run dev
```

La aplicación de desarrollo queda disponible en http://localhost:5173.

Para generar la compilación de producción:

```bash
npm run build
```

Para ejecutar el análisis estático:

```bash
npm run lint
```

**El backend y el frontend deben permanecer ejecutándose al mismo tiempo** para utilizar las funcionalidades del sistema.

---

## Actualizaciones en tiempo real

El frontend utiliza una conexión compartida a SignalR mediante el hub `/hubs/subasta`, administrada por `frontend/src/tiempo-real/TiempoRealContext.tsx` y habilitada desde `frontend/src/main.tsx`.

Cuando el backend confirma una operación, publica un evento. El cliente lo recibe y vuelve a consultar la API para obtener los datos actualizados; los eventos no reemplazan a la base de datos como fuente de información.

| Evento SignalR | Cuándo se emite | Datos que se refrescan en el frontend |
|---|---|---|
| `NuevaPujaRecibida` | Después de registrar una puja | Subastas (Inicio, Catálogo, Detalle y Mi actividad) y billeteras |
| `SubastaActivada` | Cuando el worker activa una subasta programada | Subastas y sus estados |
| `SubastaFinalizada` | Cuando el worker confirma el cierre | Subastas, Mi actividad y billeteras |
| `SubastaCreada` | Después de guardar una publicación | Listados de subastas y publicaciones del usuario |
| `BilleteraActualizada` | Después de confirmar un depósito | Saldo e historial de movimientos en Billetera |

El servidor envía avisos generales sin incluir saldos ni datos personales en esos eventos. Cada pantalla abierta solicita la información que necesita a los endpoints de la API.

El detalle también muestra avisos para cambios de estado, pujas superadas y prórrogas de cierre.

### Mecanismos de actualización y recuperación

- **SignalR conectado:** las pantallas abiertas se refrescan al recibir eventos, sin esperar al siguiente intervalo.
- **Conexión activa sin eventos:** el cliente mantiene una consulta de respaldo aproximadamente cada **30 segundos**.
- **Conexión desconectada:** el cliente intenta recuperar la conexión y consulta la API aproximadamente cada **2,5 segundos**, mientras el backend esté disponible.
- **Backend detenido:** ni SignalR ni las consultas HTTP pueden obtener información nueva. La recuperación de la interfaz después de reiniciar el backend debe comprobarse por separado; durante las pruebas locales se observó que algunas pantallas podían requerir **F5** para salir de un error persistente.

El `SubastaWorker` verifica periódicamente las activaciones y los cierres de subastas, en intervalos de aproximadamente **10 segundos**. SignalR notifica después de que se haya confirmado el cambio correspondiente.

### Verificaciones funcionales

Se realizaron pruebas manuales de:

- Actualización de pujas en el detalle y el catálogo.
- Actualización de billeteras al registrar y superar ofertas.
- Actualización de saldos y movimientos después de depósitos.
- Aparición automática de nuevas publicaciones.
- Activación automática de subastas.
- Finalización de subastas y actualización de sus datos.

La prueba de recuperación automática de la interfaz tras reiniciar el backend no quedó confirmada.

La sesión se gestiona actualmente desde el frontend. **No se ha implementado autenticación JWT.**

---

## Prueba de concurrencia optimista (stress test)

El backend implementa control de concurrencia optimista para evitar inconsistencias cuando dos compradores intentan pujar sobre una misma subasta simultáneamente.

El archivo `test-concurrency.ps1`, ubicado en la raíz del repositorio, permite realizar una prueba automatizada.

A diferencia de la versión inicial, **no depende de una subasta con ID fijo ni de que la subasta "Notebook" siga activa**.

### Preparación y ejecución

El script:

1. Consulta una categoría existente (requiere que la base tenga al menos una categoría, por ejemplo, cargada mediante los datos iniciales).
2. Crea usuarios de prueba y deposita fondos en las billeteras de los compradores.
3. Crea una subasta de prueba y espera a que el proceso automático la active.
4. Envía dos pujas simultáneas por el mismo monto.
5. Comprueba los códigos HTTP y verifica que haya una sola puja registrada.
6. Si obtiene HTTP 400 en vez de HTTP 409, reintenta con otra subasta de prueba, hasta cuatro intentos por defecto.

Con el backend ejecutándose, abrir PowerShell en la raíz del repositorio y ejecutar:

```powershell
powershell -ExecutionPolicy Bypass -File .\test-concurrency.ps1
```

### Resultados esperados

- **HTTP 201 Created:** una de las pujas fue aceptada.
- **HTTP 409 Conflict:** se detectó un conflicto de concurrencia optimista cuando ambas operaciones compitieron sobre la misma versión.
- **HTTP 400 Bad Request:** también puede ocurrir si la segunda petición se procesa después de la primera y deja de cumplir la validación de monto mínimo; esto no implica por sí solo un fallo de concurrencia.
- **Integridad:** debe registrarse una sola puja; la petición rechazada no debe producir una retención de fondos indebida.

**Importante:** enviar dos solicitudes en paralelo no garantiza reproducir un HTTP 409 en todas las ejecuciones.

El script solo considera confirmado ese escenario si efectivamente recibe el conflicto.

En las verificaciones del proyecto también se reprodujo el resultado HTTP 201/409 mediante una prueba adicional con Node.js.

**Entorno de prueba:** el script crea registros y depósitos reales en la base de datos configurada. Ejecutarlo únicamente sobre una base de desarrollo o pruebas. Los datos creados permanecen en esa base.

---

## Verificación del backend

Ejecutar las pruebas automatizadas desde la raíz del repositorio:

```bash
dotnet test backend/SubastaYa.sln
```

Para verificar las migraciones instaladas:

```bash
dotnet ef migrations list --project backend/Infrastructure --startup-project backend/proyectoapi -- --environment Development
```

La migración `20261030094424_ProtegerAuditoriasLog` agrega una protección en PostgreSQL para impedir modificaciones y eliminaciones de registros de auditoría.

También se pueden probar los endpoints desde Swagger, por ejemplo:

- `GET /api/v1/categorias`
- `GET /api/v1/subastas`
- `GET /api/v1/subastas/{id}`

---

## Documentación del frontend

Consultar [`frontend/README.md`](frontend/README.md) para conocer la organización de componentes, las rutas de la API, el funcionamiento de SignalR y los comandos de desarrollo del frontend.
