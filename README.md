
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

La pantalla de detalle de una subasta utiliza SignalR mediante `/hubs/subasta` y recibe los eventos `NuevaPujaRecibida` y `SubastaFinalizada`.

El cliente dispone de reconexión automática y mantiene consultas periódicas (*polling*) como respaldo:

- **Con SignalR conectado:** actualización de respaldo aproximadamente cada 30 segundos.
- **Sin SignalR:** actualización aproximadamente cada 2,5 segundos.

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
