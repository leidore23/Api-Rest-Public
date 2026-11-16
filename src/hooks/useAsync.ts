import { useCallback, useEffect, useRef, useState } from 'react'
import type { DependencyList } from 'react'

/**
 * Estado de una operación asíncrona, modelado como unión discriminada en lugar
 * de con banderas sueltas (`isLoading`, `error`, `data`). Con banderas son
 * representables combinaciones que no existen —cargando y con error a la vez,
 * o con datos y con error— y la interfaz acaba llena de comprobaciones
 * defensivas. Aquí cada estado lleva exactamente los datos que tiene sentido
 * que lleve, y TypeScript obliga a cubrir los tres casos.
 */
export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string }

export type AsyncResult<T> = AsyncState<T> & { reload: () => void }

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Ha ocurrido un error inesperado.'
}

/**
 * Ejecuta una tarea asíncrona y expone su estado de carga, éxito o error.
 *
 * La tarea recibe un `AbortSignal` y se cancela cuando cambian las
 * dependencias o se desmonta el componente. Esto evita el problema clásico de
 * este tipo de listas: si se elige un usuario y enseguida otro, la respuesta
 * de la primera petición puede llegar después que la de la segunda y pisar
 * datos más recientes con datos viejos.
 */
export function useAsync<T>(
  task: (signal: AbortSignal) => Promise<T>,
  deps: DependencyList,
): AsyncResult<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  // La tarea suele declararse en línea, así que cambia de identidad en cada
  // render. Guardarla en una referencia permite llamar siempre a la última
  // versión sin incluirla entre las dependencias del efecto, que de otro modo
  // se dispararía en bucle.
  const taskRef = useRef(task)
  useEffect(() => {
    taskRef.current = task
  })

  useEffect(() => {
    const controller = new AbortController()

    // Volver a 'loading' al cambiar de usuario es intencionado: sin esto se
    // seguirían viendo las publicaciones del usuario anterior mientras llega
    // la nueva respuesta.
    // oxlint-disable-next-line react/set-state-in-effect
    setState({ status: 'loading' })

    taskRef
      .current(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setState({ status: 'success', data })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState({ status: 'error', message: toMessage(error) })
      })

    return () => {
      controller.abort()
    }
    // Las dependencias las decide quien usa el hook, así que el linter no
    // puede comprobarlas estáticamente. `attempt` se añade aquí para que
    // `reload()` vuelva a disparar el efecto.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt])

  /** Vuelve a lanzar la tarea; es lo que usa el botón de reintentar. */
  const reload = useCallback(() => {
    setAttempt((previous) => previous + 1)
  }, [])

  return { ...state, reload }
}
