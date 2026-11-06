param(
    [string]$BaseUrl = 'http://localhost:5113/api/v1',
    [ValidateRange(1, 8)]
    [int]$MaxIntentos = 4
)

$ErrorActionPreference = 'Stop'
$BaseUrl = $BaseUrl.TrimEnd('/')

# Este script crea usuarios, depósitos y subastas reales en la BD indicada.
# Ejecutarlo solamente contra un entorno de desarrollo/pruebas.
function InvocarApi {
    param(
        [Parameter(Mandatory)] [string]$Metodo,
        [Parameter(Mandatory)] [string]$Ruta,
        [object]$Datos = $null
    )

    $opciones = @{
        Uri         = "$BaseUrl$Ruta"
        Method      = $Metodo
        ErrorAction = 'Stop'
    }

    if ($null -ne $Datos) {
        $opciones.ContentType = 'application/json'
        $opciones.Body = $Datos | ConvertTo-Json -Depth 8 -Compress
    }

    Invoke-RestMethod @opciones
}

# Invoke-RestMethod puede devolver una lista como un único objeto Object[].
# Esta función normaliza la respuesta para trabajar con cada registro por separado.
function InvocarListaApi {
    param([Parameter(Mandatory)] [string]$Ruta)

    $resultado = InvocarApi -Metodo 'GET' -Ruta $Ruta
    foreach ($elemento in $resultado) {
        Write-Output $elemento
    }
}

function CrearUsuarioPrueba {
    param(
        [Parameter(Mandatory)] [string]$Rol,
        [Parameter(Mandatory)] [string]$Identificador
    )

    $email = "$Rol.$Identificador@subastaya.test"
    $datos = @{
        nombre   = 'Prueba'
        apellido = 'Automatica'
        email    = $email
        password = 'Prueba12345!'
    }

    $null = InvocarApi -Metodo 'POST' -Ruta '/usuarios' -Datos $datos

    # El endpoint de registro devuelve 201 sin el ID: lo buscamos por email único.
    $usuarios = @(InvocarListaApi -Ruta '/usuarios')
    $usuario = $usuarios | Where-Object { $_.email -eq $email } | Select-Object -First 1
    if ($null -eq $usuario -or $null -eq $usuario.id -or $usuario.id -is [array]) {
        throw "No se pudo identificar de forma única al usuario registrado: $email"
    }

    return $usuario
}

function DepositarFondosPrueba {
    param([Parameter(Mandatory)] [int]$UsuarioId)

    $billetera = InvocarApi -Metodo 'GET' -Ruta "/billeteras/usuarios/$UsuarioId"
    if ($null -eq $billetera) {
        throw "El usuario $UsuarioId no tiene billetera."
    }

    $null = InvocarApi -Metodo 'POST' -Ruta "/billeteras/$($billetera.id)/transacciones" -Datos @{ monto = 20000 }
}

function CrearSubastaPrueba {
    param(
        [Parameter(Mandatory)] [int]$VendedorId,
        [Parameter(Mandatory)] [int]$CategoriaId,
        [Parameter(Mandatory)] [string]$Identificador,
        [Parameter(Mandatory)] [int]$Numero
    )

    # Debe iniciar en el futuro: el worker la activa automáticamente.
    $inicio = (Get-Date).ToUniversalTime().AddSeconds(20)
    $titulo = "Concurrencia $Identificador-$Numero"
    $datos = @{
        vendedorId      = $VendedorId
        categoriaId     = $CategoriaId
        titulo          = $titulo
        descripcion     = 'Subasta creada por la prueba automatizada de concurrencia.'
        urlImagen       = 'https://example.com/subasta-prueba.jpg'
        precioBase      = 1000
        incrementoMinimo = 1000
        fechaInicio     = $inicio.ToString('o')
        fechaFin        = $inicio.AddMinutes(3).ToString('o')
    }

    $null = InvocarApi -Metodo 'POST' -Ruta '/subastas' -Datos $datos

    # La creación devuelve 201, pero no el ID: lo obtenemos desde las publicaciones del vendedor.
    $subastas = @(InvocarListaApi -Ruta "/usuarios/$VendedorId/subastas")
    $subasta = $subastas | Where-Object { $_.titulo -eq $titulo } | Select-Object -First 1
    if ($null -eq $subasta -or $null -eq $subasta.id -or $subasta.id -is [array]) {
        throw "No se pudo identificar de forma única la subasta creada: $titulo"
    }

    return [int]$subasta.id
}

function EsperarSubastaActiva {
    param([Parameter(Mandatory)] [int]$SubastaId)

    $limite = (Get-Date).ToUniversalTime().AddSeconds(75)
    while ((Get-Date).ToUniversalTime() -lt $limite) {
        $subasta = InvocarApi -Metodo 'GET' -Ruta "/subastas/$SubastaId"
        if ($subasta.estado -eq 'ACTIVA') { return }
        if ($subasta.estado -in @('FINALIZADA', 'DESIERTA')) {
            throw "La subasta $SubastaId terminó antes de la prueba."
        }
        Start-Sleep -Seconds 1
    }

    throw "La subasta $SubastaId no pasó a ACTIVA en 75 segundos. Revisá SubastaWorker."
}

