type MensajeEstadoProps = {
  titulo: string
  descripcion: string
  accion?: string
  onAccion?: () => void
}

function MensajeEstado({
  titulo,
  descripcion,
  accion,
  onAccion,
}: MensajeEstadoProps) {
  return (
    <section className="mensaje-estado" role="status">
      <h2>{titulo}</h2>
      <p>{descripcion}</p>

      {accion && onAccion && (
        <button type="button" onClick={onAccion}>
          {accion}
        </button>
      )}
    </section>
  )
}

export default MensajeEstado
