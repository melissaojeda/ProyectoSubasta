import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import { Link } from 'react-router-dom'
import {
  depositarSaldo,
  obtenerBilleteraPorUsuario,
  obtenerMovimientosBilletera,
  type BilleteraVista,
  type MovimientoBilletera,
  type TipoMovimiento,
} from '../api/billeteraApi'
import { obtenerMensajeError } from '../api/http'
import IconoCerrar from '../components/common/IconoCerrar'
import MensajeEstado from '../components/common/MensajeEstado'
import Notificacion from '../components/common/Notificacion'
import { useSesion } from '../sesion/SesionContext'
import { formatearFechaHora, formatearMonto } from '../subastas/subasta'
import '../styles/account.css'

type ModalCargaSaldoProps = {
  saldoDisponible: number
  onCerrar: () => void
  onConfirmar: (monto: number) => Promise<void>
}

const MONTO_MAXIMO_DEPOSITO = 9_999_999.99

function tieneHastaDosDecimales(valor: string) {
  return /^\d+(?:\.\d{1,2})?$/.test(valor)
}

function ModalCargaSaldo({
  saldoDisponible,
  onCerrar,
  onConfirmar,
}: ModalCargaSaldoProps) {
  const [monto, setMonto] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function cerrarConEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !cargando) onCerrar()
    }

    window.addEventListener('keydown', cerrarConEscape)

    return () => {
      document.body.style.overflow = overflowAnterior
      window.removeEventListener('keydown', cerrarConEscape)
    }
  }, [cargando, onCerrar])

  async function confirmar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const valor = Number(monto)

    if (monto === '' || !Number.isFinite(valor) || valor <= 0) {
      setError('Ingresá un monto mayor a cero.')
      return
    }

    if (!tieneHastaDosDecimales(monto)) {
      setError('El monto puede tener como máximo 2 decimales.')
      return
    }

    if (valor > MONTO_MAXIMO_DEPOSITO) {
      setError(`El monto no puede superar ${formatearMonto(MONTO_MAXIMO_DEPOSITO)}.`)
      return
    }

    setCargando(true)
    setError('')

    try {
      await onConfirmar(valor)
    } catch (errorCarga) {
      setError(obtenerMensajeError(errorCarga))
      setCargando(false)
    }
  }

  return (
    <div className="modal-carga" onClick={cargando ? undefined : onCerrar}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-carga-saldo"
        onSubmit={confirmar}
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span>Cargar saldo</span>
            <h2 id="titulo-carga-saldo">Agregar dinero</h2>
          </div>
          <button
            type="button"
            className="boton-cerrar"
            aria-label="Cerrar carga de saldo"
            onClick={onCerrar}
            disabled={cargando}
          >
            <IconoCerrar />
          </button>
        </header>

        <p>
          Disponible actualmente:{' '}
          <strong>{formatearMonto(saldoDisponible)}</strong>
        </p>

        <label>
          Monto a cargar
          <input
            type="number"
            min="0.01"
            max={MONTO_MAXIMO_DEPOSITO}
            step="0.01"
            inputMode="decimal"
            placeholder="Ej. 10000"
            value={monto}
            aria-invalid={Boolean(error)}
            disabled={cargando}
            onChange={(event) => {
              setMonto(event.target.value)
              setError('')
            }}
            autoFocus
          />
          {error && <small>{error}</small>}
        </label>

        <button type="submit" disabled={cargando}>
          {cargando && <span className="spinner-boton" aria-hidden="true" />}
          {cargando ? 'Cargando saldo...' : 'Cargar saldo'}
        </button>
      </form>
    </div>
  )
}

function obtenerDescripcionMovimiento(movimiento: MovimientoBilletera) {
  if (movimiento.tipo === 'DEPOSITO') return 'Carga de saldo'
  if (movimiento.tipo === 'RETENCION_PUJA') return 'Saldo retenido por puja'
  if (movimiento.tipo === 'LIBERACION_PUJA') return 'Saldo liberado de puja'
  if (movimiento.tipo === 'PAGO_SUBASTA') return 'Compra concretada'

  return 'Ingreso por venta'
}

function obtenerPrefijoMonto(tipo: TipoMovimiento) {
  if (tipo === 'DEPOSITO' || tipo === 'INGRESO_VENTA') return '+'
  if (tipo === 'PAGO_SUBASTA') return '-'
  return ''
}

async function obtenerDatosBilletera(
  usuarioId: number,
  signal?: AbortSignal,
) {
  const billetera = await obtenerBilleteraPorUsuario(usuarioId, signal)
  const movimientos = await obtenerMovimientosBilletera(
    billetera.id,
    signal,
  )

  return { billetera, movimientos }
}

