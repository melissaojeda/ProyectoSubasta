import FormularioSubasta from '../subastas/FormularioSubasta'
import '../styles/create-auction.css'

function CrearSubasta() {
  return (
    <section className="crear-subasta">
      <header>
        <span>Publicar</span>
        <h1>Publicar subasta</h1>
        <p>
          Completá los datos de la publicación y revisá que todo esté
          correcto antes de continuar.
        </p>
      </header>

      <FormularioSubasta />
    </section>
  )
}

export default CrearSubasta
