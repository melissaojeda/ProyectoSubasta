import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { obtenerMensajeError } from '../api/http'
import { obtenerSubastas } from '../api/subastasApi'
import MensajeEstado from '../components/common/MensajeEstado'
import SkeletonTarjetasSubasta from '../subastas/SkeletonTarjetasSubasta'
import TarjetaSubasta from '../subastas/TarjetaSubasta'
import {
  ordenarSubastas,
  type Subasta,
} from '../subastas/subasta'
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
  const [subastas, setSubastas] = useState<Subasta[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    obtenerSubastas(controller.signal)
      .then((datos) => {
        setSubastas(datos)
        setCargando(false)
      })
      .catch((errorCarga: unknown) => {
        if (controller.signal.aborted) return

        setError(obtenerMensajeError(errorCarga))
        setCargando(false)
      })

    return () => controller.abort()
  }, [intento])

  function reintentar() {
    setCargando(true)
    setError('')
    setIntento((actual) => actual + 1)
  }

  const { destacadas, terminanPronto, proximas } = useMemo(() => {
    const activas = subastas.filter(
      (subasta) => subasta.estado === 'ACTIVA',
    )

    const nuevasDestacadas = ordenarSubastas(
      activas,
      'MAYOR_PUJA',
    ).slice(0, 1)
    const idsDestacadas = new Set(
      nuevasDestacadas.map((subasta) => subasta.id),
    )

    const nuevasTerminanPronto = ordenarSubastas(
      activas.filter((subasta) => !idsDestacadas.has(subasta.id)),
      'TIEMPO_RESTANTE',
    ).slice(0, 2)

    const nuevasProximas = ordenarSubastas(
      subastas.filter((subasta) => subasta.estado === 'PROGRAMADA'),
      'TIEMPO_RESTANTE',
    ).slice(0, 2)

    return {
      destacadas: nuevasDestacadas,
      terminanPronto: nuevasTerminanPronto,
      proximas: nuevasProximas,
    }
  }, [subastas])

  const haySubastasParaInicio = (
    destacadas.length > 0
    || terminanPronto.length > 0
    || proximas.length > 0
  )

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

      {cargando ? (
        <SkeletonTarjetasSubasta cantidad={3} />
      ) : error ? (
        <MensajeEstado
          titulo="No pudimos cargar las subastas"
          descripcion={error}
          accion="Reintentar"
          onAccion={reintentar}
        />
      ) : haySubastasParaInicio ? (
        <>
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
        </>
      ) : (
        <MensajeEstado
          titulo="No hay subastas activas o próximas"
          descripcion="Cuando haya nuevas publicaciones disponibles van a aparecer acá."
        />
      )}
    </section>
  )
}

export default Inicio
