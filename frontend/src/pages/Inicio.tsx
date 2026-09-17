import { Link } from 'react-router-dom'
import TarjetaSubasta from '../subastas/TarjetaSubasta'
import {
  ordenarSubastas,
  type Subasta,
} from '../subastas/subasta'
import { subastasMock } from '../subastas/subastasMock'
import '../subastas/subastas.css'
import '../styles/home.css'

type SeccionSubastasProps = {
  titulo: string
  descripcion: string
  subastas: Subasta[]
}

function SeccionSubastas({
  titulo,
  descripcion,
  subastas,
}: SeccionSubastasProps) {
  if (subastas.length === 0) {
    return null
  }

  return (
    <section className="bloque-subastas">
      <header>
        <h2>{titulo}</h2>
        <p>{descripcion}</p>
      </header>

      <div>
        {subastas.map((subasta) => (
          <TarjetaSubasta key={subasta.id} subasta={subasta} />
        ))}
      </div>
    </section>
  )
}

function Inicio() {
  const activas = subastasMock.filter(
    (subasta) => subasta.estado === 'ACTIVA',
  )

  const destacadas = ordenarSubastas(activas, 'MAYOR_PUJA').slice(0, 1)
  const idsDestacadas = new Set(destacadas.map((subasta) => subasta.id))

  const terminanPronto = ordenarSubastas(
    activas.filter((subasta) => !idsDestacadas.has(subasta.id)),
    'TIEMPO_RESTANTE',
  ).slice(0, 2)

  const proximas = ordenarSubastas(
    subastasMock.filter((subasta) => subasta.estado === 'PROGRAMADA'),
    'TIEMPO_RESTANTE',
  ).slice(0, 2)

  return (
    <section className="pagina-inicio">
      <header>
        <span>SubastaYa</span>
        <h1>Encontrá tu próxima oportunidad</h1>
        <p>
          Explorá subastas activas, seguí las que están por terminar
          y descubrí las próximas publicaciones.
        </p>
        <Link to="/subastas">Explorar subastas</Link>
      </header>

      <SeccionSubastas
        titulo="Destacadas"
        descripcion="Subastas activas con las ofertas más altas del momento."
        subastas={destacadas}
      />

      <SeccionSubastas
        titulo="Terminan pronto"
        descripcion="Subastas activas que están más cerca de finalizar."
        subastas={terminanPronto}
      />

      <SeccionSubastas
        titulo="Próximas"
        descripcion="Publicaciones programadas para comenzar más adelante."
        subastas={proximas}
      />
    </section>
  )
}

export default Inicio
