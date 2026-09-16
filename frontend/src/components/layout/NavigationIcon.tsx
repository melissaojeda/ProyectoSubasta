import type { NavigationIconName } from './navigationItems'

type NavigationIconProps = {
  name: NavigationIconName
}

function NavigationIcon({ name }: NavigationIconProps) {
  const icon = {
    inicio: (
      <>
        <path className="nav-icon__casa" d="M3.5 10.4 12 3.8l8.5 6.6v10H3.5Z" />
        <path className="nav-icon__marco-puerta" d="M9.8 12.6h4.4v7.8H9.8Z" />
        <g className="nav-icon__puerta">
          <path d="M10.25 13.05h3.5v7.35h-3.5Z" fill="currentColor" stroke="none" />
        </g>
      </>
    ),
    subastas: (
      <>
        <g className="nav-icon__base-subasta">
          <path d="M2.2 18.3h8.8v2.2H2.2Z" fill="currentColor" stroke="none" />
          <path d="M3.2 16.5h6.8v1.8H3.2Z" fill="currentColor" stroke="none" />
        </g>
        <g className="nav-icon__martillo-subasta">
          <rect
            x="8.5"
            y="5"
            width="10"
            height="4"
            rx="1.15"
            transform="rotate(-45 13.5 7)"
            fill="currentColor"
            stroke="none"
          />
          <path d="M14.7 8.7 21.1 15.1" strokeWidth="2.1" />
          <path d="m20.4 14.4 1.8 1.8" strokeWidth="2.1" />
        </g>
      </>
    ),
    publicar: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    billetera: (
      <>
        <g className="nav-icon__billetes">
          <path d="M7 7V3.8h8.5V7" />
          <path d="M9 6V2.5h8V7" />
        </g>
        <path d="M4 7h14.5A1.5 1.5 0 0 1 20 8.5V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a3 3 0 0 1 3-3h10" />
        <path d="M16 12h4v4h-4a2 2 0 0 1 0-4Z" />
      </>
    ),
    actividad: (
      <>
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M22 19V3" />
      </>
    ),
    perfil: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </>
    ),
  }[name]

  return (
    <svg
      className="nav-icon"
      data-icon={name}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icon}
    </svg>
  )
}

export default NavigationIcon
