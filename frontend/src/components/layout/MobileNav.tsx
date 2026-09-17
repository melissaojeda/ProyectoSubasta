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
  onPerfilClick: () => void
}

function MobileNav({ onPerfilClick }: MobileNavProps) {
  return (
    <nav className="mobile-nav" aria-label="Navegación móvil">
      {mobileNavigationItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          aria-label={item.label}
          onClick={item.icon === 'perfil' ? onPerfilClick : undefined}
          className={({ isActive }) =>
            `mobile-nav__link${isActive ? ' mobile-nav__link--active' : ''}`
          }
        >
          <NavigationIcon name={item.icon} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default MobileNav
