export type NavigationIconName =
  | 'inicio'
  | 'subastas'
  | 'publicar'
  | 'billetera'
  | 'actividad'
  | 'perfil'

export type NavigationItem = {
  to: string
  label: string
  icon: NavigationIconName
  end?: boolean
}

export const mainNavigationItems: NavigationItem[] = [
  { to: '/', label: 'Inicio', icon: 'inicio', end: true },
  { to: '/subastas', label: 'Subastas', icon: 'subastas' },
  { to: '/crear-subasta', label: 'Publicar', icon: 'publicar' },
  { to: '/billetera', label: 'Billetera', icon: 'billetera' },
  { to: '/actividad', label: 'Mi actividad', icon: 'actividad' },
]

export const profileNavigationItem: NavigationItem = {
  to: '/perfil',
  label: 'Perfil',
  icon: 'perfil',
}
