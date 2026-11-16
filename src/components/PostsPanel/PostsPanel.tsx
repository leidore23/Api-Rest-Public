import { usePosts } from '../../hooks/usePosts'
import type { User } from '../../types'
import { PostForm } from '../PostForm/PostForm'
import { PostList } from '../PostList/PostList'
import { EmptyState } from '../ui/EmptyState'
import { ErrorMessage } from '../ui/ErrorMessage'
import { Spinner } from '../ui/Spinner'
import styles from './PostsPanel.module.css'

interface PostsPanelProps {
  user: User
}

/**
 * Publicaciones del usuario seleccionado, con sus propios estados de carga y
 * error, independientes de los de la lista de usuarios.
 *
 * Es un componente aparte en lugar de un bloque dentro de `App` porque así el
 * hook sólo existe cuando hay un usuario elegido. Si viviera en `App` habría
 * que llamarlo siempre —las reglas de los hooks no permiten llamadas
 * condicionales— y pedir publicaciones antes de que nadie haya elegido a
 * nadie.
 */
export function PostsPanel({ user }: PostsPanelProps) {
  const { state, create } = usePosts(user.id)

  return (
    <section className={styles.panel} aria-labelledby="posts-title">
      <h2 className={styles.title} id="posts-title">
        Publicaciones de {user.name}
      </h2>

      <PostForm onSubmit={create} />

      {state.status === 'loading' ? <Spinner label="Cargando publicaciones…" /> : null}

      {state.status === 'error' ? (
        <ErrorMessage message={state.message} onRetry={state.reload} />
      ) : null}

      {state.status === 'success' ? (
        state.posts.length > 0 ? (
          <PostList posts={state.posts} />
        ) : (
          <EmptyState message="Este usuario todavía no tiene publicaciones." />
        )
      ) : null}
    </section>
  )
}
