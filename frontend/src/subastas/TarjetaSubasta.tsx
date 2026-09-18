import { useState, type MouseEvent } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import type { AppLayoutContext } from '../components/layout/AppLayout'
import { useSesion } from '../sesion/SesionContext'
import ContadorSubasta from './ContadorSubasta'
import {
  formatearMonto,
  obtenerEtiquetaEstado,
  obtenerEtiquetaPrecio,
  obtenerPrecioActual,
  type Subasta,
} from './subasta'

type TarjetaSubastaProps = {
  subasta: Subasta
}

function TarjetaSubasta({ subasta }: TarjetaSubastaProps) {
  const { usuario } = useSesion()
  const { abrirAcceso } = useOutletContext<AppLayoutContext>()
  const [imagenInvalida, setImagenInvalida] = useState(false)
  const admitePujas = subasta.estado === 'ACTIVA'
  const esPropia = Boolean(usuario && usuario.id === subasta.vendedorId)
  const puedePujar = admitePujas && !esPropia

  function manejarPujaRapida(event: MouseEvent<HTMLAnchorElement>) {
    if (usuario) return

    event.preventDefault()
    abrirAcceso('login')
  }

  return (
    <article className="tarjeta-subasta">
      <Link
        to={`/subastas/${subasta.id}`}
        className="tarjeta-subasta__detalle"
        aria-label={`Ver subasta ${subasta.titulo}`}
      >
        <figure>
          {!imagenInvalida && subasta.urlImagen ? (
            <img
              src={subasta.urlImagen}
              alt={subasta.titulo}
              loading="lazy"
              onError={() => setImagenInvalida(true)}
            />
          ) : (
            <div role="img" aria-label="Imagen no disponible">
              Imagen no disponible
            </div>
          )}

          <figcaption data-estado={subasta.estado}>
            {obtenerEtiquetaEstado(subasta.estado)}
          </figcaption>
        </figure>

        <section>
          <span>{subasta.nombreCategoria}</span>
          <h3>{subasta.titulo}</h3>

          <dl>
            <div>
              <dt>{obtenerEtiquetaPrecio(subasta)}</dt>
              <dd>{formatearMonto(obtenerPrecioActual(subasta))}</dd>
            </div>
            <div>
              <dt>Ofertas</dt>
              <dd>{subasta.cantidadPujas}</dd>
            </div>
          </dl>

          <footer>
            <ContadorSubasta
              estado={subasta.estado}
              fechaInicio={subasta.fechaInicio}
              fechaFin={subasta.fechaFin}
            />
          </footer>
        </section>
      </Link>

      <footer className="tarjeta-subasta__acciones">
        {puedePujar && (
          <Link
            to={`/subastas/${subasta.id}?pujar=1`}
            className="tarjeta-subasta__puja-rapida"
            onClick={manejarPujaRapida}
          >
            Puja rápida
          </Link>
        )}
        <Link
          to={`/subastas/${subasta.id}`}
          className="tarjeta-subasta__mas-info"
        >
          Más información
        </Link>
      </footer>
    </article>
  )
}

export default TarjetaSubasta
