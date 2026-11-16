import { fetchPostsByUser } from '../../api/posts'
import { useAsync } from '../../hooks/useAsync'
import type { User } from '../../types'
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
  const posts = useAsync((signal) => fetchPostsByUser(user.id, signal), [user.id])

  return (
    <section className={styles.panel} aria-labelledby="posts-title">
      <h2 className={styles.title} id="posts-title">
        Publicaciones de {user.name}
      </h2>

      {posts.status === 'loading' ? <Spinner label="Cargando publicaciones…" /> : null}

      {posts.status === 'error' ? (
        <ErrorMessage message={posts.message} onRetry={posts.reload} />
      ) : null}

      {posts.status === 'success' ? (
        posts.data.length > 0 ? (
          <PostList posts={posts.data} />
        ) : (
          <EmptyState message="Este usuario todavía no tiene publicaciones." />
        )
      ) : null}
    </section>
  )
}
