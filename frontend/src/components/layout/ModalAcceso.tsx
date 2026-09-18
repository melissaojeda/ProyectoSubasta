import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import { obtenerMensajeError } from '../../api/http'
import { useSesion } from '../../sesion/SesionContext'
import IconoCerrar from '../common/IconoCerrar'

export type VistaAcceso = 'login' | 'registro'

type ModalAccesoProps = {
  vistaInicial: VistaAcceso
  onCerrar: () => void
  onExito: (mensaje: string) => void
}

const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function validarNombre(valor: string, campo: 'nombre' | 'apellido') {
  const limpio = valor.trim()
  const maximo = campo === 'nombre' ? 20 : 15
  const etiqueta = campo === 'nombre' ? 'nombre' : 'apellido'

  if (!limpio) return `El ${etiqueta} es obligatorio.`
  if (limpio.length > maximo) return `El ${etiqueta} no puede superar los ${maximo} caracteres.`

  return ''
}

function validarPasswordRegistro(password: string) {
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'

  return ''
}

function ModalAcceso({
  vistaInicial,
  onCerrar,
  onExito,
}: ModalAccesoProps) {
  const { iniciarSesion, registrarse } = useSesion()
  const [vista, setVista] = useState<VistaAcceso>(vistaInicial)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function cerrarConEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !enviando) onCerrar()
    }

    window.addEventListener('keydown', cerrarConEscape)

    return () => {
      document.body.style.overflow = overflowAnterior
      window.removeEventListener('keydown', cerrarConEscape)
    }
  }, [enviando, onCerrar])

  function cambiarVista(nuevaVista: VistaAcceso) {
    if (enviando) return

    setVista(nuevaVista)
    setMensaje('')
  }

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const emailLimpio = email.trim().toLowerCase()
    const nombreLimpio = nombre.trim()
    const apellidoLimpio = apellido.trim()

    if (!emailLimpio || !password) {
      setMensaje('Completá tu email y contraseña.')
      return
    }

    if (!PATRON_EMAIL.test(emailLimpio) || emailLimpio.length > 254) {
      setMensaje('Ingresá un email válido, por ejemplo nombre@dominio.com.')
      return
    }

    if (vista === 'registro') {
      const errorNombre = validarNombre(nombreLimpio, 'nombre')
      if (errorNombre) {
        setMensaje(errorNombre)
        return
      }

      if (vista === 'registro' && nombre.trim().length < 2) {
          setMensaje('El nombre debe tener al menos 2 caracteres.')
          return
      }

      if (vista === 'registro' && apellido.trim().length < 2) {
          setMensaje('El apellido debe tener al menos 2 caracteres.')
          return
      }

      const errorApellido = validarNombre(apellidoLimpio, 'apellido')
      if (errorApellido) {
        setMensaje(errorApellido)
        return
      }

      const errorPassword = validarPasswordRegistro(password)
      if (errorPassword) {
        setMensaje(errorPassword)
        return
      }
    }

    setMensaje('')
    setEnviando(true)

    try {
      if (vista === 'login') {
        await iniciarSesion(emailLimpio, password)
        setEnviando(false)
        onExito('Sesión iniciada correctamente.')
        return
      }

      await registrarse({
        nombre: nombreLimpio,
        apellido: apellidoLimpio,
        email: emailLimpio,
        password,
      })
      setEnviando(false)
      onExito('Cuenta creada. Ya iniciaste sesión.')
    } catch (error) {
      setEnviando(false)
      setMensaje(obtenerMensajeError(error))
    }
  }

  const textoBoton = enviando
    ? (vista === 'login' ? 'Ingresando...' : 'Registrando...')
    : (vista === 'login' ? 'Iniciar sesión' : 'Registrarse')

  return (
    <div
      className="modal-acceso"
      onClick={enviando ? undefined : onCerrar}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-acceso"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span>SubastaYa</span>
            <h2 id="titulo-modal-acceso">
              {vista === 'login' ? 'Iniciar sesión' : 'Registrarse'}
            </h2>
          </div>
          <button
            type="button"
            className="boton-cerrar"
            aria-label="Cerrar acceso"
            onClick={onCerrar}
            disabled={enviando}
          >
            <IconoCerrar />
          </button>
        </header>

        <div className="modal-acceso__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={vista === 'login'}
            disabled={enviando}
            onClick={() => cambiarVista('login')}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={vista === 'registro'}
            disabled={enviando}
            onClick={() => cambiarVista('registro')}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={enviar}>
          {vista === 'registro' && (
            <div className="modal-acceso__nombres">
              <label>
                Nombre
                <input
                  type="text"
                  autoComplete="given-name"
                  minLength={3}
                  maxLength={20}
                  value={nombre}
                  disabled={enviando}
                  onChange={(event) => {
                    setNombre(event.target.value)
                    setMensaje('')
                  }}
                />
                <small>Máximo 20 caracteres.</small>
              </label>
              <label>
                Apellido
                <input
                  type="text"
                  autoComplete="family-name"
                  minLength={3}
                  maxLength={15}
                  value={apellido}
                  disabled={enviando}
                  onChange={(event) => {
                    setApellido(event.target.value)
                    setMensaje('')
                  }}
                />
                <small>Máximo 15 caracteres.</small>
              </label>
            </div>
          )}

          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              maxLength={254}
              value={email}
              disabled={enviando}
              onChange={(event) => {
                setEmail(event.target.value)
                setMensaje('')
              }}
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              autoComplete={vista === 'login' ? 'current-password' : 'new-password'}
              minLength={vista === 'registro' ? 8 : undefined}
              value={password}
              disabled={enviando}
              onChange={(event) => {
                setPassword(event.target.value)
                setMensaje('')
              }}
            />
            {vista === 'registro' && (
              <small>
                Mínimo 8 caracteres.
              </small>
            )}
          </label>

          {mensaje && (
            <p className="modal-acceso__mensaje" role="alert">
              {mensaje}
            </p>
          )}

          <button type="submit" disabled={enviando}>
            {enviando && <span className="spinner-boton" aria-hidden="true" />}
            {textoBoton}
          </button>
        </form>
      </section>
    </div>
  )
}

export default ModalAcceso
