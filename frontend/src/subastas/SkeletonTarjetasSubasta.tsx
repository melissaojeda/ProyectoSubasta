type SkeletonTarjetasSubastaProps = {
  cantidad?: number
}

function SkeletonTarjetasSubasta({
  cantidad = 3,
}: SkeletonTarjetasSubastaProps) {
  return (
    <div
      className="skeleton-subastas"
      role="status"
      aria-label="Cargando subastas"
      aria-busy="true"
    >
      {Array.from({ length: cantidad }, (_, indice) => (
        <article className="skeleton-subasta" aria-hidden="true" key={indice}>
          <div className="skeleton-bloque skeleton-subasta__imagen" />
          <div className="skeleton-subasta__contenido">
            <div className="skeleton-bloque skeleton-linea skeleton-linea--corta" />
            <div className="skeleton-bloque skeleton-linea skeleton-linea--titulo" />
            <div className="skeleton-bloque skeleton-linea" />
            <div className="skeleton-bloque skeleton-linea skeleton-linea--media" />
          </div>
        </article>
      ))}
    </div>
  )
}

export default SkeletonTarjetasSubasta
