import {
  HubConnectionBuilder,
  HubConnectionState,
} from '@microsoft/signalr'
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { HUB_URL } from '../api/http'

type EstadoTiempoReal = {
  revisionSubastas: number
  revisionBilleteras: number
  conectado: boolean
}

const TiempoRealContext = createContext<EstadoTiempoReal | null>(null)

export function TiempoRealProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoTiempoReal>({
    revisionSubastas: 0,
    revisionBilleteras: 0,
    conectado: false,
  })

  useEffect(() => {
    let activo = true
    let conectado = false
    let ultimaComprobacion = Date.now()
    let temporizadorReintento: number | undefined
    let temporizadorInicio: number | undefined

    const conexion = new HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .build()

    function refrescar(subastas: boolean, billeteras: boolean) {
      if (!activo) return
      setEstado((actual) => ({
        ...actual,
        revisionSubastas: actual.revisionSubastas + (subastas ? 1 : 0),
        revisionBilleteras: actual.revisionBilleteras + (billeteras ? 1 : 0),
      }))
    }

    // Todos estos eventos son posteriores a operaciones confirmadas en la BD.
    conexion.on('NuevaPujaRecibida', () => refrescar(true, true))
    conexion.on('SubastaActivada', () => refrescar(true, false))
    conexion.on('SubastaFinalizada', () => refrescar(true, true))
    conexion.on('SubastaCreada', () => refrescar(true, false))
    conexion.on('BilleteraActualizada', () => refrescar(false, true))

    function actualizarConexion(estaConectado: boolean) {
      conectado = estaConectado
      if (activo) {
        setEstado((actual) => ({ ...actual, conectado: estaConectado }))
      }
    }

    function programarReintento() {
      if (!activo || temporizadorReintento !== undefined) return
      temporizadorReintento = window.setTimeout(() => {
        temporizadorReintento = undefined
        void iniciarConexion()
      }, 5000)
    }

    async function iniciarConexion() {
      if (!activo || conexion.state !== HubConnectionState.Disconnected) return
      try {
        await conexion.start()
        if (!activo) {
          await conexion.stop()
          return
        }
        actualizarConexion(true)
        refrescar(true, true)
      } catch {
        actualizarConexion(false)
        programarReintento()
      }
    }

    conexion.onreconnecting(() => actualizarConexion(false))
    conexion.onreconnected(() => {
      actualizarConexion(true)
      refrescar(true, true)
    })
    conexion.onclose(() => {
      actualizarConexion(false)
      programarReintento()
    })

    // Polling como seguridad: 30 s con SignalR, 2,5 s sin conexion.
    const intervalo = window.setInterval(() => {
      const ahora = Date.now()
      if (!conectado || ahora - ultimaComprobacion >= 30000) {
        ultimaComprobacion = ahora
        refrescar(true, true)
      }
    }, 2500)

    // Evita conexiones innecesarias durante el chequeo de StrictMode.
    temporizadorInicio = window.setTimeout(() => void iniciarConexion(), 0)

    return () => {
      activo = false
      window.clearInterval(intervalo)
      if (temporizadorInicio !== undefined) window.clearTimeout(temporizadorInicio)
      if (temporizadorReintento !== undefined) window.clearTimeout(temporizadorReintento)
      void conexion.stop()
    }
  }, [])

  return (
    <TiempoRealContext.Provider value={estado}>
      {children}
    </TiempoRealContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTiempoReal() {
  const contexto = useContext(TiempoRealContext)
  if (!contexto) {
    throw new Error('useTiempoReal debe usarse dentro de TiempoRealProvider.')
  }
  return contexto
}
