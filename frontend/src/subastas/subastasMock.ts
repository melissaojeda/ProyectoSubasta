import type {
  Categoria,
  Puja,
  Subasta,
} from './subasta'

const ahora = Date.now()

function fechaDesdeAhora(milisegundos: number) {
  return new Date(ahora + milisegundos).toISOString()
}

const MINUTO = 60 * 1000
const HORA = 60 * MINUTO
const DIA = 24 * HORA

export const categoriasMock: Categoria[] = [
  { id: 1, nombre: 'Tecnología' },
  { id: 2, nombre: 'Coleccionables' },
  { id: 3, nombre: 'Indumentaria' },
  { id: 4, nombre: 'Vehículos' },
]

export const subastasMock: Subasta[] = [
  {
    id: 1,
    titulo: 'Notebook',
    descripcion: 'Subasta estándar para pruebas',
    urlImagen:
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80',
    precioBase: 30000,
    incrementoMinimo: 5000,
    fechaInicio: fechaDesdeAhora(-HORA),
    fechaFin: fechaDesdeAhora(25 * MINUTO),
    estado: 'ACTIVA',
    nombreVendedor: 'Vendedor Test',
    nombreCategoria: 'Tecnología',
    mejorPuja: 45000,
    cantidadPujas: 2,
  },
  {
    id: 2,
    titulo: 'Samsung Galaxy A17',
    descripcion: 'Subasta activa próxima a finalizar',
    urlImagen:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
    precioBase: 50000,
    incrementoMinimo: 2000,
    fechaInicio: fechaDesdeAhora(-HORA),
    fechaFin: fechaDesdeAhora(90 * 1000),
    estado: 'ACTIVA',
    nombreVendedor: 'Vendedor Test',
    nombreCategoria: 'Tecnología',
    mejorPuja: 0,
    cantidadPujas: 0,
  },
  {
    id: 3,
    titulo: 'Sandero 2023',
    descripcion: 'Inicio programado',
    urlImagen:
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80',
    precioBase: 1000000,
    incrementoMinimo: 50000,
    fechaInicio: fechaDesdeAhora(DIA),
    fechaFin: fechaDesdeAhora(2 * DIA),
    estado: 'PROGRAMADA',
    nombreVendedor: 'Vendedor Test',
    nombreCategoria: 'Vehículos',
    mejorPuja: 0,
    cantidadPujas: 0,
  },
  {
    id: 4,
    titulo: 'Moneda antigua de colección',
    descripcion: 'Subasta finalizada con oferta ganadora',
    urlImagen:
      'https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=900&q=80',
    precioBase: 10000,
    incrementoMinimo: 1000,
    fechaInicio: fechaDesdeAhora(-2 * DIA),
    fechaFin: fechaDesdeAhora(-DIA),
    estado: 'FINALIZADA',
    nombreVendedor: 'Vendedor Test',
    nombreCategoria: 'Coleccionables',
    mejorPuja: 15000,
    cantidadPujas: 1,
  },
  {
    id: 5,
    titulo: 'Cuadro Antiguo',
    descripcion: 'Subasta finalizada sin ofertas',
    urlImagen:
      'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=900&q=80',
    precioBase: 80000,
    incrementoMinimo: 5000,
    fechaInicio: fechaDesdeAhora(-2 * DIA),
    fechaFin: fechaDesdeAhora(-DIA),
    estado: 'DESIERTA',
    nombreVendedor: 'Vendedor Test',
    nombreCategoria: 'Coleccionables',
    mejorPuja: 0,
    cantidadPujas: 0,
  },
]

const pujasMock: Puja[] = [
  {
    id: 1,
    subastaId: 1,
    nombreComprador: 'Comprador Habilitado',
    monto: 40000,
    fechaPuja: fechaDesdeAhora(-40 * MINUTO),
  },
  {
    id: 2,
    subastaId: 1,
    nombreComprador: 'Comprador Lider',
    monto: 45000,
    fechaPuja: fechaDesdeAhora(-20 * MINUTO),
  },
  {
    id: 3,
    subastaId: 4,
    nombreComprador: 'Comprador Lider',
    monto: 15000,
    fechaPuja: fechaDesdeAhora(-DIA - 30 * MINUTO),
  },
]

export function obtenerPujasMockPorSubasta(subastaId: number) {
  return pujasMock
    .filter((puja) => puja.subastaId === subastaId)
    .sort(
      (a, b) =>
        new Date(b.fechaPuja).getTime()
        - new Date(a.fechaPuja).getTime(),
    )
}
