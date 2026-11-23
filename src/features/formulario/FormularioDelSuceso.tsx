import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Text, XStack, YStack } from 'tamagui'

import { ErrorApi } from '@/shared/api/cliente'

import type { PreguntaDelCaso, RespuestaDelTestigo } from './api'
import { preguntasDeAlertaQuery, responderPreguntaMutation } from './queries'

const RESPUESTAS: { valor: RespuestaDelTestigo; texto: string }[] = [
  { valor: 'SI', texto: 'Sí' },
  { valor: 'NO', texto: 'No' },
  { valor: 'NO_SE', texto: 'No sé' },
]

/**
 * Las preguntas del tipo de suceso que el ciudadano marco (PB-30). Cada una se contesta con un toque y sale en el
 * acto. Las que la central necesita ahora para decidir que mandar llegan primero y marcadas (PB-37). Si no hay un tipo
 * declarado, o el servidor ya no acepta respuestas, la seccion no aparece: contestar nunca frena la espera.
 */
export function FormularioDelSuceso({ alertaId }: { alertaId: number }) {
  const queryClient = useQueryClient()
  const preguntas = useQuery(preguntasDeAlertaQuery(alertaId))
  const responder = useMutation(responderPreguntaMutation(queryClient))

  const yaNoSeAceptan = responder.error instanceof ErrorApi && responder.error.status === 409
  if (!preguntas.data || preguntas.data.length === 0 || yaNoSeAceptan) {
    return null
  }
  const hayUrgentes = preguntas.data.some((pregunta) => pregunta.prioritaria)

  return (
    <YStack gap={10}>
      <Text color="$textoTenue" fontSize={12} fontWeight="500">
        {hayUrgentes ? 'Necesitamos un dato más para enviar la ayuda correcta' : 'Opcional · ayuda a decidir qué enviar'}
      </Text>

      <YStack gap={18} p={16} rounded={16} borderWidth={1} borderColor="$borde" bg="$superficie">
        {preguntas.data.map((pregunta) => (
          <Pregunta
            key={pregunta.condicion}
            pregunta={pregunta}
            onResponder={(valor) => responder.mutate({ alertaId, condicion: pregunta.condicion, valor })}
          />
        ))}
      </YStack>
    </YStack>
  )
}

type PropsPregunta = {
  pregunta: PreguntaDelCaso
  onResponder: (valor: RespuestaDelTestigo) => void
}

function Pregunta({ pregunta, onResponder }: PropsPregunta) {
  return (
    <YStack gap={10}>
      <YStack gap={2}>
        {pregunta.prioritaria ? (
          <Text color="$enAtencionTexto" fontSize={12} fontWeight="600">
            Lo necesitamos ahora
          </Text>
        ) : null}
        <Text color="$texto" fontSize={16} lineHeight={22} fontWeight="600">
          {pregunta.pregunta}
        </Text>
      </YStack>
      <XStack gap={8} role="radiogroup" aria-label={pregunta.pregunta}>
        {RESPUESTAS.map((opcion) => {
          const elegida = pregunta.respuesta === opcion.valor
          return (
            <Button
              key={opcion.valor}
              flex={1}
              height={44}
              px={0}
              rounded={12}
              borderWidth={1}
              bg={elegida ? '$primario' : '$fondo'}
              borderColor={elegida ? '$primario' : '$borde'}
              pressStyle={elegida ? { bg: '$primarioPresionado', borderColor: '$primarioPresionado' } : { bg: '$borde' }}
              role="radio"
              aria-checked={elegida}
              aria-label={opcion.texto}
              onPress={() => onResponder(opcion.valor)}
            >
              <Button.Text color={elegida ? '$primarioTexto' : '$texto'} fontSize={15} fontWeight={elegida ? '600' : '500'}>
                {opcion.texto}
              </Button.Text>
            </Button>
          )
        })}
      </XStack>
    </YStack>
  )
}
