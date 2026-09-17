import { useEffect, useState } from 'react'

function VolverArriba() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function revisarScroll() {
      setVisible(window.scrollY > 520)
    }

    revisarScroll()
    window.addEventListener('scroll', revisarScroll, { passive: true })

    return () => window.removeEventListener('scroll', revisarScroll)
  }, [])

  function volverAlInicio() {
    const reducirMovimiento = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    window.scrollTo({
      top: 0,
      behavior: reducirMovimiento ? 'auto' : 'smooth',
    })
  }

  if (!visible) return null

  return (
    <button
      type="button"
      className="volver-arriba"
      aria-label="Volver arriba"
      onClick={volverAlInicio}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m6 14 6-6 6 6" />
      </svg>
    </button>
  )
}

export default VolverArriba
