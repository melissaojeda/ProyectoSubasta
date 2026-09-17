import { useEffect, useState } from 'react'
import type { EstadoSubasta } from './subasta'

type ContadorSubastaProps = {
  estado: EstadoSubasta
  fechaInicio: string
  fechaFin: string
}

function formatearTiempo(milisegundos: number) {
  const segundosTotales = Math.max(
    0,
    Math.floor(milisegundos / 1000),
  )
  const dias = Math.floor(segundosTotales / 86400)
  const horas = Math.floor((segundosTotales % 86400) / 3600)
  const minutos = Math.floor((segundosTotales % 3600) / 60)
  const segundos = segundosTotales % 60

  if (dias > 0) return `${dias}d ${horas}h ${minutos}m`
  if (horas > 0) return `${horas}h ${minutos}m ${segundos}s`

  return `${minutos}m ${segundos}s`
}

function ContadorSubasta({
  estado,
  fechaInicio,
  fechaFin,
}: ContadorSubastaProps) {
  const [ahora, setAhora] = useState(() => Date.now())

  useEffect(() => {
    if (estado === 'FINALIZADA' || estado === 'DESIERTA') {
      return
    }

    const intervalo = window.setInterval(
      () => setAhora(Date.now()),
      1000,
    )

    return () => window.clearInterval(intervalo)
  }, [estado])

  if (estado === 'FINALIZADA') {
    return <span className="contador-subasta">Finalizada</span>
  }

  if (estado === 'DESIERTA') {
    return <span className="contador-subasta">Sin ofertas</span>
  }

  const fechaObjetivo =
    estado === 'PROGRAMADA' ? fechaInicio : fechaFin
  const tiempoRestante =
    new Date(fechaObjetivo).getTime() - ahora

  const esCritico =
    estado === 'ACTIVA'
    && tiempoRestante > 0
    && tiempoRestante <= 60 * 1000

  return (
    <time
      className="contador-subasta"
      dateTime={fechaObjetivo}
      data-critico={esCritico || undefined}
    >
      {estado === 'PROGRAMADA' ? 'Comienza en ' : 'Termina en '}
      {formatearTiempo(tiempoRestante)}
    </time>
  )
}

export default ContadorSubasta
