import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { obtenerMensajeError } from '../api/http'
import Notificacion from '../components/common/Notificacion'
import type { AppLayoutContext } from '../components/layout/AppLayout'
import { useSesion } from '../sesion/SesionContext'
import '../styles/account.css'

type CampoPerfil = 'nombre' | 'apellido' | 'email'

type ValoresPerfil = {
  nombre: string
  apellido: string
  email: string
}

function IconoLapiz() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m4 20 4.4-1 9.9-9.9-3.4-3.4L5 15.6 4 20Z" />
      <path d="m13.8 6.8 3.4 3.4" />
    </svg>
  )
}

function formatearFechaRegistro(fecha: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'long',
  }).format(new Date(fecha))
}

const PATRON_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[- '][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/
const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function validarPerfil(valores: ValoresPerfil) {
  const errores: Partial<Record<CampoPerfil, string>> = {}
  const nombre = valores.nombre.trim()
  const apellido = valores.apellido.trim()
  const email = valores.email.trim()

  if (nombre.length < 2) {
    errores.nombre = 'El nombre debe tener al menos 2 caracteres.'
  } else if (nombre.length > 20) {
    errores.nombre = 'El nombre no puede superar los 20 caracteres.'
  } else if (!PATRON_NOMBRE.test(nombre)) {
    errores.nombre = 'Usá solo letras, espacios, guiones o apóstrofes.'
  }

  if (apellido.length < 2) {
    errores.apellido = 'El apellido debe tener al menos 2 caracteres.'
  } else if (apellido.length > 15) {
    errores.apellido = 'El apellido no puede superar los 15 caracteres.'
  } else if (!PATRON_NOMBRE.test(apellido)) {
    errores.apellido = 'Usá solo letras, espacios, guiones o apóstrofes.'
  }

  if (!PATRON_EMAIL.test(email) || email.length > 254) {
    errores.email = 'Ingresá un email válido.'
  }

  return errores
}

function Perfil() {
  const { usuario, actualizarPerfil } = useSesion()
  const { cerrarSesion } = useOutletContext<AppLayoutContext>()
  const [valores, setValores] = useState<ValoresPerfil>({
    nombre: usuario?.nombre ?? '',
    apellido: usuario?.apellido ?? '',
    email: usuario?.email ?? '',
  })
  const [campoEditando, setCampoEditando] = useState<CampoPerfil | null>(null)
  const [errores, setErrores] = useState<Partial<Record<CampoPerfil, string>>>({})
  const [guardando, setGuardando] = useState(false)
  const [notificacion, setNotificacion] = useState('')
  const [errorGuardado, setErrorGuardado] = useState('')

  if (!usuario) return null

  const iniciales = `${usuario.nombre[0] ?? ''}${usuario.apellido[0] ?? ''}`
    .toUpperCase()
  const hayCambios =
    valores.nombre.trim() !== usuario.nombre
    || valores.apellido.trim() !== usuario.apellido
    || valores.email.trim() !== usuario.email

  function editar(campo: CampoPerfil) {
    setCampoEditando(campo)
    setErrorGuardado('')
  }

  function actualizar(campo: CampoPerfil, valor: string) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }))
    setErrores((actuales) => ({ ...actuales, [campo]: undefined }))
    setErrorGuardado('')
  }

  function cancelarCambios() {
    if (!usuario) return

    setValores({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
    })
    setCampoEditando(null)
    setErrores({})
    setErrorGuardado('')
  }

  async function confirmarCambios() {
    const nuevosErrores = validarPerfil(valores)
    setErrores(nuevosErrores)

    if (Object.keys(nuevosErrores).length > 0 || !hayCambios) return

    setGuardando(true)
    setErrorGuardado('')

    try {
      await actualizarPerfil({
        nombre: valores.nombre.trim(),
        apellido: valores.apellido.trim(),
        email: valores.email.trim().toLowerCase(),
      })
      setCampoEditando(null)
      setNotificacion('Perfil actualizado correctamente.')
    } catch (error) {
      setErrorGuardado(obtenerMensajeError(error))
    } finally {
      setGuardando(false)
    }
  }

  function renderCampo(
    campo: CampoPerfil,
    etiqueta: string,
    tipo: 'text' | 'email' = 'text',
  ) {
    const editando = campoEditando === campo

    return (
      <div className="perfil__fila-campo">
        <span>{etiqueta}</span>
        <div className="perfil__campo">
          {editando ? (
            <input
              type={tipo}
              minLength={campo === 'email' ? undefined : 2}
              maxLength={campo === 'nombre' ? 20 : campo === 'apellido' ? 15 : 254}
              value={valores[campo]}
              aria-invalid={Boolean(errores[campo])}
              onChange={(event) => actualizar(campo, event.target.value)}
              autoFocus
            />
          ) : (
            <strong>{valores[campo]}</strong>
          )}
          <button
            type="button"
            aria-label={`Editar ${etiqueta.toLowerCase()}`}
            title={`Editar ${etiqueta.toLowerCase()}`}
            onClick={() => editar(campo)}
            disabled={guardando}
          >
            <IconoLapiz />
          </button>
        </div>
        {errores[campo] && <small>{errores[campo]}</small>}
      </div>
    )
  }

  return (
    <section className="perfil">
      <header className="cuenta-header">
        <span>Cuenta</span>
        <h1>Perfil</h1>
        <p>Consultá y actualizá la información de tu cuenta.</p>
      </header>

      <section className="perfil__tarjeta">
        <header className="perfil__cabecera">
          <div aria-hidden="true" className="perfil__avatar">
            {iniciales || 'S'}
          </div>
          <div>
            <h2>{usuario.nombre} {usuario.apellido}</h2>
            <p>Miembro desde {formatearFechaRegistro(usuario.fechaRegistro)}.</p>
          </div>
        </header>

        <div className="perfil__campos">
          {renderCampo('nombre', 'Nombre')}
          {renderCampo('apellido', 'Apellido')}
          {renderCampo('email', 'Email', 'email')}
        </div>

        {errorGuardado && (
          <p className="perfil__error" role="alert">{errorGuardado}</p>
        )}

        {(hayCambios || campoEditando) && (
          <div className="perfil__acciones-edicion">
            <button
              type="button"
              onClick={() => void confirmarCambios()}
              disabled={!hayCambios || guardando}
            >
              {guardando && <span className="spinner-boton" aria-hidden="true" />}
              {guardando ? 'Guardando...' : 'Confirmar cambios'}
            </button>
            <button
              type="button"
              onClick={cancelarCambios}
              disabled={guardando}
            >
              Cancelar
            </button>
          </div>
        )}

        <footer className="perfil__pie">
          <button type="button" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </footer>
      </section>

      {notificacion && (
        <Notificacion
          mensaje={notificacion}
          tipo="exito"
          onCerrar={() => setNotificacion('')}
        />
      )}
    </section>
  )
}

export default Perfil
