import { apiFetch } from './http'

export type UsuarioSesion = {
  id: number
  nombre: string
  apellido: string
  email: string
  fechaRegistro: string
}

export type CredencialesUsuario = {
  email: string
  password: string
}

export type RegistroUsuario = CredencialesUsuario & {
  nombre: string
  apellido: string
}

export type ActualizacionUsuario = {
  nombre: string
  apellido: string
  email: string
}

export function loginUsuario(credenciales: CredencialesUsuario) {
  return apiFetch<UsuarioSesion>('/usuarios/login', {
    method: 'POST',
    body: JSON.stringify(credenciales),
  })
}

export async function crearUsuario(datos: RegistroUsuario) {
  await apiFetch<{ mensaje: string }>('/usuarios', {
    method: 'POST',
    body: JSON.stringify(datos),
  })
}

export function obtenerUsuarioPorId(id: number) {
  return apiFetch<UsuarioSesion>(`/usuarios/${id}`)
}

export async function actualizarUsuario(
  id: number,
  datos: ActualizacionUsuario,
) {
  await apiFetch<{ mensaje: string }>(`/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ id, ...datos }),
  })

  return obtenerUsuarioPorId(id)
}
