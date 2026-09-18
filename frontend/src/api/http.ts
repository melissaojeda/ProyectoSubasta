const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:5113/api/v1'
).replace(/\/+$/, '')

type RespuestaError = Record<string, unknown>

export class ApiError extends Error {
  status: number

  constructor(mensaje: string, status: number) {
    super(mensaje)
    this.name = 'ApiError'
    this.status = status
  }
}

function esObjeto(valor: unknown): valor is RespuestaError {
  return typeof valor === 'object' && valor !== null
}

function extraerPrimerErrorValidacion(valor: unknown) {
  if (!esObjeto(valor) || !esObjeto(valor.errors)) return null

  for (const errores of Object.values(valor.errors)) {
    if (Array.isArray(errores)) {
      const primerMensaje = errores.find(
        (error): error is string => typeof error === 'string',
      )

      if (primerMensaje) return primerMensaje
    }
  }

  return null
}

function extraerMensajeError(datos: unknown, status: number) {
  if (esObjeto(datos)) {
    if (typeof datos.mensaje === 'string') return datos.mensaje
    if (typeof datos.error === 'string') return datos.error

    const errorValidacion = extraerPrimerErrorValidacion(datos)
    if (errorValidacion) return errorValidacion

    if (typeof datos.title === 'string') return datos.title
  }

  if (status === 404) return 'No encontramos el recurso solicitado.'
  if (status === 401) return 'No pudimos validar tus datos de acceso.'

  return 'Ocurrió un problema al procesar la solicitud.'
}

async function leerRespuesta(response: Response) {
  const texto = await response.text()

  if (!texto) return null

  try {
    return JSON.parse(texto) as unknown
  } catch {
    return texto
  }
}

export async function apiFetch<T>(
  ruta: string,
  opciones: RequestInit = {},
): Promise<T> {
  const headers = new Headers(opciones.headers)
  headers.set('Accept', 'application/json')

  if (opciones.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${ruta}`, {
      ...opciones,
      headers,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }

    throw new ApiError(
      'No pudimos conectarnos con el servicio. Verificá que esté iniciado e intentá nuevamente.',
      0,
    )
  }

  const datos = await leerRespuesta(response)

  if (!response.ok) {
    throw new ApiError(extraerMensajeError(datos, response.status), response.status)
  }

  return datos as T
}

export function obtenerMensajeError(error: unknown) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error && error.message) return error.message

  return 'Ocurrió un problema inesperado. Intentá nuevamente.'
}
