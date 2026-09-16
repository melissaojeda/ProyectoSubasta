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
}

function DetalleSubastaContenido({
  subasta,
  pujas,
  mostrarPuja,
  onAbrirPuja,
  onCerrarPuja,
}: DetalleSubastaContenidoProps) {
  const admitePujas = subasta.estado === 'ACTIVA'

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
          <img src={subasta.urlImagen} alt={subasta.titulo} />
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
              {admitePujas ? 'Pujar ahora' : 'Pujas cerradas'}
            </button>
          </section>
        </div>
      </section>

      <section className="detalle-subasta__historial">
        <HistorialPujas pujas={pujas} />
      </section>

      {mostrarPuja && admitePujas && (
        <ModalPuja subasta={subasta} onCerrar={onCerrarPuja} />
      )}
    </article>
  )
}

export default DetalleSubastaContenido
