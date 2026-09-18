import { useState } from 'react'
import { Link } from 'react-router-dom'
import ContadorSubasta from './ContadorSubasta'
import HistorialPujas from './HistorialPujas'
import ModalPuja from './ModalPuja'
import {
  formatearMonto,
  obtenerEtiquetaEstado,
  obtenerEtiquetaPrecio,
  obtenerPrecioActual,
  type Puja,
  type Subasta,
} from './subasta'

type DetalleSubastaContenidoProps = {
  subasta: Subasta
  pujas: Puja[]
  mostrarPuja: boolean
  onAbrirPuja: () => void
  onCerrarPuja: () => void
  onConfirmarPuja: (monto: number) => Promise<void>
  esPropia: boolean
  estadoParticipacion: 'LIDERANDO' | 'SUPERADO' | null
}

function DetalleSubastaContenido({
  subasta,
  pujas,
  mostrarPuja,
  onAbrirPuja,
  onCerrarPuja,
  onConfirmarPuja,
  esPropia,
  estadoParticipacion,
}: DetalleSubastaContenidoProps) {
  const admitePujas = subasta.estado === 'ACTIVA' && !esPropia
  const [urlImagenInvalida, setUrlImagenInvalida] = useState<string | null>(null)
  const imagenInvalida = urlImagenInvalida === subasta.urlImagen

  return (
    <article className="detalle-subasta">
      <header>
        <Link to="/subastas">← Volver al catálogo</Link>
        <span data-estado={subasta.estado}>
          {obtenerEtiquetaEstado(subasta.estado)}
        </span>
      </header>

      <section className="detalle-subasta__principal">
        <figure>
          {!imagenInvalida && subasta.urlImagen ? (
            <img
              src={subasta.urlImagen}
              alt={subasta.titulo}
              onError={() => setUrlImagenInvalida(subasta.urlImagen)}
            />
          ) : (
            <div role="img" aria-label="Imagen no disponible">
              Imagen no disponible
            </div>
          )}
        </figure>

        <div>
          <span>{subasta.nombreCategoria}</span>
          <h1>{subasta.titulo}</h1>
          <p>{subasta.descripcion}</p>

          <dl>
            <div>
              <dt>{obtenerEtiquetaPrecio(subasta)}</dt>
              <dd>{formatearMonto(obtenerPrecioActual(subasta))}</dd>
            </div>
            <div>
              <dt>Incremento mínimo</dt>
              <dd>{formatearMonto(subasta.incrementoMinimo)}</dd>
            </div>
            <div>
              <dt>Vendedor</dt>
              <dd>{subasta.nombreVendedor}</dd>
            </div>
            <div>
              <dt>Ofertas</dt>
              <dd>{subasta.cantidadPujas}</dd>
            </div>
          </dl>

          <section className="detalle-subasta__puja">
            <div>
              <span>Oferta actual</span>
              <strong>{formatearMonto(obtenerPrecioActual(subasta))}</strong>
              {estadoParticipacion && (
                <small
                  className="detalle-subasta__estado-usuario"
                  data-estado-participacion={estadoParticipacion.toLowerCase()}
                >
                  {estadoParticipacion === 'LIDERANDO'
                    ? 'Tu estado: Liderando'
                    : 'Tu estado: Superado'}
                </small>
              )}
            </div>

            <div>
              <span>Tiempo</span>
              <ContadorSubasta
                estado={subasta.estado}
                fechaInicio={subasta.fechaInicio}
                fechaFin={subasta.fechaFin}
              />
            </div>

            <button
              type="button"
              disabled={!admitePujas}
              onClick={onAbrirPuja}
            >
              {esPropia
                ? 'Tu publicación'
                : admitePujas
                  ? 'Pujar ahora'
                  : 'Pujas cerradas'}
            </button>
          </section>
        </div>
      </section>

      <section className="detalle-subasta__historial">
        <HistorialPujas pujas={pujas} />
      </section>

      {mostrarPuja && admitePujas && (
        <ModalPuja
          subasta={subasta}
          onCerrar={onCerrarPuja}
          onConfirmar={onConfirmarPuja}
        />
      )}
    </article>
  )
}

export default DetalleSubastaContenido
