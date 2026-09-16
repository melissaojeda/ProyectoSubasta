import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import { Link } from 'react-router-dom'
import IconoCerrar from '../components/common/IconoCerrar'
import Notificacion from '../components/common/Notificacion'
import { formatearFechaHora, formatearMonto } from '../subastas/subasta'
import { subastasMock } from '../subastas/subastasMock'
import '../styles/account.css'

type BilleteraVista = {
  id: number
  usuarioId: number
  saldoTotal: number
  saldoRetenido: number
  saldoDisponible: number
}

type TipoMovimiento =
  | 'DEPOSITO'
  | 'RETENCION_PUJA'
  | 'LIBERACION_PUJA'
  | 'PAGO_SUBASTA'
  | 'INGRESO_VENTA'

type MovimientoBilletera = {
  id: number
  billeteraId: number
  tipo: TipoMovimiento
  monto: number
  fecha: string
  subastaId: number | null
}

type ModalCargaSaldoProps = {
  saldoDisponible: number
  onCerrar: () => void
  onConfirmar: (monto: number) => void
}

const billeteraInicial: BilleteraVista = {
  id: 1,
  usuarioId: 2,
  saldoTotal: 150000,
  saldoRetenido: 45000,
  saldoDisponible: 105000,
}

const ahora = Date.now()

const movimientosIniciales: MovimientoBilletera[] = [
  {
    id: 2,
    billeteraId: 1,
    tipo: 'RETENCION_PUJA',
    monto: 45000,
    fecha: new Date(ahora - 20 * 60 * 1000).toISOString(),
    subastaId: 1,
  },
  {
    id: 1,
    billeteraId: 1,
    tipo: 'DEPOSITO',
    monto: 150000,
    fecha: new Date(ahora - 2 * 60 * 60 * 1000).toISOString(),
    subastaId: null,
  },
]

function ModalCargaSaldo({
  saldoDisponible,
  onCerrar,
  onConfirmar,
}: ModalCargaSaldoProps) {
  const [monto, setMonto] = useState('')
  const [error, setError] = useState('')

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

  function confirmar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const valor = Number(monto)

    if (monto === '' || Number.isNaN(valor) || valor <= 0) {
      setError('Ingresá un monto mayor a cero.')
      return
    }

    onConfirmar(valor)
  }

  return (
    <div className="modal-carga" onClick={onCerrar}>
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
            min="1"
            inputMode="decimal"
            placeholder="Ej. 10000"
            value={monto}
            aria-invalid={Boolean(error)}
            onChange={(event) => {
              setMonto(event.target.value)
              setError('')
            }}
            autoFocus
          />
          {error && <small>{error}</small>}
        </label>

        <button type="submit">Cargar saldo</button>
      </form>
    </div>
  )
}

function obtenerDescripcionMovimiento(movimiento: MovimientoBilletera) {
  const subasta = subastasMock.find(
    (item) => item.id === movimiento.subastaId,
  )

  const titulo = subasta ? ` · ${subasta.titulo}` : ''

  if (movimiento.tipo === 'DEPOSITO') return 'Carga de saldo'
  if (movimiento.tipo === 'RETENCION_PUJA') return `Saldo retenido${titulo}`
  if (movimiento.tipo === 'LIBERACION_PUJA') return `Saldo liberado${titulo}`
  if (movimiento.tipo === 'PAGO_SUBASTA') return `Compra concretada${titulo}`

  return `Venta concretada${titulo}`
}

function obtenerPrefijoMonto(tipo: TipoMovimiento) {
  if (tipo === 'DEPOSITO' || tipo === 'INGRESO_VENTA') return '+'
  if (tipo === 'PAGO_SUBASTA') return '-'
  return ''
}

function Billetera() {
  const [billetera, setBilletera] = useState(billeteraInicial)
  const [movimientos, setMovimientos] = useState(movimientosIniciales)
  const [mostrarCarga, setMostrarCarga] = useState(false)
  const [notificacion, setNotificacion] = useState('')

  const retencionActiva = movimientos.find(
    (movimiento) => movimiento.tipo === 'RETENCION_PUJA',
  )

  function cargarSaldo(monto: number) {
    setBilletera((actual) => ({
      ...actual,
      saldoTotal: actual.saldoTotal + monto,
      saldoDisponible: actual.saldoDisponible + monto,
    }))

    setMovimientos((actuales) => [
      {
        id: Date.now(),
        billeteraId: billetera.id,
        tipo: 'DEPOSITO',
        monto,
        fecha: new Date().toISOString(),
        subastaId: null,
      },
      ...actuales,
    ])

    setMostrarCarga(false)
    setNotificacion('Saldo cargado correctamente.')
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
