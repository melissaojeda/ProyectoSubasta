import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import {
  actualizarUsuario,
  crearUsuario,
  loginUsuario,
  type ActualizacionUsuario,
  type RegistroUsuario,
  type UsuarioSesion,
} from '../api/usuariosApi'

type SesionContextValue = {
  usuario: UsuarioSesion | null
  iniciarSesion: (email: string, password: string) => Promise<UsuarioSesion>
  registrarse: (datos: RegistroUsuario) => Promise<UsuarioSesion>
  actualizarPerfil: (datos: ActualizacionUsuario) => Promise<UsuarioSesion>
  cerrarSesion: () => void
}

const CLAVE_SESION = 'subastaya.usuario'
const SesionContext = createContext<SesionContextValue | null>(null)

function esUsuarioSesion(valor: unknown): valor is UsuarioSesion {
  if (typeof valor !== 'object' || valor === null) return false

  const usuario = valor as Partial<UsuarioSesion>

  return (
    typeof usuario.id === 'number'
    && typeof usuario.nombre === 'string'
    && typeof usuario.apellido === 'string'
    && typeof usuario.email === 'string'
    && typeof usuario.fechaRegistro === 'string'
  )
}

function leerSesionGuardada() {
  if (typeof window === 'undefined') return null

  const guardada = window.localStorage.getItem(CLAVE_SESION)
  if (!guardada) return null

  try {
    const usuario = JSON.parse(guardada) as unknown

    if (esUsuarioSesion(usuario)) return usuario
  } catch {
    // Si el valor guardado está dañado, se limpia más abajo.
  }

  window.localStorage.removeItem(CLAVE_SESION)
  return null
}

function guardarSesion(usuario: UsuarioSesion | null) {
  if (typeof window === 'undefined') return

  if (usuario) {
    window.localStorage.setItem(CLAVE_SESION, JSON.stringify(usuario))
    return
  }

  window.localStorage.removeItem(CLAVE_SESION)
}

type SesionProviderProps = {
  children: ReactNode
}

export function SesionProvider({ children }: SesionProviderProps) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(leerSesionGuardada)

  function actualizarSesion(nuevoUsuario: UsuarioSesion | null) {
    setUsuario(nuevoUsuario)
    guardarSesion(nuevoUsuario)
  }

  async function iniciarSesion(email: string, password: string) {
    const usuarioAutenticado = await loginUsuario({ email, password })
    actualizarSesion(usuarioAutenticado)
    return usuarioAutenticado
  }

  async function registrarse(datos: RegistroUsuario) {
    await crearUsuario(datos)

    const usuarioCreado = await loginUsuario({
      email: datos.email,
      password: datos.password,
    })

    actualizarSesion(usuarioCreado)
    return usuarioCreado
  }

  async function actualizarPerfil(datos: ActualizacionUsuario) {
    if (!usuario) {
      throw new Error('Necesitás iniciar sesión para modificar tu perfil.')
    }

    const usuarioActualizado = await actualizarUsuario(usuario.id, datos)
    actualizarSesion(usuarioActualizado)
    return usuarioActualizado
  }

  function cerrarSesion() {
    actualizarSesion(null)
  }

  return (
    <SesionContext.Provider
      value={{
        usuario,
        iniciarSesion,
        registrarse,
        actualizarPerfil,
        cerrarSesion,
      }}
    >
      {children}
    </SesionContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSesion() {
  const contexto = useContext(SesionContext)

  if (!contexto) {
    throw new Error('useSesion debe usarse dentro de SesionProvider.')
  }

  return contexto
}
