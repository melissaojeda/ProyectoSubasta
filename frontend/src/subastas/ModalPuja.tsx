import { useEffect, useState } from 'react'
import IconoCerrar from '../components/common/IconoCerrar'
import ContadorSubasta from './ContadorSubasta'
import {
  formatearMonto,
  obtenerPrecioActual,
  type Subasta,
} from './subasta'

type ModalPujaProps = {
  subasta: Subasta
  onCerrar: () => void
}

function ModalPuja({ subasta, onCerrar }: ModalPujaProps) {
  const ofertaActual = obtenerPrecioActual(subasta)
  const ofertaMinima = ofertaActual + subasta.incrementoMinimo
  const [monto, setMonto] = useState('')
  const [aviso, setAviso] = useState('')

  const montoNumerico = Number(monto)
  const montoValido =
    monto !== ''
    && !Number.isNaN(montoNumerico)
    && montoNumerico >= ofertaMinima

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function cerrarConEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCerrar()
      }
    }

    window.addEventListener('keydown', cerrarConEscape)

    return () => {
      document.body.style.overflow = overflowAnterior
      window.removeEventListener('keydown', cerrarConEscape)
    }
  }, [onCerrar])

  function usarOfertaMinima() {
    setMonto(String(ofertaMinima))
    setAviso('')
  }

  function validarPuja() {
    if (!montoValido) {
      return
    }

    setAviso('Tu oferta es válida y está lista para enviar.')
  }

  return (
    <div className="modal-puja" onClick={onCerrar}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-puja"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span>Subasta activa</span>
            <h2 id="titulo-modal-puja">Hacer una oferta</h2>
          </div>
          <button
            type="button"
            className="boton-cerrar"
            aria-label="Cerrar ventana de puja"
            onClick={onCerrar}
          >
            <IconoCerrar />
          </button>
        </header>

        <div className="modal-puja__resumen">
          <div>
            <span>Última oferta</span>
            <strong>{formatearMonto(ofertaActual)}</strong>
          </div>
          <div>
            <span>Incremento mínimo</span>
            <strong>{formatearMonto(subasta.incrementoMinimo)}</strong>
          </div>
          <div>
            <span>Tiempo restante</span>
            <ContadorSubasta
              estado={subasta.estado}
              fechaInicio={subasta.fechaInicio}
              fechaFin={subasta.fechaFin}
            />
          </div>
        </div>

        <section className="modal-puja__oferta">
          <span>Oferta mínima permitida</span>
          <strong>{formatearMonto(ofertaMinima)}</strong>
          <button type="button" onClick={usarOfertaMinima}>
            Usar oferta mínima
          </button>
        </section>

        <label>
          Monto personalizado
          <input
            type="number"
            min={ofertaMinima}
            step={subasta.incrementoMinimo}
            placeholder={String(ofertaMinima)}
            value={monto}
            onChange={(event) => {
              setMonto(event.target.value)
              setAviso('')
            }}
          />
          {monto !== '' && !montoValido && (
            <small>
              La oferta debe ser de al menos {formatearMonto(ofertaMinima)}.
            </small>
          )}
        </label>

        <button
          type="button"
          className="modal-puja__confirmar"
          disabled={!montoValido}
          onClick={validarPuja}
        >
          Confirmar puja
        </button>

        {aviso && <p className="modal-puja__aviso">{aviso}</p>}

        <p className="modal-puja__nota">
          Si llega una oferta durante el último minuto, se agregan
          2 minutos para que los demás puedan responder.
        </p>
      </section>
    </div>
  )
}

export default ModalPuja
