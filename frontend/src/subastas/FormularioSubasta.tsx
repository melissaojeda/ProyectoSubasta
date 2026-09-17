import {
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import { categoriasMock } from './subastasMock'

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

function urlValida(valor: string) {
  try {
    const url = new URL(valor)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function validarFormulario(
  valores: FormularioValores,
): ErroresFormulario {
  const errores: ErroresFormulario = {}

  if (!valores.titulo.trim()) {
    errores.titulo = 'Ingresá un título.'
  }

  if (!valores.descripcion.trim()) {
    errores.descripcion = 'Ingresá una descripción.'
  }

  if (!valores.urlImagen.trim()) {
    errores.urlImagen = 'Ingresá una URL de imagen.'
  } else if (!urlValida(valores.urlImagen)) {
    errores.urlImagen = 'Ingresá una URL válida.'
  }

  if (!valores.categoriaId) {
    errores.categoriaId = 'Seleccioná una categoría.'
  }

  if (
    valores.precioBase === ''
    || Number(valores.precioBase) <= 0
  ) {
    errores.precioBase = 'El precio base debe ser mayor a cero.'
  }

  if (
    valores.incrementoMinimo === ''
    || Number(valores.incrementoMinimo) <= 0
  ) {
    errores.incrementoMinimo =
      'El incremento mínimo debe ser mayor a cero.'
  }

  if (!valores.fechaInicio) {
    errores.fechaInicio = 'Indicá la fecha de inicio.'
  }

  if (!valores.fechaFin) {
    errores.fechaFin = 'Indicá la fecha de finalización.'
  }

  if (
    valores.fechaInicio
    && valores.fechaFin
    && new Date(valores.fechaFin) <= new Date(valores.fechaInicio)
  ) {
    errores.fechaFin =
      'La finalización debe ser posterior al inicio.'
  }

  return errores
}

function FormularioSubasta() {
  const [valores, setValores] = useState(VALORES_INICIALES)
  const [errores, setErrores] = useState<ErroresFormulario>({})
  const [validado, setValidado] = useState(false)

  const cantidadErrores = useMemo(
    () => Object.keys(errores).length,
    [errores],
  )

  function actualizar(
    campo: keyof FormularioValores,
    valor: string,
  ) {
    const nuevosValores = {
      ...valores,
      [campo]: valor,
    }

    setValores(nuevosValores)

    if (validado) {
      setErrores(validarFormulario(nuevosValores))
    }
  }

  function validar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setValidado(true)
    setErrores(validarFormulario(valores))
  }

  return (
    <form className="formulario-subasta" onSubmit={validar} noValidate>
      <fieldset>
        <legend>Producto</legend>

        <label>
          Título
          <input
            type="text"
            value={valores.titulo}
            onChange={(event) =>
              actualizar('titulo', event.target.value)
            }
            aria-invalid={Boolean(errores.titulo)}
          />
          {errores.titulo && <small>{errores.titulo}</small>}
        </label>

        <label>
          Categoría
          <select
            value={valores.categoriaId}
            onChange={(event) =>
              actualizar('categoriaId', event.target.value)
            }
            aria-invalid={Boolean(errores.categoriaId)}
          >
            <option value="">Seleccionar</option>
            {categoriasMock.map((categoria) => (
              <option
                key={categoria.id}
                value={categoria.id}
              >
                {categoria.nombre}
              </option>
            ))}
          </select>
          {errores.categoriaId && (
            <small>{errores.categoriaId}</small>
          )}
        </label>

        <label>
          Descripción
          <textarea
            rows={5}
            value={valores.descripcion}
            onChange={(event) =>
              actualizar('descripcion', event.target.value)
            }
            aria-invalid={Boolean(errores.descripcion)}
          />
          {errores.descripcion && (
            <small>{errores.descripcion}</small>
          )}
        </label>

        <label>
          URL de imagen
          <input
            type="url"
            placeholder="https://..."
            value={valores.urlImagen}
            onChange={(event) =>
              actualizar('urlImagen', event.target.value)
            }
            aria-invalid={Boolean(errores.urlImagen)}
          />
          {errores.urlImagen && (
            <small>{errores.urlImagen}</small>
          )}
        </label>
      </fieldset>

      <fieldset>
        <legend>Valores</legend>

        <label>
          Precio base
          <input
            type="number"
            min="0"
            inputMode="decimal"
            value={valores.precioBase}
            onChange={(event) =>
              actualizar('precioBase', event.target.value)
            }
            aria-invalid={Boolean(errores.precioBase)}
          />
          {errores.precioBase && (
            <small>{errores.precioBase}</small>
          )}
        </label>

        <label>
          Incremento mínimo
          <input
            type="number"
            min="0"
            inputMode="decimal"
            value={valores.incrementoMinimo}
            onChange={(event) =>
              actualizar('incrementoMinimo', event.target.value)
            }
            aria-invalid={Boolean(errores.incrementoMinimo)}
          />
          {errores.incrementoMinimo && (
            <small>{errores.incrementoMinimo}</small>
          )}
        </label>
      </fieldset>

      <fieldset>
        <legend>Fechas</legend>

        <label>
          Inicio
          <input
            type="datetime-local"
            value={valores.fechaInicio}
            onChange={(event) =>
              actualizar('fechaInicio', event.target.value)
            }
            aria-invalid={Boolean(errores.fechaInicio)}
          />
          {errores.fechaInicio && (
            <small>{errores.fechaInicio}</small>
          )}
        </label>

        <label>
          Finalización
          <input
            type="datetime-local"
            value={valores.fechaFin}
            onChange={(event) =>
              actualizar('fechaFin', event.target.value)
            }
            aria-invalid={Boolean(errores.fechaFin)}
          />
          {errores.fechaFin && (
            <small>{errores.fechaFin}</small>
          )}
        </label>
      </fieldset>

      <footer>
        <div>
          {validado && cantidadErrores > 0 && (
            <p>
              Revisá {cantidadErrores}{' '}
              {cantidadErrores === 1 ? 'campo' : 'campos'} antes de continuar.
            </p>
          )}

          {validado && cantidadErrores === 0 && (
            <p>
              Todo está completo y listo para publicar.
            </p>
          )}
        </div>

        <button type="submit">
          Validar publicación
        </button>
      </footer>
    </form>
  )
}

export default FormularioSubasta
