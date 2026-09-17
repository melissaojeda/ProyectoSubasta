import { useEffect } from 'react'
import IconoCerrar from './IconoCerrar'

type TipoNotificacion = 'exito' | 'error' | 'info'

type NotificacionProps = {
  mensaje: string
  tipo?: TipoNotificacion
  onCerrar: () => void
}

function Notificacion({
  mensaje,
  tipo = 'info',
  onCerrar,
}: NotificacionProps) {
  useEffect(() => {
    const temporizador = window.setTimeout(onCerrar, 3600)

    return () => window.clearTimeout(temporizador)
  }, [mensaje, onCerrar])

  return (
    <div
      className="notificacion"
      data-tipo={tipo}
      role={tipo === 'error' ? 'alert' : 'status'}
      aria-live="polite"
    >
      <span>{mensaje}</span>
      <button
        type="button"
        className="boton-cerrar boton-cerrar--compacto"
        aria-label="Cerrar aviso"
        onClick={onCerrar}
      >
        <IconoCerrar />
      </button>
    </div>
  )
}

export default Notificacion
