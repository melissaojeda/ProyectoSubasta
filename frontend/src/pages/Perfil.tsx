import { useOutletContext } from 'react-router-dom'
import type { AppLayoutContext } from '../components/layout/AppLayout'
import '../styles/account.css'

function Perfil() {
  const { abrirAcceso } = useOutletContext<AppLayoutContext>()

  return (
    <section className="perfil">
      <header className="cuenta-header">
        <span>Cuenta</span>
        <h1>Perfil</h1>
        <p>Ingresá para consultar la información de tu cuenta.</p>
      </header>

      <section className="perfil__acceso">
        <div aria-hidden="true">S</div>
        <h2>Tu cuenta de SubastaYa</h2>
        <p>
          Iniciá sesión para ver tu perfil y acceder a la información
          asociada a tu cuenta.
        </p>
        <footer>
          <button type="button" onClick={() => abrirAcceso('login')}>
            Iniciar sesión
          </button>
          <button type="button" onClick={() => abrirAcceso('registro')}>
            Registrarse
          </button>
        </footer>
      </section>
    </section>
  )
}

export default Perfil
