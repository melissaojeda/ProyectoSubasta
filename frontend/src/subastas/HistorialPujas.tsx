import {
  formatearFechaHora,
  formatearMonto,
  type Puja,
} from './subasta'

type HistorialPujasProps = {
  pujas: Puja[]
}
function anonimizarNombre(nombreCompleto: string) {
    return nombreCompleto
        .split(' ')
        .filter(Boolean)
        .map((parte) => `${parte.charAt(0)}***`)
        .join(' ')
}
function HistorialPujas({ pujas }: HistorialPujasProps) {
  const mayorMonto = pujas.length > 0
    ? Math.max(...pujas.map((puja) => puja.monto))
    : 0

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
          {pujas.map((puja) => (
            <li key={puja.id}>
              <div>
                      <strong>{anonimizarNombre(puja.nombreComprador)}</strong>
                <time dateTime={puja.fechaPuja}>
                  {formatearFechaHora(puja.fechaPuja)}
                </time>
              </div>
              <span>{formatearMonto(puja.monto)}</span>
              {puja.monto === mayorMonto && <small>Oferta más alta</small>}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export default HistorialPujas
