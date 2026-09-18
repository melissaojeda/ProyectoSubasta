import { useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import Notificacion from '../common/Notificacion'
import { useSesion } from '../../sesion/SesionContext'
import ModalAcceso, { type VistaAcceso } from './ModalAcceso'
import MobileNav from './MobileNav'
import Sidebar from './Sidebar'
import VolverArriba from './VolverArriba'

export type AppLayoutContext = {
  abrirAcceso: (vista?: VistaAcceso) => void
  cerrarSesion: () => void
}

function AppLayout() {
  const { usuario, cerrarSesion } = useSesion()
  const [vistaAcceso, setVistaAcceso] = useState<VistaAcceso | null>(null)
  const [notificacion, setNotificacion] = useState('')

  function abrirAcceso(vista: VistaAcceso = 'login') {
    setVistaAcceso(vista)
  }

  function salir() {
    cerrarSesion()
    setNotificacion('Sesión cerrada correctamente.')
  }

  return (
    <div className="app-layout">
      <Sidebar
        autenticado={Boolean(usuario)}
        onAccesoRequerido={() => abrirAcceso('login')}
      />

      <div className="app-layout__barra-acceso" aria-label="Acceso a la cuenta">
        {usuario ? (
          <div className="app-layout__usuario">
            <Link to="/perfil">Hola, {usuario.nombre}</Link>
            <button
              type="button"
              className="app-layout__salir"
              onClick={salir}
            >
              Salir
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="app-layout__ingresar"
              onClick={() => abrirAcceso('login')}
            >
              Ingresar
            </button>
            <button
              type="button"
              className="app-layout__registrarse"
              onClick={() => abrirAcceso('registro')}
            >
              Registrarse
            </button>
          </>
        )}
      </div>

      <main className="app-layout__content">
        <Outlet context={{ abrirAcceso, cerrarSesion: salir }} />
      </main>

      <MobileNav
        autenticado={Boolean(usuario)}
        onAccesoRequerido={() => abrirAcceso('login')}
      />
      <VolverArriba />

      {vistaAcceso && (
        <ModalAcceso
          vistaInicial={vistaAcceso}
          onCerrar={() => setVistaAcceso(null)}
          onExito={(mensaje) => {
            setVistaAcceso(null)
            setNotificacion(mensaje)
          }}
        />
      )}

      {notificacion && (
        <Notificacion
          mensaje={notificacion}
          tipo="exito"
          onCerrar={() => setNotificacion('')}
        />
      )}
    </div>
  )
}

export default AppLayout
