import { useEffect, useMemo, useState } from 'react'
import { obtenerMensajeError } from '../api/http'
import { obtenerCategorias, obtenerSubastas } from '../api/subastasApi'
import MensajeEstado from '../components/common/MensajeEstado'
import FiltrosSubastas from '../subastas/FiltrosSubastas'
import SkeletonTarjetasSubasta from '../subastas/SkeletonTarjetasSubasta'
import TarjetaSubasta from '../subastas/TarjetaSubasta'
import {
  FILTROS_INICIALES,
  filtrarSubastas,
  ordenarSubastas,
  type Categoria,
  type FiltrosSubasta,
  type Subasta,
} from '../subastas/subasta'
import '../subastas/subastas.css'
import '../styles/catalog.css'

function Subastas() {
  const [filtros, setFiltros] = useState<FiltrosSubasta>(
    FILTROS_INICIALES,
  )
  const [subastas, setSubastas] = useState<Subasta[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    Promise.all([
      obtenerSubastas(controller.signal),
      obtenerCategorias(controller.signal),
    ])
      .then(([subastasCargadas, categoriasCargadas]) => {
        setSubastas(subastasCargadas)
        setCategorias(categoriasCargadas)
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

  const subastasVisibles = useMemo(() => {
    const filtradas = filtrarSubastas(subastas, filtros)
    return ordenarSubastas(filtradas, filtros.orden)
  }, [filtros, subastas])

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES)
  }

  return (
    <section className="catalogo-subastas">
      <header>
        <span>Catálogo</span>
        <h1>Subastas</h1>
        <p>
          Buscá y filtrá publicaciones por estado, categoría y precio.
        </p>
      </header>

      {cargando ? (
        <SkeletonTarjetasSubasta cantidad={3} />
      ) : error ? (
        <MensajeEstado
          titulo="No pudimos cargar el catálogo"
          descripcion={error}
          accion="Reintentar"
          onAccion={reintentar}
        />
      ) : (
        <>
          <FiltrosSubastas
            filtros={filtros}
            categorias={categorias}
            onChange={setFiltros}
            onLimpiar={limpiarFiltros}
          />

          <p>
            {subastasVisibles.length}{' '}
            {subastasVisibles.length === 1
              ? 'subasta encontrada'
              : 'subastas encontradas'}
          </p>

          {subastasVisibles.length > 0 ? (
            <div className="catalogo-subastas__grilla">
              {subastasVisibles.map((subasta) => (
                <TarjetaSubasta key={subasta.id} subasta={subasta} />
              ))}
            </div>
          ) : (
            <MensajeEstado
              titulo="No encontramos subastas"
              descripcion="Probá cambiando la búsqueda o limpiando los filtros."
              accion="Limpiar filtros"
              onAccion={limpiarFiltros}
            />
          )}
        </>
      )}
    </section>
  )
}

export default Subastas
