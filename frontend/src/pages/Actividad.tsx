import { useState } from 'react'
import { Link } from 'react-router-dom'
import ContadorSubasta from '../subastas/ContadorSubasta'
import {
  formatearMonto,
  obtenerEtiquetaEstado,
  obtenerPrecioActual,
} from '../subastas/subasta'
import { subastasMock } from '../subastas/subastasMock'
import '../styles/account.css'

type SeccionActividad = 'pujas' | 'publicaciones'

type Participacion = {
  subastaId: number
  estadoUsuario: string
  monto: number
}

const participaciones: Participacion[] = [
  { subastaId: 1, estadoUsuario: 'Liderando', monto: 45000 },
  { subastaId: 4, estadoUsuario: 'Ganada', monto: 15000 },
]

const publicacionesIds = [2, 3, 5]

function Actividad() {
  const [seccion, setSeccion] = useState<SeccionActividad>('pujas')

  const publicaciones = subastasMock.filter((subasta) =>
    publicacionesIds.includes(subasta.id),
  )

  return (
    <section className="actividad">
      <header className="cuenta-header">
        <span>Seguimiento</span>
        <h1>Mi actividad</h1>
        <p>
          Revisá las subastas en las que participaste y las que publicaste.
        </p>
      </header>

      <section className="actividad__resumen" aria-label="Resumen de actividad">
        <div>
          <strong>{participaciones.length}</strong>
          <span>Compras / pujas</span>
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
        <ul className="actividad__lista">
          {participaciones.map((participacion) => {
            const subasta = subastasMock.find(
              (item) => item.id === participacion.subastaId,
            )

            if (!subasta) return null

            return (
              <li key={participacion.subastaId}>
                <div>
                  <span data-actividad={participacion.estadoUsuario.toLowerCase()}>
                    {participacion.estadoUsuario}
                  </span>
                  <h2>{subasta.titulo}</h2>
                  <p>
                    Tu oferta: <strong>{formatearMonto(participacion.monto)}</strong>
                  </p>
                  {subasta.estado === 'ACTIVA' && (
                    <ContadorSubasta
                      estado={subasta.estado}
                      fechaInicio={subasta.fechaInicio}
                      fechaFin={subasta.fechaFin}
                    />
                  )}
                </div>
                <Link to={`/subastas/${subasta.id}`}>Ver subasta</Link>
              </li>
            )
          })}
        </ul>
      ) : (
        <ul className="actividad__lista">
          {publicaciones.map((subasta) => (
            <li key={subasta.id}>
              <div>
                <span data-estado={subasta.estado}>
                  {obtenerEtiquetaEstado(subasta.estado)}
                </span>
                <h2>{subasta.titulo}</h2>
                <p>
                  {subasta.cantidadPujas > 0
                    ? `${subasta.cantidadPujas} ofertas · ${formatearMonto(obtenerPrecioActual(subasta))}`
                    : `Sin ofertas · ${formatearMonto(subasta.precioBase)}`}
                </p>
              </div>
              <Link to={`/subastas/${subasta.id}`}>Ver publicación</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default Actividad
