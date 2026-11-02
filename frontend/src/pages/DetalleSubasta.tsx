
import { useEffect, useRef, useState } from 'react'
import {
    HubConnectionBuilder,
    HubConnectionState,
} from '@microsoft/signalr'
import {
    useOutletContext,
    useParams,
    useSearchParams,
} from 'react-router-dom'
import { ApiError, HUB_URL, obtenerMensajeError } from '../api/http'
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

    // Volver al inicio al cambiar de subasta.
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'auto' })
    }, [id])

    // Solicitar inicio de sesión si intenta pujar sin ingresar.
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

    // Carga inicial de la subasta.
    useEffect(() => {
        if (!subastaIdValido) return

        const controller = new AbortController()

        obtenerDatosSubasta(subastaId, usuarioId, controller.signal)
            .then(({
                subasta: subastaCargada,
                pujas: pujasCargadas,
                misPujas: propias,
            }) => {
                if (controller.signal.aborted) return

                fechaFinAnterior.current = subastaCargada.fechaFin
                liderandoAnterior.current = estaLiderando(
                    subastaCargada,
                    propias,
                )

                setSubasta(subastaCargada)
                setPujas(pujasCargadas)
                setMisPujas(propias)
                setNoEncontrada(false)
                setError('')
            })
            .catch((errorCarga: unknown) => {
                if (controller.signal.aborted) return

                if (
                    errorCarga instanceof ApiError
                    && errorCarga.status === 404
                ) {
                    setNoEncontrada(true)
                    setSubasta(null)
                    setPujas([])
                    setMisPujas([])
                } else {
                    setError(obtenerMensajeError(errorCarga))
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setCargando(false)
                }
            })

        return () => controller.abort()
    }, [intento, subastaId, subastaIdValido, usuarioId])

    // SignalR + polling de respaldo.
    useEffect(() => {
        if (!subastaIdValido) return

        const controller = new AbortController()

        let activo = true
        let conectado = false
        let iniciando = false
        let actualizando = false
        let refrescoPendiente = false
        let ultimaActualizacion = Date.now()

        let temporizadorReconexion: number | undefined

        const conexion = new HubConnectionBuilder()
            .withUrl(HUB_URL)
            .withAutomaticReconnect([0, 2000, 10000, 30000])
            .build()

        // Consultar y actualizar la información de la subasta.
        async function actualizarDatos() {
            if (!activo) return

            // Evitar consultas simultáneas innecesarias.
            if (actualizando) {
                refrescoPendiente = true
                return
            }

            actualizando = true

            try {
                const {
                    subasta: subastaCargada,
                    pujas: pujasCargadas,
                    misPujas: propias,
                } = await obtenerDatosSubasta(
                    subastaId,
                    usuarioId,
                    controller.signal,
                )

                if (!activo || controller.signal.aborted) return

                const extendida = fechaFueExtendida(
                    fechaFinAnterior.current,
                    subastaCargada.fechaFin,
                )

                const liderandoAhora = estaLiderando(
                    subastaCargada,
                    propias,
                )

                const fueSuperado = (
                    liderandoAnterior.current
                    && !liderandoAhora
                    && propias.length > 0
                    && subastaCargada.estado === 'ACTIVA'
                )

                fechaFinAnterior.current = subastaCargada.fechaFin
                liderandoAnterior.current = liderandoAhora
                ultimaActualizacion = Date.now()

                setSubasta(subastaCargada)
                setPujas(pujasCargadas)
                setMisPujas(propias)
                setNoEncontrada(false)

                if (fueSuperado) {
                    setNotificacion({
                        mensaje: `Tu puja fue superada. La oferta actual es ${formatearMonto(subastaCargada.mejorPuja)}.`,
                        tipo: 'info',
                    })
                } else if (
                    extendida
                    && subastaCargada.estado === 'ACTIVA'
                ) {
                    setNotificacion({
                        mensaje: 'La subasta se extendió 2 minutos porque hubo una oferta cerca del cierre.',
                        tipo: 'info',
                    })
                }
            } catch {
                // Se conservan los últimos datos válidos.
            } finally {
                actualizando = false

                if (refrescoPendiente && activo) {
                    refrescoPendiente = false
                    void actualizarDatos()
                }
            }
        }

        // Programar otro intento si falla la conexión.
        function programarReconexion() {
            if (
                !activo
                || temporizadorReconexion !== undefined
            ) {
                return
            }

            temporizadorReconexion = window.setTimeout(() => {
                temporizadorReconexion = undefined
                void iniciarConexion()
            }, 5000)
        }

        // Conectar con el hub.
        async function iniciarConexion() {
            if (
                !activo
                || iniciando
                || conexion.state !== HubConnectionState.Disconnected
            ) {
                return
            }

            iniciando = true

            try {
                await conexion.start()

                if (!activo) {
                    await conexion.stop()
                    return
                }

                // Unirse al grupo correspondiente a esta subasta.
                await conexion.invoke(
                    'UnirseASubasta',
                    String(subastaId),
                )

                if (!activo) {
                    await conexion.stop()
                    return
                }

                conectado = true

                // Sincronizar después de establecer la conexión.
                void actualizarDatos()
            } catch {
                conectado = false

                try {
                    await conexion.stop()
                } catch {
                    // Se mantiene disponible el polling.
                }

                if (activo) {
                    programarReconexion()
                }
            } finally {
                iniciando = false
            }
        }

        // Aviso de nueva oferta desde el backend.
        conexion.on('NuevaPujaRecibida', () => {
            if (!activo) return

            void actualizarDatos()
        })

        // Aviso de finalización desde el backend.
        conexion.on('SubastaFinalizada', () => {
            if (!activo) return

            void actualizarDatos()

            setNotificacion({
                mensaje: 'La subasta finalizó. Ya no se aceptan nuevas ofertas.',
                tipo: 'info',
            })
        })

        // Durante una desconexión se utiliza el polling.
        conexion.onreconnecting(() => {
            conectado = false
        })

        // Al reconectarse, volver a unirse al grupo.
        conexion.onreconnected(() => {
            if (!activo) return

            void conexion
                .invoke('UnirseASubasta', String(subastaId))
                .then(() => {
                    if (!activo) return

                    conectado = true
                    void actualizarDatos()
                })
                .catch(() => {
                    conectado = false

                    void conexion
                        .stop()
                        .catch(() => {
                            // El polling sigue disponible.
                        })
                        .finally(() => {
                            programarReconexion()
                        })
                })
        })

        // Si se cierra definitivamente, intentar conectar otra vez.
        conexion.onclose(() => {
            conectado = false
            programarReconexion()
        })

        // Posponer el inicio para evitar conexiones duplicadas
        // durante la comprobación de efectos de React StrictMode.
        const temporizadorInicio = window.setTimeout(() => {
            void iniciarConexion()
        }, 0)

        // Polling:
        // Desconectado: cada 2,5 segundos.
        // Conectado: comprobación aproximadamente cada 30 segundos.
        const intervalo = window.setInterval(() => {
            if (
                !conectado
                || Date.now() - ultimaActualizacion >= 30000
            ) {
                void actualizarDatos()
            }
        }, 2500)

        // Limpieza al cambiar de subasta o salir del detalle.
        return () => {
            activo = false

            window.clearTimeout(temporizadorInicio)
            window.clearInterval(intervalo)

            if (temporizadorReconexion !== undefined) {
                window.clearTimeout(temporizadorReconexion)
            }

            controller.abort()

            void conexion.stop()
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
            const datosActualizados = await obtenerDatosSubasta(
                subastaId,
                usuario.id,
            )

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
            // SignalR o el polling actualizarán los datos.
        }

        setNotificacion({
            mensaje: extendida
                ? 'Oferta aceptada. El cierre de la subasta se extendió 2 minutos.'
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

    if (cargando) {
        return <SkeletonDetalleSubasta />
    }

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
