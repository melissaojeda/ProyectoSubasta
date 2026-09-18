import { apiFetch } from './http'

export type BilleteraVista = {
  id: number
  usuarioId: number
  saldoTotal: number
  saldoRetenido: number
  saldoDisponible: number
}

export type TipoMovimiento =
  | 'DEPOSITO'
  | 'RETENCION_PUJA'
  | 'LIBERACION_PUJA'
  | 'PAGO_SUBASTA'
  | 'INGRESO_VENTA'

export type MovimientoBilletera = {
  id: number
  billeteraId: number
  tipo: TipoMovimiento
  monto: number
  fecha: string
  subastaId: number | null
}

export function obtenerBilleteraPorUsuario(
  usuarioId: number,
  signal?: AbortSignal,
) {
  return apiFetch<BilleteraVista>(
    `/billeteras/usuarios/${usuarioId}`,
    { signal },
  )
}

export async function obtenerMovimientosBilletera(
  billeteraId: number,
  signal?: AbortSignal,
) {
  const movimientos = await apiFetch<MovimientoBilletera[]>(
    `/billeteras/${billeteraId}/transacciones`,
    { signal },
  )

  return [...movimientos].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
  )
}

export function depositarSaldo(billeteraId: number, monto: number) {
  return apiFetch<{ mensaje: string }>(
    `/billeteras/${billeteraId}/transacciones`,
    {
      method: 'POST',
      body: JSON.stringify({ monto }),
    },
  )
}
