# SubastaYa - Sistema de Subastas Online

## Tecnologías Utilizadas

* **Backend:** Desarrollado con una arquitectura en capas (`Application`, `Domain`, `Infrastructure`, `proyectoapi`) utilizando C#, .NET 8, Entity Framework Core y PostgreSQL.
* **Frontend:** Desarrollado con React, TypeScript, Vite, React Router, HTML y CSS.
* **Control de Concurrencia:** Optimistic Concurrency (HTTP 409 Conflict mediante tokens de versión).

---

## Requisitos Previos

* **.NET SDK:** Versión 8.0 o superior
* **Node.js y npm**
* **PostgreSQL**

---

## Instrucciones de Instalación y Ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/melissaojeda/ProyectoSubasta.git
cd ProyectoSubasta
```

### 2. Configurar y levantar el Backend

Configurar la cadena de conexión en el archivo `appsettings.json`, ubicado en la carpeta `backend/proyectoapi/`.

Ubicarse en la raíz del repositorio y aplicar las migraciones de Entity Framework hacia PostgreSQL:

```bash
dotnet ef database update --project backend/Infrastructure --startup-project backend/proyectoapi
```

Iniciar la aplicación backend:

```bash
dotnet run --project backend/proyectoapi
```
La API queda disponible en:

* **API:** `http://localhost:5113`
* **Swagger:** `http://localhost:5113/swagger`


### 3. Configurar y levantar el Frontend

Ir a la carpeta del frontend:

```bash
cd frontend
```

Instalar las dependencias:

```bash
npm install
```

Iniciar el entorno de desarrollo:

```bash
npm run dev
```
La aplicación queda disponible en:

* **Frontend:** `http://localhost:5173`

Para utilizar el sistema completo, el backend y el frontend deben permanecer ejecutándose al mismo tiempo.


---

## Prueba de Concurrencia Optimista (Stress Test)

Para cumplir con el requisito de control de concurrencia, se desarrolló un script automatizado en PowerShell (`test-concurrency.ps1`) que dispara dos peticiones `POST` de puja idénticas en paralelo hacia una misma subasta utilizando trabajos en segundo plano (`Start-Job`).

* Cuando ambas peticiones alcanzan concurrentemente la actualización de la misma versión de la subasta, una se completa correctamente (**HTTP 201 Created**) y la otra es rechazada por el control de concurrencia (**HTTP 409 Conflict**).
* La prueba está preparada para una base de datos recién inicializada con los datos seed. Debe ejecutarse mientras la subasta de prueba "Notebook" continúe activa.

### Script de Prueba de Concurrencia Optimista

```powershell
$subastaId = 1
$apiUrl = "http://localhost:5113/api/v1/subastas/$subastaId/pujas"

$body1 = @{ CompradorId = 2; Monto = 50000 } | ConvertTo-Json
$body2 = @{ CompradorId = 3; Monto = 50000 } | ConvertTo-Json

# Envío de peticiones en paralelo
$job1 = Start-Job -ScriptBlock {
    param($url, $b)
    try {
        $response = Invoke-RestMethod -Uri $url -Method Post -Body $b -ContentType "application/json" -ErrorAction Stop
        return "201 Created"
    } catch {
        return $_.Exception.Response.StatusCode.value__
    }
} -ArgumentList $apiUrl, $body1

$job2 = Start-Job -ScriptBlock {
    param($url, $b)
    try {
        $response = Invoke-RestMethod -Uri $url -Method Post -Body $b -ContentType "application/json" -ErrorAction Stop
        return "201 Created"
    } catch {
        return $_.Exception.Response.StatusCode.value__
    }
} -ArgumentList $apiUrl, $body2

# Esperamos ambos resultados simultáneamente
$res1 = Receive-Job -Job $job1 -Wait
$res2 = Receive-Job -Job $job2 -Wait

Remove-Job $job1, $job2

Write-Host "Respuesta Petición 1: $res1"
Write-Host "Respuesta Petición 2: $res2"
```
