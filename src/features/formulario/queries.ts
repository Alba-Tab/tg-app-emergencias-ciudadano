import { mutationOptions, queryOptions, type QueryClient } from '@tanstack/react-query'

import { formularioApi, type PreguntaDelCaso, type RespuestaDelTestigo } from './api'

export const formularioKeys = {
  tipos: ['formulario', 'tipos'] as const,
  preguntas: (alertaId: number) => ['formulario', 'preguntas', alertaId] as const,
}

/** Cada cuanto se vuelven a pedir las preguntas: la central puede marcar una como urgente mientras se espera. */
const REFRESCO_MS = 10_000

/** Los tipos de suceso cambian solo cuando la central publica otro protocolo: alcanza con pedirlos cada tanto. */
export const tiposDeSucesoQuery = () =>
  queryOptions({
    queryKey: formularioKeys.tipos,
    queryFn: ({ signal }) => formularioApi.tipos(signal),
    staleTime: 10 * 60_000,
    retry: 1,
  })

export const preguntasDeAlertaQuery = (alertaId: number) =>
  queryOptions({
    queryKey: formularioKeys.preguntas(alertaId),
    queryFn: ({ signal }) => formularioApi.preguntas(alertaId, signal),
    refetchInterval: REFRESCO_MS,
    retry: 1,
  })

export type ResponderPregunta = {
  alertaId: number
  condicion: string
  valor: RespuestaDelTestigo
}

/**
 * Cada respuesta sale apenas se toca. La pantalla la muestra en el acto y, si el servidor no la acepta, vuelve a lo
 * que habia: contestar nunca frena la espera.
 */
export const responderPreguntaMutation = (queryClient: QueryClient) =>
  mutationOptions({
    mutationFn: ({ alertaId, condicion, valor }: ResponderPregunta) =>
      formularioApi.responder(alertaId, condicion, valor),
    onMutate: async ({ alertaId, condicion, valor }) => {
      const clave = formularioKeys.preguntas(alertaId)
      await queryClient.cancelQueries({ queryKey: clave })
      const antes = queryClient.getQueryData<PreguntaDelCaso[]>(clave)
      queryClient.setQueryData<PreguntaDelCaso[]>(clave, (preguntas) =>
        preguntas?.map((pregunta) =>
          pregunta.condicion === condicion ? { ...pregunta, respuesta: valor, prioritaria: false } : pregunta,
        ),
      )
      return { antes }
    },
    onError: (_error, { alertaId }, contexto) => {
      queryClient.setQueryData(formularioKeys.preguntas(alertaId), contexto?.antes)
    },
    onSettled: (_datos, _error, { alertaId }) =>
      queryClient.invalidateQueries({ queryKey: formularioKeys.preguntas(alertaId) }),
  })
