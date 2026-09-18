function SkeletonDetalleSubasta() {
  return (
    <div
      className="skeleton-detalle"
      role="status"
      aria-label="Cargando detalle de la subasta"
      aria-busy="true"
    >
      <div
        className="skeleton-bloque skeleton-detalle__imagen"
        aria-hidden="true"
      />
      <section className="skeleton-detalle__contenido" aria-hidden="true">
        <div className="skeleton-bloque skeleton-linea skeleton-linea--corta" />
        <div className="skeleton-bloque skeleton-linea skeleton-linea--titulo" />
        <div className="skeleton-bloque skeleton-linea" />
        <div className="skeleton-bloque skeleton-linea" />
        <div className="skeleton-bloque skeleton-linea skeleton-linea--media" />
        <div className="skeleton-bloque skeleton-detalle__panel" />
      </section>
    </div>
  )
}

export default SkeletonDetalleSubasta
