import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import { obtenerMensajeError } from '../api/http'
import { obtenerCategorias, publicarSubasta } from '../api/subastasApi'
import Notificacion from '../components/common/Notificacion'
import { useSesion } from '../sesion/SesionContext'
import { formatearMonto, type Categoria } from './subasta'

type FormularioValores = {
  titulo: string
  descripcion: string
  urlImagen: string
  categoriaId: string
  precioBase: string
  incrementoMinimo: string
  fechaInicio: string
  fechaFin: string
}

type ErroresFormulario = Partial<
  Record<keyof FormularioValores, string>
>

const VALORES_INICIALES: FormularioValores = {
  titulo: '',
  descripcion: '',
  urlImagen: '',
  categoriaId: '',
  precioBase: '',
  incrementoMinimo: '',
  fechaInicio: '',
  fechaFin: '',
}

const MONTO_MINIMO_SUBASTA = 1_000
const MONTO_MAXIMO_SUBASTA = 9_999_999.99

function tieneHastaDosDecimales(valor: string) {
  return /^\d+(?:\.\d{1,2})?$/.test(valor)
}

function urlValida(valor: string) {
  try {
    const url = new URL(valor)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function aFechaLocalInput(fecha: Date) {
  const offset = fecha.getTimezoneOffset() * 60_000
  return new Date(fecha.getTime() - offset).toISOString().slice(0, 16)
}

const FECHA_MINIMA_SUBASTA = aFechaLocalInput(
  new Date(Date.now() + 60_000),
)

function validarFormulario(
  valores: FormularioValores,
): ErroresFormulario {
  const errores: ErroresFormulario = {}
  const titulo = valores.titulo.trim()
  const descripcion = valores.descripcion.trim()
  const precioBase = Number(valores.precioBase)
  const incremento = Number(valores.incrementoMinimo)
  const inicio = valores.fechaInicio ? new Date(valores.fechaInicio) : null
  const fin = valores.fechaFin ? new Date(valores.fechaFin) : null

  if (titulo.length < 5) {
    errores.titulo = 'El título debe tener al menos 5 caracteres.'
  } else if (titulo.length > 35) {
    errores.titulo = 'El título no puede superar los 35 caracteres.'
  }

  if (descripcion.length < 20) {
    errores.descripcion = 'La descripción debe tener al menos 20 caracteres.'
  } else if (descripcion.length > 200) {
    errores.descripcion = 'La descripción no puede superar los 200 caracteres.'
  }

  if (!valores.urlImagen.trim()) {
    errores.urlImagen = 'Ingresá una URL de imagen.'
  } else if (!urlValida(valores.urlImagen)) {
    errores.urlImagen = 'Ingresá una URL válida.'
  }

  if (!valores.categoriaId || Number(valores.categoriaId) <= 0) {
    errores.categoriaId = 'Seleccioná una categoría.'
  }

  if (!Number.isFinite(precioBase) || precioBase < MONTO_MINIMO_SUBASTA) {
    errores.precioBase = `El precio base debe ser de al menos ${formatearMonto(MONTO_MINIMO_SUBASTA)}.`
  } else if (precioBase > MONTO_MAXIMO_SUBASTA) {
    errores.precioBase = `El precio base no puede superar ${formatearMonto(MONTO_MAXIMO_SUBASTA)}.`
  } else if (!tieneHastaDosDecimales(valores.precioBase)) {
    errores.precioBase = 'El precio base puede tener como máximo 2 decimales.'
  }

  if (!Number.isFinite(incremento) || incremento < MONTO_MINIMO_SUBASTA) {
    errores.incrementoMinimo = `El incremento mínimo debe ser de al menos ${formatearMonto(MONTO_MINIMO_SUBASTA)}.`
  } else if (incremento > MONTO_MAXIMO_SUBASTA) {
    errores.incrementoMinimo = `El incremento mínimo no puede superar ${formatearMonto(MONTO_MAXIMO_SUBASTA)}.`
  } else if (!tieneHastaDosDecimales(valores.incrementoMinimo)) {
    errores.incrementoMinimo = 'El incremento mínimo puede tener como máximo 2 decimales.'
  }

  if (!inicio || Number.isNaN(inicio.getTime())) {
    errores.fechaInicio = 'Indicá una fecha de inicio válida.'
  } else if (inicio.getTime() <= Date.now()) {
    errores.fechaInicio = 'La fecha de inicio debe ser posterior al momento actual.'
  }

  if (!fin || Number.isNaN(fin.getTime())) {
    errores.fechaFin = 'Indicá una fecha de finalización válida.'
  } else if (
    inicio
    && !Number.isNaN(inicio.getTime())
    && fin.getTime() <= inicio.getTime()
  ) {
    errores.fechaFin = 'La finalización debe ser posterior al inicio.'
  }

  return errores
}

function FormularioSubasta() {
  const { usuario } = useSesion()
  const [valores, setValores] = useState(VALORES_INICIALES)
  const [errores, setErrores] = useState<ErroresFormulario>({})
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [errorCategorias, setErrorCategorias] = useState('')
  const [errorEnvio, setErrorEnvio] = useState('')
  const [notificacion, setNotificacion] = useState('')
  const [validado, setValidado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [imagenCargada, setImagenCargada] = useState('')
  const [imagenFallida, setImagenFallida] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    obtenerCategorias(controller.signal)
      .then(setCategorias)
      .catch((error) => {
        if (!controller.signal.aborted) {
          setErrorCategorias(obtenerMensajeError(error))
        }
      })

    return () => controller.abort()
  }, [])

  const cantidadErrores = useMemo(
    () => Object.keys(errores).length,
    [errores],
  )
  const fechaMinima = FECHA_MINIMA_SUBASTA
  const urlImagenActual = valores.urlImagen.trim()
  const puedePrevisualizarImagen = urlValida(urlImagenActual)
  const imagenValida = imagenCargada === urlImagenActual && urlImagenActual !== ''
  const imagenInvalida = imagenFallida === urlImagenActual && urlImagenActual !== ''

  function actualizar(
    campo: keyof FormularioValores,
    valor: string,
  ) {
    const nuevosValores = {
      ...valores,
      [campo]: valor,
    }

    setValores(nuevosValores)
    setErrorEnvio('')

    if (campo === 'urlImagen') {
      setImagenCargada('')
      setImagenFallida('')
    }

    if (validado) {
      setErrores(validarFormulario(nuevosValores))
    }
  }

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nuevosErrores = validarFormulario(valores)

    if (puedePrevisualizarImagen && !imagenValida) {
      nuevosErrores.urlImagen = imagenInvalida
        ? 'No se pudo cargar esa imagen. Usá una URL directa a una imagen pública.'
        : 'Esperá a que termine de comprobarse la imagen.'
    }

    setValidado(true)
    setErrores(nuevosErrores)
    setErrorEnvio('')

    if (Object.keys(nuevosErrores).length > 0 || !usuario) return

    setEnviando(true)

    try {
      await publicarSubasta({
        vendedorId: usuario.id,
        categoriaId: Number(valores.categoriaId),
        titulo: valores.titulo.trim(),
        descripcion: valores.descripcion.trim(),
        urlImagen: valores.urlImagen.trim(),
        precioBase: Number(valores.precioBase),
        incrementoMinimo: Number(valores.incrementoMinimo),
        fechaInicio: new Date(valores.fechaInicio).toISOString(),
        fechaFin: new Date(valores.fechaFin).toISOString(),
      })

      setValores(VALORES_INICIALES)
      setErrores({})
      setValidado(false)
      setImagenCargada('')
      setImagenFallida('')
      setNotificacion('Subasta publicada correctamente.')
    } catch (error) {
      setErrorEnvio(obtenerMensajeError(error))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <form className="formulario-subasta" onSubmit={enviar} noValidate>
        <fieldset disabled={enviando}>
          <legend>Producto</legend>

          <label>
            Título
            <input
              type="text"
              minLength={5}
              maxLength={35}
              value={valores.titulo}
              onChange={(event) => actualizar('titulo', event.target.value)}
              aria-invalid={Boolean(errores.titulo)}
            />
            {errores.titulo && <small>{errores.titulo}</small>}
          </label>

          <label>
            Categoría
            <select
              value={valores.categoriaId}
              onChange={(event) => actualizar('categoriaId', event.target.value)}
              aria-invalid={Boolean(errores.categoriaId || errorCategorias)}
              disabled={enviando || Boolean(errorCategorias)}
            >
              <option value="">
                {errorCategorias ? 'No se pudieron cargar' : 'Seleccionar'}
              </option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
            {errores.categoriaId && <small>{errores.categoriaId}</small>}
            {errorCategorias && <small>{errorCategorias}</small>}
          </label>

          <label>
            Descripción
            <textarea
              rows={5}
              minLength={20}
              maxLength={200}
              value={valores.descripcion}
              onChange={(event) => actualizar('descripcion', event.target.value)}
              aria-invalid={Boolean(errores.descripcion)}
            />
            <span className="formulario-subasta__contador">
              {valores.descripcion.length}/200
            </span>
            {errores.descripcion && <small>{errores.descripcion}</small>}
          </label>

          <label>
            URL de imagen
            <input
              type="url"
              placeholder="https://sitio.com/imagen.jpg"
              value={valores.urlImagen}
              onChange={(event) => actualizar('urlImagen', event.target.value)}
              aria-invalid={Boolean(errores.urlImagen)}
            />
            <span className="formulario-subasta__ayuda">
              Usá una URL pública que muestre directamente la imagen, no la página del producto.
            </span>
            {errores.urlImagen && <small>{errores.urlImagen}</small>}

            {puedePrevisualizarImagen && (
              <div
                className="formulario-subasta__preview"
                data-estado={imagenInvalida ? 'error' : imagenValida ? 'valida' : 'cargando'}
              >
                {!imagenInvalida && (
                  <img
                    key={urlImagenActual}
                    src={urlImagenActual}
                    alt="Vista previa de la publicación"
                    onLoad={() => {
                      setImagenCargada(urlImagenActual)
                      setImagenFallida('')
                    }}
                    onError={() => {
                      setImagenCargada('')
                      setImagenFallida(urlImagenActual)
                    }}
                  />
                )}
                <span>
                  {imagenInvalida
                    ? 'No pudimos cargar esta imagen.'
                    : imagenValida
                      ? 'Imagen lista para publicar.'
                      : 'Comprobando imagen...'}
                </span>
              </div>
            )}
          </label>
        </fieldset>

        <fieldset disabled={enviando}>
          <legend>Valores</legend>

          <label>
            Precio base
            <input
              type="number"
              min={MONTO_MINIMO_SUBASTA}
              max={MONTO_MAXIMO_SUBASTA}
              step="0.01"
              inputMode="decimal"
              value={valores.precioBase}
              onChange={(event) => actualizar('precioBase', event.target.value)}
              aria-invalid={Boolean(errores.precioBase)}
            />
            {errores.precioBase && <small>{errores.precioBase}</small>}
          </label>

          <label>
            Incremento mínimo
            <input
              type="number"
              min={MONTO_MINIMO_SUBASTA}
              max={MONTO_MAXIMO_SUBASTA}
              step="0.01"
              inputMode="decimal"
              value={valores.incrementoMinimo}
              onChange={(event) => actualizar('incrementoMinimo', event.target.value)}
              aria-invalid={Boolean(errores.incrementoMinimo)}
            />
            {errores.incrementoMinimo && (
              <small>{errores.incrementoMinimo}</small>
            )}
          </label>
        </fieldset>

        <fieldset disabled={enviando}>
          <legend>Fechas</legend>

          <label>
            Inicio
            <input
              type="datetime-local"
              min={fechaMinima}
              value={valores.fechaInicio}
              onChange={(event) => actualizar('fechaInicio', event.target.value)}
              aria-invalid={Boolean(errores.fechaInicio)}
            />
            {errores.fechaInicio && <small>{errores.fechaInicio}</small>}
          </label>

          <label>
            Finalización
            <input
              type="datetime-local"
              min={valores.fechaInicio || fechaMinima}
              value={valores.fechaFin}
              onChange={(event) => actualizar('fechaFin', event.target.value)}
              aria-invalid={Boolean(errores.fechaFin)}
            />
            {errores.fechaFin && <small>{errores.fechaFin}</small>}
          </label>
        </fieldset>

        <footer>
          <div>
            {validado && cantidadErrores > 0 && (
              <p>
                Revisá {cantidadErrores}{' '}
                {cantidadErrores === 1 ? 'campo' : 'campos'} antes de publicar.
              </p>
            )}
            {errorEnvio && (
              <p className="formulario-subasta__error" role="alert">
                {errorEnvio}
              </p>
            )}
          </div>

          <button type="submit" disabled={enviando || Boolean(errorCategorias)}>
            {enviando && <span className="spinner-boton" aria-hidden="true" />}
            {enviando ? 'Publicando...' : 'Publicar subasta'}
          </button>
        </footer>
      </form>

      {notificacion && (
        <Notificacion
          mensaje={notificacion}
          tipo="exito"
          onCerrar={() => setNotificacion('')}
        />
      )}
    </>
  )
}

export default FormularioSubasta
