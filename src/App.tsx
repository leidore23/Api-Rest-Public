import { useState } from 'react'
import { fetchUsers } from './api/users'
import { useAsync } from './hooks/useAsync'
import { filterUsersByName } from './lib/filterUsersByName'
import { SearchInput } from './components/SearchInput/SearchInput'
import { UserList } from './components/UserList/UserList'
import { EmptyState } from './components/ui/EmptyState'
import { ErrorMessage } from './components/ui/ErrorMessage'
import { Spinner } from './components/ui/Spinner'
import styles from './App.module.css'

export default function App() {
  const users = useAsync((signal) => fetchUsers(signal), [])
  const [query, setQuery] = useState('')

  // Filtrar diez elementos en cada render es más barato que memorizarlo, así
  // que no hay `useMemo`: añadiría dependencias que mantener sin ganar nada.
  const visibleUsers = users.status === 'success' ? filterUsersByName(users.data, query) : []

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>Usuarios y publicaciones</h1>
        <p className={styles.subtitle}>Datos obtenidos de JSONPlaceholder</p>
      </header>

      <main>
        <h2 className={styles.sectionTitle}>Usuarios</h2>

        {users.status === 'loading' ? <Spinner label="Cargando usuarios…" /> : null}

        {users.status === 'error' ? (
          <ErrorMessage message={users.message} onRetry={users.reload} />
        ) : null}

        {users.status === 'success' ? (
          <>
            <SearchInput value={query} onChange={setQuery} />

            {/* `aria-live` anuncia cuántos quedan al filtrar, sin interrumpir
                lo que se está escribiendo. */}
            <p className={styles.count} aria-live="polite">
              {visibleUsers.length === 1 ? '1 usuario' : `${visibleUsers.length} usuarios`}
            </p>

            {visibleUsers.length > 0 ? (
              <UserList users={visibleUsers} />
            ) : (
              <EmptyState message={`Ningún usuario coincide con «${query.trim()}».`} />
            )}
          </>
        ) : null}
      </main>
    </div>
  )
}
