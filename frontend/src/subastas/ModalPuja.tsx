import { useEffect, useState } from 'react'
import { obtenerMensajeError } from '../api/http'
import IconoCerrar from '../components/common/IconoCerrar'
import Notificacion from '../components/common/Notificacion'
import ContadorSubasta from './ContadorSubasta'
import {
  formatearMonto,
  obtenerPrecioActual,
  type Subasta,
} from './subasta'

type ModalPujaProps = {
  subasta: Subasta
  onCerrar: () => void
  onConfirmar: (monto: number) => Promise<void>
}

const MONTO_MAXIMO_PUJA = 99_999_999.99

function tieneHastaDosDecimales(valor: string) {
  return /^\d+(?:\.\d{1,2})?$/.test(valor)
}

function ModalPuja({ subasta, onCerrar, onConfirmar }: ModalPujaProps) {
  const ofertaActual = obtenerPrecioActual(subasta)
  const ofertaMinima = subasta.cantidadPujas > 0
    ? ofertaActual + subasta.incrementoMinimo
    : subasta.precioBase
  const [monto, setMonto] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const montoNumerico = Number(monto)
  const montoValido =
    monto !== ''
    && Number.isFinite(montoNumerico)
    && montoNumerico >= ofertaMinima
    && montoNumerico <= MONTO_MAXIMO_PUJA
    && tieneHastaDosDecimales(monto)

  function obtenerErrorMonto() {
    if (monto === '') return ''
    if (!Number.isFinite(montoNumerico)) return 'Ingresá un monto válido.'
    if (!tieneHastaDosDecimales(monto)) return 'La oferta puede tener como máximo 2 decimales.'
    if (montoNumerico < ofertaMinima) return `La oferta debe ser de al menos ${formatearMonto(ofertaMinima)}.`
    if (montoNumerico > MONTO_MAXIMO_PUJA) return `La oferta no puede superar ${formatearMonto(MONTO_MAXIMO_PUJA)}.`

    return ''
  }

  const errorMonto = obtenerErrorMonto()

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function cerrarConEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !enviando) {
        onCerrar()
      }
    }

    window.addEventListener('keydown', cerrarConEscape)

    return () => {
      document.body.style.overflow = overflowAnterior
      window.removeEventListener('keydown', cerrarConEscape)
    }
  }, [enviando, onCerrar])

  function usarOfertaMinima() {
    if (ofertaMinima > MONTO_MAXIMO_PUJA) return

    setMonto(String(ofertaMinima))
    setError('')
  }

  async function confirmarPuja() {
    if (!montoValido || enviando) return

    setEnviando(true)
    setError('')

    try {
      await onConfirmar(montoNumerico)
    } catch (errorPuja) {
      setError(obtenerMensajeError(errorPuja))
      setEnviando(false)
    }
  }

  return (
    <div className="modal-puja" onClick={enviando ? undefined : onCerrar}>
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
            disabled={enviando}
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
          <button
            type="button"
            onClick={usarOfertaMinima}
            disabled={enviando || ofertaMinima > MONTO_MAXIMO_PUJA}
          >
            Usar oferta mínima
          </button>
        </section>

        <label>
          Monto personalizado
          <input
            type="number"
            min={ofertaMinima}
            max={MONTO_MAXIMO_PUJA}
            step="0.01"
            placeholder={String(ofertaMinima)}
            value={monto}
            disabled={enviando}
            onChange={(event) => {
              setMonto(event.target.value)
              setError('')
            }}
          />
          {errorMonto && <small>{errorMonto}</small>}
          {ofertaMinima > MONTO_MAXIMO_PUJA && (
            <small>La subasta alcanzó el monto máximo permitido para nuevas pujas.</small>
          )}
        </label>

        <button
          type="button"
          className="modal-puja__confirmar"
          disabled={!montoValido || enviando}
          onClick={() => void confirmarPuja()}
        >
          {enviando && <span className="spinner-boton" aria-hidden="true" />}
          {enviando ? 'Enviando oferta...' : 'Confirmar puja'}
        </button>

        <p className="modal-puja__nota">
          Si llega una oferta durante el último minuto, se agregan
          2 minutos para que los demás puedan responder.
        </p>

        {error && (
          <Notificacion
            mensaje={error}
            tipo="error"
            onCerrar={() => setError('')}
          />
        )}
      </section>
    </div>
  )
}

export default ModalPuja
