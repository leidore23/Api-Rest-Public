import { useState } from 'react'
import { useTheme } from './hooks/useTheme'
import { useUsers } from './hooks/useUsers'
import { filterUsersByName } from './lib/filterUsersByName'
import { SearchInput } from './components/SearchInput/SearchInput'
import { ThemeToggle } from './components/ThemeToggle/ThemeToggle'
import { UserForm } from './components/UserForm/UserForm'
import { UserList } from './components/UserList/UserList'
import { PostsPanel } from './components/PostsPanel/PostsPanel'
import { EmptyState } from './components/ui/EmptyState'
import { ErrorMessage } from './components/ui/ErrorMessage'
import { Spinner } from './components/ui/Spinner'
import styles from './App.module.css'

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme()
  const { state, create, update, remove } = useUsers()

  const [query, setQuery] = useState('')
  const [isAddingUser, setIsAddingUser] = useState(false)

  // Se guarda el id, no el usuario entero. Así, si el usuario seleccionado se
  // borra o se edita, la pantalla se actualiza sola: con una copia del objeto
  // en el estado habría que acordarse de sincronizarla en cada operación.
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const users = state.status === 'success' ? state.users : []

  // Filtrar diez elementos en cada render es más barato que memorizarlo, así
  // que no hay `useMemo`: añadiría dependencias que mantener sin ganar nada.
  const visibleUsers = filterUsersByName(users, query)
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Usuarios y publicaciones</h1>
          <p className={styles.subtitle}>Datos obtenidos de JSONPlaceholder</p>
        </div>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </header>

      <main className={styles.layout}>
        <section aria-labelledby="users-title">
          <h2 className={styles.sectionTitle} id="users-title">
            Usuarios
          </h2>

          {state.status === 'loading' ? <Spinner label="Cargando usuarios…" /> : null}

          {state.status === 'error' ? (
            <ErrorMessage message={state.message} onRetry={state.reload} />
          ) : null}

          {state.status === 'success' ? (
            <>
              {isAddingUser ? (
                <UserForm
                  onCancel={() => setIsAddingUser(false)}
                  onSubmit={async (values) => {
                    await create(values)
                    setIsAddingUser(false)
                  }}
                />
              ) : (
                <button
                  type="button"
                  className={styles.addUser}
                  onClick={() => setIsAddingUser(true)}
                >
                  Añadir usuario
                </button>
              )}

              <SearchInput value={query} onChange={setQuery} />

              {/* `aria-live` anuncia cuántos quedan al filtrar, sin interrumpir
                  lo que se está escribiendo. */}
              <p className={styles.count} aria-live="polite">
                {visibleUsers.length === 1 ? '1 usuario' : `${visibleUsers.length} usuarios`}
              </p>

              {visibleUsers.length > 0 ? (
                <UserList
                  users={visibleUsers}
                  selectedUserId={selectedUserId}
                  onSelect={(user) => setSelectedUserId(user.id)}
                  onUpdate={update}
                  onDelete={remove}
                />
              ) : (
                <EmptyState message={`Ningún usuario coincide con «${query.trim()}».`} />
              )}
            </>
          ) : null}
        </section>

        {selectedUser ? (
          /*
            La `key` fuerza a montar un panel nuevo al cambiar de usuario. Sin
            ella React reutilizaría el componente y las publicaciones creadas
            para el usuario anterior seguirían en pantalla, atribuidas a otro.
          */
          <PostsPanel key={selectedUser.id} user={selectedUser} />
        ) : (
          <EmptyState message="Elige un usuario para ver sus publicaciones." />
        )}
      </main>
    </div>
  )
}
