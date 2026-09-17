import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import ModalAcceso, { type VistaAcceso } from './ModalAcceso'
import MobileNav from './MobileNav'
import Sidebar from './Sidebar'
import VolverArriba from './VolverArriba'

export type AppLayoutContext = {
  abrirAcceso: (vista?: VistaAcceso) => void
}

function AppLayout() {
  const [vistaAcceso, setVistaAcceso] = useState<VistaAcceso | null>(null)

  function abrirAcceso(vista: VistaAcceso = 'login') {
    setVistaAcceso(vista)
  }

  return (
    <div className="app-layout">
      <Sidebar onPerfilClick={() => abrirAcceso('login')} />

      <div className="app-layout__barra-acceso" aria-label="Acceso a la cuenta">
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
      </div>

      <main className="app-layout__content">
        <Outlet context={{ abrirAcceso }} />
      </main>

      <MobileNav onPerfilClick={() => abrirAcceso('login')} />
      <VolverArriba />

      {vistaAcceso && (
        <ModalAcceso
          vistaInicial={vistaAcceso}
          onCerrar={() => setVistaAcceso(null)}
        />
      )}
    </div>
  )
}

export default AppLayout
