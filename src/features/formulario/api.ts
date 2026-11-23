import { api } from '@/shared/api/cliente'

/** `TipoDeSucesoResponse` del backend: lo que el ciudadano marca como "que paso". */
export type TipoDeSuceso = {
  codigo: string
  nombre: string
}

/** Lo que se puede contestar a una pregunta del formulario. */
export type RespuestaDelTestigo = 'SI' | 'NO' | 'NO_SE'

/**
 * `PreguntaDelCasoResponse` del backend. `prioritaria` marca las que la central necesita ahora para decidir que
 * mandar: llegan primero.
 */
export type PreguntaDelCaso = {
  condicion: string
  pregunta: string
  respuesta: RespuestaDelTestigo | null
  prioritaria: boolean
}

export const formularioApi = {
  /** Los tipos de suceso del protocolo vigente. Lista vacia si la central todavia no publico ninguno. */
  tipos: (signal?: AbortSignal) => api.get<TipoDeSuceso[]>('/formulario/tipos', { signal }),

  /** Las preguntas del tipo de suceso de esa alerta, con lo ya contestado. Vacia si no se declaro un tipo. */
  preguntas: (alertaId: number, signal?: AbortSignal) =>
    api.get<PreguntaDelCaso[]>(`/alertas/${alertaId}/preguntas`, { signal }),

  /** Se aceptan mientras el incidente siga abierto y ninguna unidad haya llegado al lugar. */
  responder: (alertaId: number, condicion: string, valor: RespuestaDelTestigo) =>
    api.post<unknown>(`/alertas/${alertaId}/respuestas`, { respuestas: [{ condicion, valor }] }),
}
