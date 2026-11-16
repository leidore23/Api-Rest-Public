import { fetchUsers } from './api/users'
import { useAsync } from './hooks/useAsync'
import { UserList } from './components/UserList/UserList'
import { ErrorMessage } from './components/ui/ErrorMessage'
import { Spinner } from './components/ui/Spinner'
import styles from './App.module.css'

export default function App() {
  const users = useAsync((signal) => fetchUsers(signal), [])

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

        {users.status === 'success' ? <UserList users={users.data} /> : null}
      </main>
    </div>
  )
}
