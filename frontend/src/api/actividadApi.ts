import type { Puja, Subasta } from '../subastas/subasta'
import { apiFetch } from './http'

export type ActividadPuja = {
  subastaId: number
  tituloSubasta: string
  estadoSubasta: string
  mejorPuja: number
  miMejorPuja: number
  esGanador: boolean | null
}

export function obtenerActividadPujas(
  usuarioId: number,
  signal?: AbortSignal,
) {
  return apiFetch<ActividadPuja[]>(
    `/usuarios/${usuarioId}/actividades/pujas`,
    { signal },
  )
}

export function obtenerPujasUsuario(
  usuarioId: number,
  signal?: AbortSignal,
) {
  return apiFetch<Puja[]>(`/usuarios/${usuarioId}/pujas`, { signal })
}

export function obtenerPublicacionesUsuario(
  usuarioId: number,
  signal?: AbortSignal,
) {
  return apiFetch<Subasta[]>(`/usuarios/${usuarioId}/subastas`, { signal })
}