function EnviarPujasSimultaneas {
    param(
        [Parameter(Mandatory)] [int]$SubastaId,
        [Parameter(Mandatory)] [int]$Comprador1Id,
        [Parameter(Mandatory)] [int]$Comprador2Id,
        [Parameter(Mandatory)] [string]$Identificador
    )

    $url = "$BaseUrl/subastas/$SubastaId/pujas"
    $body1 = @{ compradorId = $Comprador1Id; monto = 1000 } | ConvertTo-Json -Compress
    $body2 = @{ compradorId = $Comprador2Id; monto = 1000 } | ConvertTo-Json -Compress
    $carpeta = [System.IO.Path]::GetTempPath()
    $prefijo = Join-Path $carpeta "subastaya-$Identificador-$SubastaId"
    $ready1 = "$prefijo-1.ready"
    $ready2 = "$prefijo-2.ready"
    $go = "$prefijo.go"
    $archivos = @($ready1, $ready2, $go)
    $job1 = $null
    $job2 = $null

    $trabajo = {
        param($Destino, $Cuerpo, $ArchivoListo, $ArchivoInicio)

        $ErrorActionPreference = 'Stop'
        [System.IO.File]::WriteAllText($ArchivoListo, 'listo')
        $limite = (Get-Date).AddSeconds(35)
        while (-not (Test-Path -LiteralPath $ArchivoInicio)) {
            if ((Get-Date) -gt $limite) { throw 'No llegó la señal para iniciar la puja.' }
            Start-Sleep -Milliseconds 25
        }

        try {
            $respuesta = Invoke-WebRequest -Uri $Destino -Method POST -Body $Cuerpo -ContentType 'application/json' -UseBasicParsing -ErrorAction Stop
            [pscustomobject]@{ Codigo = [int]$respuesta.StatusCode }
        }
        catch {
            $respuesta = $_.Exception.Response
            if ($null -eq $respuesta -or $null -eq $respuesta.StatusCode) { throw }
            [pscustomobject]@{ Codigo = [int]$respuesta.StatusCode }
        }
    }

    try {
        $job1 = Start-Job -ScriptBlock $trabajo -ArgumentList $url, $body1, $ready1, $go
        $job2 = Start-Job -ScriptBlock $trabajo -ArgumentList $url, $body2, $ready2, $go

        $limite = (Get-Date).AddSeconds(30)
        while (-not ((Test-Path -LiteralPath $ready1) -and (Test-Path -LiteralPath $ready2))) {
            if ((Get-Date) -gt $limite) {
                throw 'No se prepararon los dos procesos de puja a tiempo.'
            }
            if ($job1.State -eq 'Failed' -or $job2.State -eq 'Failed') {
                throw 'Uno de los procesos falló antes de comenzar.'
            }
            Start-Sleep -Milliseconds 50
        }

        # Los dos procesos estaban esperando esta misma señal.
        [System.IO.File]::WriteAllText($go, 'iniciar')
        $null = @($job1, $job2) | Wait-Job -Timeout 45
        if ($job1.State -ne 'Completed' -or $job2.State -ne 'Completed') {
            throw "Las pujas no terminaron correctamente ($($job1.State) / $($job2.State))."
        }

        $respuesta1 = Receive-Job -Job $job1 -ErrorAction Stop
        $respuesta2 = Receive-Job -Job $job2 -ErrorAction Stop
        return @([int]$respuesta1.Codigo, [int]$respuesta2.Codigo)
    }
    finally {
        foreach ($trabajoIniciado in @($job1, $job2)) {
            if ($null -ne $trabajoIniciado) {
                Stop-Job -Job $trabajoIniciado -ErrorAction SilentlyContinue
                Remove-Job -Job $trabajoIniciado -Force -ErrorAction SilentlyContinue
            }
        }
        foreach ($archivo in $archivos) {
            Remove-Item -LiteralPath $archivo -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host '=== SubastaYa: prueba autónoma de concurrencia ===' -ForegroundColor Cyan
Write-Host 'ATENCIÓN: se crearán usuarios, depósitos y subastas en la base conectada.' -ForegroundColor Yellow

# El endpoint de categorías no permite crearlas. Se utiliza una categoría del seed habitual.
$categorias = @(InvocarListaApi -Ruta '/categorias')
if ($categorias.Count -eq 0) {
    throw 'La API no tiene categorías. Iniciá el backend para ejecutar DbInitializer.Seed.'
}

$idUnico = [guid]::NewGuid().ToString('N').Substring(0, 8)
$vendedor = CrearUsuarioPrueba -Rol 'vendedor' -Identificador $idUnico
$comprador1 = CrearUsuarioPrueba -Rol 'comprador1' -Identificador $idUnico
$comprador2 = CrearUsuarioPrueba -Rol 'comprador2' -Identificador $idUnico

DepositarFondosPrueba -UsuarioId ([int]$comprador1.id)
DepositarFondosPrueba -UsuarioId ([int]$comprador2.id)

$conflictoConfirmado = $false

for ($intento = 1; $intento -le $MaxIntentos; $intento++) {
    Write-Host "`nIntento $intento de $MaxIntentos" -ForegroundColor Cyan
    $subastaId = CrearSubastaPrueba -VendedorId ([int]$vendedor.id) -CategoriaId ([int]$categorias[0].id) -Identificador $idUnico -Numero $intento
    Write-Host "Subasta nueva #$subastaId. Esperando su activación..."
    EsperarSubastaActiva -SubastaId $subastaId

    # Guardar los saldos ANTES de las peticiones para verificar cada movimiento.
    $wallet1Antes = InvocarApi -Metodo 'GET' -Ruta "/billeteras/usuarios/$($comprador1.id)"
    $wallet2Antes = InvocarApi -Metodo 'GET' -Ruta "/billeteras/usuarios/$($comprador2.id)"

    $codigos = @(EnviarPujasSimultaneas -SubastaId $subastaId -Comprador1Id ([int]$comprador1.id) -Comprador2Id ([int]$comprador2.id) -Identificador $idUnico)
    $pujas = @(InvocarListaApi -Ruta "/subastas/$subastaId/pujas")
    $wallet1Despues = InvocarApi -Metodo 'GET' -Ruta "/billeteras/usuarios/$($comprador1.id)"
    $wallet2Despues = InvocarApi -Metodo 'GET' -Ruta "/billeteras/usuarios/$($comprador2.id)"
    Write-Host "Respuestas HTTP: $($codigos -join ' / ') | Pujas registradas: $($pujas.Count)"

    if ($codigos.Count -ne 2) {
        throw "Se esperaban dos respuestas HTTP y llegaron $($codigos.Count)."
    }

    $creadas = @($codigos | Where-Object { $_ -eq 201 }).Count
    $conflictos = @($codigos | Where-Object { $_ -eq 409 }).Count
    $invalidas = @($codigos | Where-Object { $_ -eq 400 }).Count

    if ($creadas -ne 1 -or ($conflictos + $invalidas) -ne 1 -or
        $pujas.Count -ne 1 -or [decimal]$pujas[0].monto -ne 1000) {
        throw "FALLÓ LA INTEGRIDAD en subasta #${subastaId}: se esperaba una puja de 1000, HTTP 201 y un rechazo HTTP 400/409."
    }

    # Una sola billetera debe retener 1000; la billetera de la puja rechazada no cambia.
    $deltaDisponible1 = [decimal]$wallet1Despues.saldoDisponible - [decimal]$wallet1Antes.saldoDisponible
    $deltaRetenido1   = [decimal]$wallet1Despues.saldoRetenido - [decimal]$wallet1Antes.saldoRetenido
    $deltaDisponible2 = [decimal]$wallet2Despues.saldoDisponible - [decimal]$wallet2Antes.saldoDisponible
    $deltaRetenido2   = [decimal]$wallet2Despues.saldoRetenido - [decimal]$wallet2Antes.saldoRetenido

    if ($codigos[0] -eq 201) {
        $walletCorrecta = ($deltaDisponible1 -eq -1000 -and $deltaRetenido1 -eq 1000 -and
                          $deltaDisponible2 -eq 0 -and $deltaRetenido2 -eq 0)
    } else {
        $walletCorrecta = ($deltaDisponible2 -eq -1000 -and $deltaRetenido2 -eq 1000 -and
                          $deltaDisponible1 -eq 0 -and $deltaRetenido1 -eq 0)
    }
    if (-not $walletCorrecta) {
        throw "FALLÓ LA INTEGRIDAD DE BILLETERAS en subasta #${subastaId}: movimientos indebidos o retención incorrecta."
    }
    Write-Host 'Integridad de billeteras: OK (una retención de 1000, sin cambios en la billetera rechazada).' -ForegroundColor Green

    if ($conflictos -eq 1) {
        $conflictoConfirmado = $true
        Write-Host 'APROBADO: un HTTP 201, un HTTP 409, una sola puja y billeteras consistentes.' -ForegroundColor Green
        break
    }

    Write-Host 'APROBADO (integridad): HTTP 201/400 y billeteras consistentes. Se intenta reproducir 409 en otra subasta.' -ForegroundColor Yellow
}

if (-not $conflictoConfirmado) {
    Write-Warning "La integridad fue verificada, pero no se reprodujo HTTP 409 en $MaxIntentos intentos. No se afirma haber demostrado el conflicto optimista con esta ejecución."
}

Write-Host "`nPrueba finalizada. Los datos de prueba permanecen en la base de desarrollo." -ForegroundColor Green
