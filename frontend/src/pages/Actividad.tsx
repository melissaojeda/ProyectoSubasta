import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  obtenerActividadPujas,
  obtenerPujasUsuario,
  obtenerPublicacionesUsuario,
  type ActividadPuja,
} from '../api/actividadApi'
import MensajeEstado from '../components/common/MensajeEstado'
import { useSesion } from '../sesion/SesionContext'
import {
  formatearFechaHora,
  formatearMonto,
  obtenerEtiquetaEstado,
  obtenerPrecioActual,
  type Puja,
  type Subasta,
} from '../subastas/subasta'
import '../styles/account.css'
import '../styles/activity.css'

type SeccionActividad = 'pujas' | 'publicaciones'
type VistaPujas = 'por-subasta' | 'todas'

function obtenerEstadoParticipacion(actividad: ActividadPuja) {
  if (actividad.estadoSubasta === 'FINALIZADA') {
    return actividad.esGanador ? 'Ganada' : 'Finalizada'
  }

  if (actividad.estadoSubasta === 'DESIERTA') return 'Desierta'
  if (actividad.estadoSubasta === 'PROGRAMADA') return 'Programada'

  return actividad.miMejorPuja >= actividad.mejorPuja
    ? 'Liderando'
    : 'Superado'
}

function obtenerResumenPublicacion(subasta: Subasta) {
  const precio = formatearMonto(obtenerPrecioActual(subasta))
  const ofertas = `${subasta.cantidadPujas} ${subasta.cantidadPujas === 1 ? 'oferta' : 'ofertas'}`

  if (subasta.estado === 'FINALIZADA') {
    return subasta.cantidadPujas > 0
      ? `Adjudicada · Recaudación ${precio} · ${ofertas}`
      : 'Finalizada sin ofertas'
  }

  if (subasta.estado === 'DESIERTA') return 'Sin adjudicación · Sin ofertas'
  if (subasta.estado === 'PROGRAMADA') return `Precio base ${formatearMonto(subasta.precioBase)} · Todavía sin iniciar`

  return subasta.cantidadPujas > 0
    ? `Oferta actual ${precio} · ${ofertas}`
    : `Sin ofertas · Precio base ${formatearMonto(subasta.precioBase)}`
}

