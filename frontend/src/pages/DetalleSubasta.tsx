import { useEffect, useRef, useState } from 'react'
import {
  useOutletContext,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { ApiError, obtenerMensajeError } from '../api/http'
import {
  obtenerPujasPorSubasta,
  obtenerPujasUsuarioEnSubasta,
  obtenerSubastaPorId,
  realizarPuja,
} from '../api/subastasApi'
import MensajeEstado from '../components/common/MensajeEstado'
import Notificacion from '../components/common/Notificacion'
import type { AppLayoutContext } from '../components/layout/AppLayout'
import { useSesion } from '../sesion/SesionContext'
import DetalleSubastaContenido from '../subastas/DetalleSubastaContenido'
import SkeletonDetalleSubasta from '../subastas/SkeletonDetalleSubasta'
import { formatearMonto, type Puja, type Subasta } from '../subastas/subasta'
import '../styles/detail.css'

type Aviso = {
  mensaje: string
  tipo: 'exito' | 'error' | 'info'
}

async function obtenerDatosSubasta(
  subastaId: number,
  usuarioId?: number,
  signal?: AbortSignal,
) {
  const misPujasPromise = usuarioId
    ? obtenerPujasUsuarioEnSubasta(subastaId, usuarioId, signal)
    : Promise.resolve<Puja[]>([])

  const [subasta, pujas, misPujas] = await Promise.all([
    obtenerSubastaPorId(subastaId, signal),
    obtenerPujasPorSubasta(subastaId, signal),
    misPujasPromise,
  ])

  return { subasta, pujas, misPujas }
}

function fechaFueExtendida(anterior: string | null, actual: string) {
  if (!anterior) return false

  return new Date(actual).getTime() > new Date(anterior).getTime()
}

function obtenerMejorPujaPropia(pujas: Puja[]) {
  return pujas.reduce(
    (mayor, puja) => Math.max(mayor, puja.monto),
    0,
  )
}

function estaLiderando(subasta: Subasta, pujasPropias: Puja[]) {
  const mejorPujaPropia = obtenerMejorPujaPropia(pujasPropias)

  return (
    subasta.estado === 'ACTIVA'
    && mejorPujaPropia > 0
    && mejorPujaPropia >= subasta.mejorPuja
  )
}

function DetalleSubasta() {
  const { id } = useParams()
  const { usuario } = useSesion()
  const { abrirAcceso } = useOutletContext<AppLayoutContext>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [subasta, setSubasta] = useState<Subasta | null>(null)
  const [pujas, setPujas] = useState<Puja[]>([])
  const [misPujas, setMisPujas] = useState<Puja[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [noEncontrada, setNoEncontrada] = useState(false)
  const [notificacion, setNotificacion] = useState<Aviso | null>(null)
  const [intento, setIntento] = useState(0)
  const fechaFinAnterior = useRef<string | null>(null)
  const liderandoAnterior = useRef(false)
  const subastaId = Number(id)
  const usuarioId = usuario?.id
  const subastaIdValido = Number.isInteger(subastaId) && subastaId > 0
  const solicitudPuja = searchParams.get('pujar') === '1'
  const esPropia = Boolean(
    usuario && subasta && subasta.vendedorId === usuario.id,
  )
  const mostrarPuja = solicitudPuja && Boolean(usuario) && !esPropia
  const miMejorPuja = obtenerMejorPujaPropia(misPujas)
  const estadoParticipacion =
    usuario
    && subasta?.estado === 'ACTIVA'
    && miMejorPuja > 0
      ? (miMejorPuja >= subasta.mejorPuja ? 'LIDERANDO' : 'SUPERADO')
      : null

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [id])

  useEffect(() => {
    if (!solicitudPuja || usuario) return

    const nuevosParametros = new URLSearchParams(searchParams)
    nuevosParametros.delete('pujar')
    setSearchParams(nuevosParametros, { replace: true })
    abrirAcceso('login')
  }, [
    abrirAcceso,
    searchParams,
    setSearchParams,
    solicitudPuja,
    usuario,
  ])

  useEffect(() => {
    if (!subastaIdValido) return

    const controller = new AbortController()

    obtenerDatosSubasta(subastaId, usuarioId, controller.signal)
      .then(({ subasta: subastaCargada, pujas: pujasCargadas, misPujas: propias }) => {
        if (controller.signal.aborted) return

        fechaFinAnterior.current = subastaCargada.fechaFin
        liderandoAnterior.current = estaLiderando(subastaCargada, propias)
        setSubasta(subastaCargada)
        setPujas(pujasCargadas)
        setMisPujas(propias)
        setNoEncontrada(false)
        setError('')
      })
      .catch((errorCarga: unknown) => {
        if (controller.signal.aborted) return

        if (errorCarga instanceof ApiError && errorCarga.status === 404) {
          setNoEncontrada(true)
          setSubasta(null)
          setPujas([])
          setMisPujas([])
        } else {
          setError(obtenerMensajeError(errorCarga))
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false)
      })

    return () => controller.abort()
  }, [intento, subastaId, subastaIdValido, usuarioId])

  useEffect(() => {
    if (!subastaIdValido) return

    const controller = new AbortController()
    const intervalo = window.setInterval(() => {
      void obtenerDatosSubasta(subastaId, usuarioId, controller.signal)
        .then(({ subasta: subastaCargada, pujas: pujasCargadas, misPujas: propias }) => {
          if (controller.signal.aborted) return

          const extendida = fechaFueExtendida(
            fechaFinAnterior.current,
            subastaCargada.fechaFin,
          )
          const liderandoAhora = estaLiderando(subastaCargada, propias)
          const fueSuperado = (
            liderandoAnterior.current
            && !liderandoAhora
            && propias.length > 0
            && subastaCargada.estado === 'ACTIVA'
          )

          fechaFinAnterior.current = subastaCargada.fechaFin
          liderandoAnterior.current = liderandoAhora
          setSubasta(subastaCargada)
          setPujas(pujasCargadas)
          setMisPujas(propias)
          setNoEncontrada(false)

          if (fueSuperado) {
            setNotificacion({
              mensaje: `Tu puja fue superada. La oferta actual es ${formatearMonto(subastaCargada.mejorPuja)}.`,
              tipo: 'info',
            })
          } else if (extendida && subastaCargada.estado === 'ACTIVA') {
            setNotificacion({
              mensaje: 'Anti-sniping activado: la subasta se extendió 2 minutos.',
              tipo: 'info',
            })
          }
        })
        .catch(() => {
          // Se conserva la última información válida si falla una actualización.
        })
    }, 2500)

    return () => {
      window.clearInterval(intervalo)
      controller.abort()
    }
  }, [subastaId, subastaIdValido, usuarioId])

  function reintentar() {
    setCargando(true)
    setError('')
    setNoEncontrada(false)
    setIntento((actual) => actual + 1)
  }

  function abrirPuja() {
    if (!usuario) {
      abrirAcceso('login')
      return
    }

    if (subasta?.vendedorId === usuario.id) {
      setNotificacion({
        mensaje: 'No podés pujar en tu propia publicación.',
        tipo: 'info',
      })
      return
    }

    const nuevosParametros = new URLSearchParams(searchParams)
    nuevosParametros.set('pujar', '1')
    setSearchParams(nuevosParametros)
  }

  function cerrarPuja() {
    const nuevosParametros = new URLSearchParams(searchParams)
    nuevosParametros.delete('pujar')
    setSearchParams(nuevosParametros, { replace: true })
  }

  async function confirmarPuja(monto: number) {
    if (!usuario) {
      abrirAcceso('login')
      throw new Error('Necesitás iniciar sesión para realizar una oferta.')
    }

    if (subasta?.vendedorId === usuario.id) {
      throw new Error('No podés pujar en tu propia publicación.')
    }

    await realizarPuja(subastaId, usuario.id, monto)
    cerrarPuja()

    let extendida = false

    try {
      const datosActualizados = await obtenerDatosSubasta(subastaId, usuario.id)
      extendida = fechaFueExtendida(
        fechaFinAnterior.current,
        datosActualizados.subasta.fechaFin,
      )

      fechaFinAnterior.current = datosActualizados.subasta.fechaFin
      liderandoAnterior.current = estaLiderando(
        datosActualizados.subasta,
        datosActualizados.misPujas,
      )
      setSubasta(datosActualizados.subasta)
      setPujas(datosActualizados.pujas)
      setMisPujas(datosActualizados.misPujas)
      setNoEncontrada(false)
    } catch {
      // El polling actualizará la sala en el próximo ciclo.
    }

    setNotificacion({
      mensaje: extendida
        ? 'Oferta aceptada. Anti-sniping activado: se agregaron 2 minutos.'
        : 'Oferta realizada correctamente.',
      tipo: 'exito',
    })
  }

  if (!subastaIdValido) {
    return (
      <MensajeEstado
        titulo="Subasta no encontrada"
        descripcion="La publicación que intentás ver no existe o ya no está disponible."
      />
    )
  }

  if (cargando) return <SkeletonDetalleSubasta />

  if (noEncontrada) {
    return (
      <MensajeEstado
        titulo="Subasta no encontrada"
        descripcion="La publicación que intentás ver no existe o ya no está disponible."
      />
    )
  }

  if (error) {
    return (
      <MensajeEstado
        titulo="No pudimos cargar la subasta"
        descripcion={error}
        accion="Reintentar"
        onAccion={reintentar}
      />
    )
  }

  if (!subasta) return null

  return (
    <>
      <DetalleSubastaContenido
        subasta={subasta}
        pujas={pujas}
        mostrarPuja={mostrarPuja}
        onAbrirPuja={abrirPuja}
        onCerrarPuja={cerrarPuja}
        onConfirmarPuja={confirmarPuja}
        esPropia={esPropia}
        estadoParticipacion={estadoParticipacion}
      />

      {notificacion && (
        <Notificacion
          mensaje={notificacion.mensaje}
          tipo={notificacion.tipo}
          onCerrar={() => setNotificacion(null)}
        />
      )}
    </>
  )
}

export default DetalleSubasta
