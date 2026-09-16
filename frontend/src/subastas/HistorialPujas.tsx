import {
  formatearFechaHora,
  formatearMonto,
  type Puja,
} from './subasta'

type HistorialPujasProps = {
  pujas: Puja[]
}

function HistorialPujas({ pujas }: HistorialPujasProps) {
  return (
    <section className="historial-pujas">
      <header>
        <div>
          <h2>Historial de ofertas</h2>
          <p>Movimientos registrados para esta subasta.</p>
        </div>
        <strong>{pujas.length}</strong>
      </header>

      {pujas.length === 0 ? (
        <p className="historial-pujas__vacio">
          Todavía no se registraron ofertas.
        </p>
      ) : (
        <ol>
          {pujas.map((puja, indice) => (
            <li key={puja.id}>
              <div>
                <strong>{puja.nombreComprador}</strong>
                <time dateTime={puja.fechaPuja}>
                  {formatearFechaHora(puja.fechaPuja)}
                </time>
              </div>
              <span>{formatearMonto(puja.monto)}</span>
              {indice === 0 && <small>Oferta más alta</small>}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export default HistorialPujas
