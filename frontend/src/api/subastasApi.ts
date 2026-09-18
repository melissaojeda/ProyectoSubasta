import type { Categoria, Puja, Subasta } from '../subastas/subasta'
import { apiFetch } from './http'

export type NuevaSubasta = {
  vendedorId: number
  categoriaId: number
  titulo: string
  descripcion: string
  urlImagen: string
  precioBase: number
  incrementoMinimo: number
  fechaInicio: string
  fechaFin: string
}

export function obtenerSubastas(signal?: AbortSignal) {
  return apiFetch<Subasta[]>(
    '/subastas?pagina=1&tamanioPagina=100',
    { signal },
  )
}

export function obtenerCategorias(signal?: AbortSignal) {
  return apiFetch<Categoria[]>('/categorias', { signal })
}

export function obtenerSubastaPorId(id: number, signal?: AbortSignal) {
  return apiFetch<Subasta>(`/subastas/${id}`, { signal })
}

export async function obtenerPujasPorSubasta(
  subastaId: number,
  signal?: AbortSignal,
) {
  const pujas = await apiFetch<Puja[]>(
    `/subastas/${subastaId}/pujas`,
    { signal },
  )

  return [...pujas].sort(
    (a, b) => new Date(b.fechaPuja).getTime() - new Date(a.fechaPuja).getTime(),
  )
}


export function obtenerPujasUsuarioEnSubasta(
  subastaId: number,
  usuarioId: number,
  signal?: AbortSignal,
) {
  return apiFetch<Puja[]>(
    `/subastas/${subastaId}/pujas/usuarios/${usuarioId}`,
    { signal },
  )
}

export function realizarPuja(
  subastaId: number,
  compradorId: number,
  monto: number,
) {
  return apiFetch<{ mensaje: string }>(`/subastas/${subastaId}/pujas`, {
    method: 'POST',
    body: JSON.stringify({ compradorId, monto }),
  })
}

export function publicarSubasta(datos: NuevaSubasta) {
  return apiFetch<{ mensaje: string }>('/subastas', {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}