function Billetera() {
  const { usuario } = useSesion()
  const [billetera, setBilletera] = useState<BilleteraVista | null>(null)
  const [movimientos, setMovimientos] = useState<MovimientoBilletera[]>([])
  const [mostrarCarga, setMostrarCarga] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [notificacion, setNotificacion] = useState('')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    if (!usuario) return

    const controller = new AbortController()

    obtenerDatosBilletera(usuario.id, controller.signal)
      .then(({ billetera: billeteraCargada, movimientos: movimientosCargados }) => {
        if (controller.signal.aborted) return

        setBilletera(billeteraCargada)
        setMovimientos(movimientosCargados)
        setError('')
      })
      .catch((errorCarga: unknown) => {
        if (!controller.signal.aborted) {
          setError(obtenerMensajeError(errorCarga))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false)
      })

    return () => controller.abort()
  }, [intento, usuario])

  const retencionActiva = movimientos.find(
    (movimiento) => movimiento.tipo === 'RETENCION_PUJA',
  )

  function reintentar() {
    setCargando(true)
    setError('')
    setIntento((actual) => actual + 1)
  }

  async function cargarSaldo(monto: number) {
    if (!billetera || !usuario) return

    await depositarSaldo(billetera.id, monto)

    const {
      billetera: billeteraActualizada,
      movimientos: movimientosActualizados,
    } = await obtenerDatosBilletera(usuario.id)

    setBilletera(billeteraActualizada)
    setMovimientos(movimientosActualizados)
    setMostrarCarga(false)
    setNotificacion('Saldo cargado correctamente.')
  }

  if (cargando) {
    return (
      <section className="billetera">
        <header className="cuenta-header cuenta-header--simple">
          <h1>Billetera</h1>
        </header>
        <div className="billetera__skeleton skeleton-bloque" aria-hidden="true" />
      </section>
    )
  }

  if (error || !billetera) {
    return (
      <MensajeEstado
        titulo="No pudimos cargar tu billetera"
        descripcion={error || 'No encontramos una billetera asociada a tu cuenta.'}
        accion="Reintentar"
        onAccion={reintentar}
      />
    )
  }

  return (
    <section className="billetera">
      <header className="cuenta-header cuenta-header--simple">
        <h1>Billetera</h1>
      </header>

      <section className="billetera__saldo">
        <div className="billetera__total">
          <span>Saldo total</span>
          <strong>{formatearMonto(billetera.saldoTotal)}</strong>
        </div>

        <div className="billetera__resumen">
          <div data-saldo="disponible">
            <span>Disponible</span>
            <strong>{formatearMonto(billetera.saldoDisponible)}</strong>
            <small>Listo para nuevas ofertas</small>
          </div>
          <div data-saldo="retenido">
            <span>Retenido</span>
            <strong>{formatearMonto(billetera.saldoRetenido)}</strong>
            <small>Reservado en pujas activas</small>
            {retencionActiva?.subastaId && (
              <Link to={`/subastas/${retencionActiva.subastaId}`}>
                Ver subasta activa
              </Link>
            )}
          </div>
        </div>

        <button type="button" onClick={() => setMostrarCarga(true)}>
          + Cargar saldo
        </button>
      </section>

      <section className="billetera__movimientos">
        <header>
          <div>
            <h2>Movimientos recientes</h2>
            <p>Últimos cambios registrados en tu billetera.</p>
          </div>
        </header>

        {movimientos.length === 0 ? (
          <p className="billetera__vacio">Todavía no registraste movimientos.</p>
        ) : (
          <ul>
            {movimientos.map((movimiento) => (
              <li key={movimiento.id} data-tipo={movimiento.tipo}>
                <div>
                  <strong>{obtenerDescripcionMovimiento(movimiento)}</strong>
                  <div className="billetera__movimiento-meta">
                    <time dateTime={movimiento.fecha}>
                      {formatearFechaHora(movimiento.fecha)}
                    </time>
                    {movimiento.subastaId && (
                      <Link to={`/subastas/${movimiento.subastaId}`}>
                        Ver subasta
                      </Link>
                    )}
                  </div>
                </div>
                <span>
                  {obtenerPrefijoMonto(movimiento.tipo)}
                  {formatearMonto(movimiento.monto)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {mostrarCarga && (
        <ModalCargaSaldo
          saldoDisponible={billetera.saldoDisponible}
          onCerrar={() => setMostrarCarga(false)}
          onConfirmar={cargarSaldo}
        />
      )}

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

export default Billetera
