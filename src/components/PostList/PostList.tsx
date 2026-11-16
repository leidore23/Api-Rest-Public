import type { Post } from '../../types'
import type { PostFormValues } from '../../lib/validatePost'
import { PostItem } from './PostItem'
import styles from './PostList.module.css'

interface PostListProps {
  posts: Post[]
  onUpdate: (post: Post, values: PostFormValues) => Promise<void>
  onDelete: (post: Post) => Promise<void>
}

export function PostList({ posts, onUpdate, onDelete }: PostListProps) {
  return (
    <ul className={styles.list}>
      {posts.map((post) => (
        <PostItem
          key={post.id}
          post={post}
          onUpdate={(values) => onUpdate(post, values)}
          onDelete={() => onDelete(post)}
        />
      ))}
    </ul>
  )
}
