#Script de Prueba de Concurrencia Optimista
$apiUrl = "http://localhost:5113/api/v1/subastas/7/Pujas"
$subastaId = 7

$body1 = @{ CompradorId = 5; Monto = 1400000 } | ConvertTo-Json
$body2 = @{ CompradorId = 6; Monto = 1400000} | ConvertTo-Json

#envio de peticiones en paralelo
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

Write-Host "Respuesta Peticion 1: $res1"
Write-Host "Respuesta Peticion 2: $res2"