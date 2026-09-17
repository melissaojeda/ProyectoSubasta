import { useEffect } from 'react'
import {
  useParams,
  useSearchParams,
} from 'react-router-dom'
import MensajeEstado from '../components/common/MensajeEstado'
import DetalleSubastaContenido from '../subastas/DetalleSubastaContenido'
import {
  obtenerPujasMockPorSubasta,
  subastasMock,
} from '../subastas/subastasMock'
import '../styles/detail.css'

function DetalleSubasta() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const subastaId = Number(id)
  const mostrarPuja = searchParams.get('pujar') === '1'

  const subasta = subastasMock.find(
    (item) => item.id === subastaId,
  )

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [id])

  function abrirPuja() {
    const nuevosParametros = new URLSearchParams(searchParams)
    nuevosParametros.set('pujar', '1')
    setSearchParams(nuevosParametros)
  }

  function cerrarPuja() {
    const nuevosParametros = new URLSearchParams(searchParams)
    nuevosParametros.delete('pujar')
    setSearchParams(nuevosParametros, { replace: true })
  }

  if (!subasta) {
    return (
      <MensajeEstado
        titulo="Subasta no encontrada"
        descripcion="La publicación que intentás ver no existe en los datos actuales."
      />
    )
  }

  return (
    <DetalleSubastaContenido
      subasta={subasta}
      pujas={obtenerPujasMockPorSubasta(subasta.id)}
      mostrarPuja={mostrarPuja}
      onAbrirPuja={abrirPuja}
      onCerrarPuja={cerrarPuja}
    />
  )
}

export default DetalleSubasta
