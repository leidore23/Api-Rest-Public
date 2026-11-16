import type { Post } from '../../types'
import styles from './PostList.module.css'

interface PostListProps {
  posts: Post[]
}

export function PostList({ posts }: PostListProps) {
  return (
    <ul className={styles.list}>
      {posts.map((post) => (
        <li key={post.id} className={styles.item}>
          <h3 className={styles.title}>{post.title}</h3>
          <p className={styles.body}>{post.body}</p>
        </li>
      ))}
    </ul>
  )
}
