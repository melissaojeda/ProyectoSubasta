import { useMemo, useState } from 'react'
import MensajeEstado from '../components/common/MensajeEstado'
import FiltrosSubastas from '../subastas/FiltrosSubastas'
import TarjetaSubasta from '../subastas/TarjetaSubasta'
import {
  FILTROS_INICIALES,
  filtrarSubastas,
  ordenarSubastas,
  type FiltrosSubasta,
} from '../subastas/subasta'
import {
  categoriasMock,
  subastasMock,
} from '../subastas/subastasMock'
import '../subastas/subastas.css'
import '../styles/catalog.css'

function Subastas() {
  const [filtros, setFiltros] = useState<FiltrosSubasta>(
    FILTROS_INICIALES,
  )

  const subastasVisibles = useMemo(() => {
    const filtradas = filtrarSubastas(subastasMock, filtros)
    return ordenarSubastas(filtradas, filtros.orden)
  }, [filtros])

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

      <FiltrosSubastas
        filtros={filtros}
        categorias={categoriasMock}
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
    </section>
  )
}

export default Subastas
