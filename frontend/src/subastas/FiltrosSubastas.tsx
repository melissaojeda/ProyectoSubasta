import { useState } from 'react'
import type {
  Categoria,
  FiltroEstado,
  FiltrosSubasta,
  OrdenSubastas,
} from './subasta'

type FiltrosSubastasProps = {
  filtros: FiltrosSubasta
  categorias: Categoria[]
  onChange: (filtros: FiltrosSubasta) => void
  onLimpiar: () => void
}

const estados: Array<{
  valor: FiltroEstado
  etiqueta: string
}> = [
  { valor: 'TODAS', etiqueta: 'Todas' },
  { valor: 'ACTIVAS', etiqueta: 'Activas' },
  { valor: 'PROXIMAS', etiqueta: 'Próximas' },
  { valor: 'FINALIZADAS', etiqueta: 'Finalizadas' },
]

function FiltrosSubastas({
  filtros,
  categorias,
  onChange,
  onLimpiar,
}: FiltrosSubastasProps) {
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  function actualizar<K extends keyof FiltrosSubasta>(
    campo: K,
    valor: FiltrosSubasta[K],
  ) {
    onChange({
      ...filtros,
      [campo]: valor,
    })
  }

  return (
    <section
      className="filtros-subastas"
      aria-label="Filtros del catálogo"
    >
      <header>
        <div>
          <label htmlFor="buscar-subasta">Buscar por título</label>
          <input
            id="buscar-subasta"
            type="search"
            placeholder="Ej. Notebook"
            value={filtros.busqueda}
            onChange={(event) =>
              actualizar('busqueda', event.target.value)
            }
          />
        </div>

        <button
          type="button"
          aria-expanded={mostrarFiltros}
          onClick={() => setMostrarFiltros((actual) => !actual)}
        >
          {mostrarFiltros ? 'Ocultar filtros' : 'Filtrar'}
        </button>
      </header>

      {mostrarFiltros && (
        <div className="filtros-subastas__panel">
          <fieldset>
            <legend>Estado</legend>
            <div>
              {estados.map((estado) => (
                <button
                  key={estado.valor}
                  type="button"
                  data-activo={
                    filtros.estado === estado.valor || undefined
                  }
                  onClick={() =>
                    actualizar('estado', estado.valor)
                  }
                >
                  {estado.etiqueta}
                </button>
              ))}
            </div>
          </fieldset>

          <section>
            <label>
              Categoría
              <select
                value={filtros.categoria}
                onChange={(event) =>
                  actualizar('categoria', event.target.value)
                }
              >
                <option value="TODAS">Todas</option>
                {categorias.map((categoria) => (
                  <option
                    key={categoria.id}
                    value={categoria.nombre}
                  >
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Precio mínimo
              <input
                type="number"
                min="0"
                inputMode="decimal"
                placeholder="$ 0"
                value={filtros.precioMinimo}
                onChange={(event) =>
                  actualizar('precioMinimo', event.target.value)
                }
              />
            </label>

            <label>
              Precio máximo
              <input
                type="number"
                min="0"
                inputMode="decimal"
                placeholder="Sin límite"
                value={filtros.precioMaximo}
                onChange={(event) =>
                  actualizar('precioMaximo', event.target.value)
                }
              />
            </label>

            <label>
              Ordenar por
              <select
                value={filtros.orden}
                onChange={(event) =>
                  actualizar(
                    'orden',
                    event.target.value as OrdenSubastas,
                  )
                }
              >
                <option value="TIEMPO_RESTANTE">
                  Menor tiempo restante
                </option>
                <option value="MAYOR_PUJA">Mayor puja</option>
              </select>
            </label>

            <button type="button" onClick={onLimpiar}>
              Limpiar filtros
            </button>
          </section>
        </div>
      )}
    </section>
  )
}

export default FiltrosSubastas
