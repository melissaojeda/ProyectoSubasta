import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import IconoCerrar from '../common/IconoCerrar'

export type VistaAcceso = 'login' | 'registro'

type ModalAccesoProps = {
  vistaInicial: VistaAcceso
  onCerrar: () => void
}

function ModalAcceso({ vistaInicial, onCerrar }: ModalAccesoProps) {
  const [vista, setVista] = useState<VistaAcceso>(vistaInicial)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function cerrarConEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onCerrar()
    }

    window.addEventListener('keydown', cerrarConEscape)

    return () => {
      document.body.style.overflow = overflowAnterior
      window.removeEventListener('keydown', cerrarConEscape)
    }
  }, [onCerrar])

  function cambiarVista(nuevaVista: VistaAcceso) {
    setVista(nuevaVista)
    setMensaje('')
  }

  function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      setMensaje('Completá tu email y contraseña.')
      return
    }

    if (vista === 'registro' && (!nombre.trim() || !apellido.trim())) {
      setMensaje('Completá tu nombre y apellido.')
      return
    }

    setMensaje(
      vista === 'login'
        ? 'El inicio de sesión todavía no está disponible.'
        : 'El registro todavía no está disponible.',
    )
  }

  return (
    <div className="modal-acceso" onClick={onCerrar}>
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
          >
            <IconoCerrar />
          </button>
        </header>

        <div className="modal-acceso__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={vista === 'login'}
            onClick={() => cambiarVista('login')}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={vista === 'registro'}
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
                  value={nombre}
                  onChange={(event) => {
                    setNombre(event.target.value)
                    setMensaje('')
                  }}
                />
              </label>
              <label>
                Apellido
                <input
                  type="text"
                  autoComplete="family-name"
                  value={apellido}
                  onChange={(event) => {
                    setApellido(event.target.value)
                    setMensaje('')
                  }}
                />
              </label>
            </div>
          )}

          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
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
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setMensaje('')
              }}
            />
          </label>

          {mensaje && <p role="status">{mensaje}</p>}

          <button type="submit">
            {vista === 'login' ? 'Iniciar sesión' : 'Registrarse'}
          </button>
        </form>
      </section>
    </div>
  )
}

export default ModalAcceso
