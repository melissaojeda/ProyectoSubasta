import { useOutletContext } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useSesion } from '../../sesion/SesionContext'
import type { AppLayoutContext } from '../layout/AppLayout'
import MensajeEstado from './MensajeEstado'

type RutaProtegidaProps = {
  children: ReactNode
}

function RutaProtegida({ children }: RutaProtegidaProps) {
  const { usuario } = useSesion()
  const { abrirAcceso } = useOutletContext<AppLayoutContext>()

  if (usuario) return children

  return (
    <MensajeEstado
      titulo="Iniciá sesión para continuar"
      descripcion="Esta sección está asociada a tu cuenta. Podés seguir explorando las subastas sin iniciar sesión."
      accion="Iniciar sesión"
      onAccion={() => abrirAcceso('login')}
    />
  )
}

export default RutaProtegida
