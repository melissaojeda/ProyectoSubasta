import { NavLink } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import NavigationIcon from './NavigationIcon'
import {
  mainNavigationItems,
  profileNavigationItem,
} from './navigationItems'

type SidebarProps = {
  autenticado: boolean
  onAccesoRequerido: () => void
}

function Sidebar({ autenticado, onAccesoRequerido }: SidebarProps) {
  const etiquetaPerfil = autenticado ? 'Mi perfil' : profileNavigationItem.label

  return (
    <aside className="sidebar" aria-label="Navegación principal">
      <header>
        <NavLink to="/" aria-label="Ir al inicio">
          <BrandLogo />
          <span>SubastaYa</span>
        </NavLink>
      </header>

      <nav>
        {mainNavigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={item.label}
            onClick={(event) => {
              if (item.requiereSesion && !autenticado) {
                event.preventDefault()
                onAccesoRequerido()
              }
            }}
            className={({ isActive }) =>
              `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
            }
          >
            <NavigationIcon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <footer>
        <NavLink
          to={profileNavigationItem.to}
          title={etiquetaPerfil}
          onClick={(event) => {
            if (!autenticado) {
              event.preventDefault()
              onAccesoRequerido()
            }
          }}
          className={({ isActive }) =>
            `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
          }
        >
          <NavigationIcon name={profileNavigationItem.icon} />
          <span>{etiquetaPerfil}</span>
        </NavLink>
      </footer>
    </aside>
  )
}

export default Sidebar
