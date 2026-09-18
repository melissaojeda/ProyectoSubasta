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
  requiereSesion?: boolean
}

export const mainNavigationItems: NavigationItem[] = [
  { to: '/', label: 'Inicio', icon: 'inicio', end: true },
  { to: '/subastas', label: 'Subastas', icon: 'subastas' },
  {
    to: '/crear-subasta',
    label: 'Publicar',
    icon: 'publicar',
    requiereSesion: true,
  },
  {
    to: '/billetera',
    label: 'Billetera',
    icon: 'billetera',
    requiereSesion: true,
  },
  {
    to: '/actividad',
    label: 'Mi actividad',
    icon: 'actividad',
    requiereSesion: true,
  },
]

export const profileNavigationItem: NavigationItem = {
  to: '/perfil',
  label: 'Perfil',
  icon: 'perfil',
  requiereSesion: true,
}
