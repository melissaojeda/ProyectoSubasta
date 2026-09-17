export type EstadoSubasta =
  | 'ACTIVA'
  | 'PROGRAMADA'
  | 'FINALIZADA'
  | 'DESIERTA'

export type FiltroEstado =
  | 'TODAS'
  | 'ACTIVAS'
  | 'PROXIMAS'
  | 'FINALIZADAS'

export type OrdenSubastas =
  | 'TIEMPO_RESTANTE'
  | 'MAYOR_PUJA'

export type Categoria = {
  id: number
  nombre: string
}

export type Puja = {
  id: number
  subastaId: number
  nombreComprador: string
  monto: number
  fechaPuja: string
}

export type Subasta = {
  id: number
  titulo: string
  descripcion: string
  urlImagen: string
  precioBase: number
  incrementoMinimo: number
  fechaInicio: string
  fechaFin: string
  estado: EstadoSubasta
  nombreVendedor: string
  nombreCategoria: string
  mejorPuja: number
  cantidadPujas: number
}

export type FiltrosSubasta = {
  busqueda: string
  estado: FiltroEstado
  categoria: string
  precioMinimo: string
  precioMaximo: string
  orden: OrdenSubastas
}

export const FILTROS_INICIALES: FiltrosSubasta = {
  busqueda: '',
  estado: 'TODAS',
  categoria: 'TODAS',
  precioMinimo: '',
  precioMaximo: '',
  orden: 'TIEMPO_RESTANTE',
}

export function obtenerPrecioActual(subasta: Subasta) {
  return subasta.cantidadPujas > 0 && subasta.mejorPuja > 0
    ? subasta.mejorPuja
    : subasta.precioBase
}

export function obtenerEtiquetaPrecio(subasta: Subasta) {
  return subasta.cantidadPujas > 0
    ? 'Oferta actual'
    : 'Precio base'
}

export function obtenerEtiquetaEstado(estado: EstadoSubasta) {
  if (estado === 'ACTIVA') return 'Activa'
  if (estado === 'PROGRAMADA') return 'Programada'
  if (estado === 'FINALIZADA') return 'Finalizada'
  return 'Desierta'
}

export function formatearMonto(monto: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(monto)
}

function normalizarTexto(texto: string) {
  return texto.trim().toLocaleLowerCase('es-AR')
}

function coincideEstado(
  subasta: Subasta,
  filtroEstado: FiltroEstado,
) {
  if (filtroEstado === 'TODAS') return true
  if (filtroEstado === 'ACTIVAS') return subasta.estado === 'ACTIVA'
  if (filtroEstado === 'PROXIMAS') return subasta.estado === 'PROGRAMADA'

  return (
    subasta.estado === 'FINALIZADA'
    || subasta.estado === 'DESIERTA'
  )
}

export function filtrarSubastas(
  subastas: Subasta[],
  filtros: FiltrosSubasta,
) {
  const busqueda = normalizarTexto(filtros.busqueda)
  const minimo = filtros.precioMinimo === ''
    ? null
    : Number(filtros.precioMinimo)
  const maximo = filtros.precioMaximo === ''
    ? null
    : Number(filtros.precioMaximo)

  return subastas.filter((subasta) => {
    const precioActual = obtenerPrecioActual(subasta)

    const coincideBusqueda =
      busqueda === ''
      || normalizarTexto(subasta.titulo).includes(busqueda)

    const coincideCategoria =
      filtros.categoria === 'TODAS'
      || subasta.nombreCategoria === filtros.categoria

    const superaMinimo =
      minimo === null
      || Number.isNaN(minimo)
      || precioActual >= minimo

    const respetaMaximo =
      maximo === null
      || Number.isNaN(maximo)
      || precioActual <= maximo

    return (
      coincideBusqueda
      && coincideEstado(subasta, filtros.estado)
      && coincideCategoria
      && superaMinimo
      && respetaMaximo
    )
  })
}

function prioridadEstado(subasta: Subasta) {
  if (subasta.estado === 'ACTIVA') return 0
  if (subasta.estado === 'PROGRAMADA') return 1
  return 2
}

function fechaObjetivo(subasta: Subasta) {
  return new Date(
    subasta.estado === 'PROGRAMADA'
      ? subasta.fechaInicio
      : subasta.fechaFin,
  ).getTime()
}

export function ordenarSubastas(
  subastas: Subasta[],
  orden: OrdenSubastas,
) {
  const copia = [...subastas]

  if (orden === 'MAYOR_PUJA') {
    return copia.sort(
      (a, b) => obtenerPrecioActual(b) - obtenerPrecioActual(a),
    )
  }

  return copia.sort((a, b) => {
    const prioridadA = prioridadEstado(a)
    const prioridadB = prioridadEstado(b)

    if (prioridadA !== prioridadB) {
      return prioridadA - prioridadB
    }

    if (prioridadA === 2) {
      return (
        new Date(b.fechaFin).getTime()
        - new Date(a.fechaFin).getTime()
      )
    }

    return fechaObjetivo(a) - fechaObjetivo(b)
  })
}

export function formatearFechaHora(fecha: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(fecha))
}