function Actividad() {
  const { usuario } = useSesion()
  const [seccion, setSeccion] = useState<SeccionActividad>('pujas')
  const [vistaPujas, setVistaPujas] = useState<VistaPujas>('por-subasta')
  const [participaciones, setParticipaciones] = useState<ActividadPuja[]>([])
  const [pujas, setPujas] = useState<Puja[]>([])
  const [publicaciones, setPublicaciones] = useState<Subasta[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    if (!usuario) return

    const controller = new AbortController()

    Promise.all([
      obtenerActividadPujas(usuario.id, controller.signal),
      obtenerPujasUsuario(usuario.id, controller.signal),
      obtenerPublicacionesUsuario(usuario.id, controller.signal),
    ])
      .then(([actividad, pujasUsuario, publicacionesUsuario]) => {
        setParticipaciones(actividad)
        setPujas(pujasUsuario)
        setPublicaciones(publicacionesUsuario)
        setCargando(false)
      })
      .catch((errorCarga: unknown) => {
        if (controller.signal.aborted) return

        setError(
          errorCarga instanceof Error
            ? errorCarga.message
            : 'No se pudo cargar tu actividad.',
        )
        setCargando(false)
      })

    return () => controller.abort()
  }, [intento, usuario])

  const titulosPorSubasta = useMemo(
    () => new Map(
      participaciones.map((participacion) => [
        participacion.subastaId,
        participacion.tituloSubasta,
      ]),
    ),
    [participaciones],
  )

  function reintentar() {
    setCargando(true)
    setError('')
    setIntento((actual) => actual + 1)
  }

  if (!usuario) return null

  return (
    <section className="actividad">
      <header className="cuenta-header">
        <span>Seguimiento</span>
        <h1>Mi actividad</h1>
        <p>Revisá las subastas en las que participaste y las que publicaste.</p>
      </header>

      {cargando ? (
        <MensajeEstado
          titulo="Cargando actividad"
          descripcion="Consultando tus pujas y publicaciones en la base de datos."
        />
      ) : error ? (
        <MensajeEstado
          titulo="No pudimos cargar tu actividad"
          descripcion={error}
          accion="Reintentar"
          onAccion={reintentar}
        />
      ) : (
        <>
          <section className="actividad__resumen" aria-label="Resumen de actividad">
            <div>
              <strong>{participaciones.length}</strong>
              <span>Subastas con pujas</span>
            </div>
            <div>
              <strong>{publicaciones.length}</strong>
              <span>Publicaciones</span>
            </div>
          </section>

          <div className="actividad__tabs" role="tablist" aria-label="Tipo de actividad">
            <button
              type="button"
              role="tab"
              aria-selected={seccion === 'pujas'}
              onClick={() => setSeccion('pujas')}
            >
              Mis compras / pujas
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={seccion === 'publicaciones'}
              onClick={() => setSeccion('publicaciones')}
            >
              Mis publicaciones
            </button>
          </div>

          {seccion === 'pujas' ? (
            <>
              <div className="actividad__tabs actividad__tabs--secundarias" role="tablist" aria-label="Vista de pujas">
                <button
                  type="button"
                  role="tab"
                  aria-selected={vistaPujas === 'por-subasta'}
                  onClick={() => setVistaPujas('por-subasta')}
                >
                  Por subasta
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={vistaPujas === 'todas'}
                  onClick={() => setVistaPujas('todas')}
                >
                  Todas las pujas ({pujas.length})
                </button>
              </div>

              {vistaPujas === 'por-subasta' ? (
                participaciones.length > 0 ? (
                  <ul className="actividad__lista">
                    {participaciones.map((participacion) => {
                      const estadoUsuario = obtenerEstadoParticipacion(participacion)

                      return (
                        <li key={participacion.subastaId}>
                          <div>
                            <span data-actividad={estadoUsuario.toLowerCase()}>
                              {estadoUsuario}
                            </span>
                            <h2>{participacion.tituloSubasta}</h2>
                            <p>
                              Tu mejor oferta: <strong>{formatearMonto(participacion.miMejorPuja)}</strong>
                              {' · '}Mejor oferta: <strong>{formatearMonto(participacion.mejorPuja)}</strong>
                            </p>
                          </div>
                          <Link to={`/subastas/${participacion.subastaId}`}>Ver subasta</Link>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <MensajeEstado
                    titulo="Todavía no participaste en subastas"
                    descripcion="Cuando realices una puja, aparecerá acá."
                  />
                )
              ) : pujas.length > 0 ? (
                <ul className="actividad__lista">
                  {pujas.map((puja) => (
                    <li key={puja.id}>
                      <div>
                        <span data-actividad="puja">Puja realizada</span>
                        <h2>{titulosPorSubasta.get(puja.subastaId) ?? `Subasta #${puja.subastaId}`}</h2>
                        <p>
                          Monto: <strong>{formatearMonto(puja.monto)}</strong>
                          {' · '}{formatearFechaHora(puja.fechaPuja)}
                        </p>
                      </div>
                      <Link to={`/subastas/${puja.subastaId}`}>Ver subasta</Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <MensajeEstado
                  titulo="Todavía no realizaste pujas"
                  descripcion="Cada oferta individual que realices aparecerá acá."
                />
              )}
            </>
          ) : publicaciones.length > 0 ? (
            <ul className="actividad__lista">
              {publicaciones.map((subasta) => (
                <li key={subasta.id}>
                  <div>
                    <span data-estado={subasta.estado}>
                      {obtenerEtiquetaEstado(subasta.estado)}
                    </span>
                    <h2>{subasta.titulo}</h2>
                    <p>{obtenerResumenPublicacion(subasta)}</p>
                  </div>
                  <Link to={`/subastas/${subasta.id}`}>Ver publicación</Link>
                </li>
              ))}
            </ul>
          ) : (
            <MensajeEstado
              titulo="Todavía no publicaste subastas"
              descripcion="Tus publicaciones creadas desde esta cuenta aparecerán acá."
            />
          )}
        </>
      )}
    </section>
  )
}

export default Actividad
