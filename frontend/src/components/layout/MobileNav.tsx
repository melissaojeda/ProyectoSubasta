import { NavLink } from 'react-router-dom'
import NavigationIcon from './NavigationIcon'
import {
  mainNavigationItems,
  profileNavigationItem,
} from './navigationItems'

const mobileNavigationItems = [
  ...mainNavigationItems,
  profileNavigationItem,
]

type MobileNavProps = {
  autenticado: boolean
  onAccesoRequerido: () => void
}

function MobileNav({ autenticado, onAccesoRequerido }: MobileNavProps) {
  return (
    <nav className="mobile-nav" aria-label="Navegación móvil">
      {mobileNavigationItems.map((item) => {
        const etiqueta = item.icon === 'perfil' && autenticado
          ? 'Mi perfil'
          : item.label

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            aria-label={etiqueta}
            onClick={(event) => {
              if (item.requiereSesion && !autenticado) {
                event.preventDefault()
                onAccesoRequerido()
              }
            }}
            className={({ isActive }) =>
              `mobile-nav__link${isActive ? ' mobile-nav__link--active' : ''}`
            }
          >
            <NavigationIcon name={item.icon} />
            <span>{etiqueta}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

export default MobileNav
