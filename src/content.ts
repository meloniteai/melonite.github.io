import { posts } from '../.generated/posts.ts';
import type { Post } from './post.ts';
import { site } from './site.ts';

// Preserve the approved second headline until its Markdown article is ready.
// Adding content/posts/blue-cell-bench.md automatically replaces this placeholder.
const placeholders: Post[] = [{ id: 'blue-cell-bench', title: 'Blue Cell Bench: Can AI Underwrite the Deal?' }];

export const siteContent = {
  ...site,
  posts: [...posts, ...placeholders.filter((placeholder) => !posts.some((post) => post.id === placeholder.id))],
};
