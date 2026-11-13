import { posts } from '../.generated/posts.ts';
import type { Post } from './post.ts';
import { site } from './site.ts';

// Preserve the approved second headline until its Markdown article is ready.
// Adding content/posts/cre-bench.md automatically replaces this placeholder.
const placeholders: Post[] = [{ id: 'cre-bench', title: 'CRE Bench - Our Financial Analyst Benchmark' }];

export const siteContent = {
  ...site,
  posts: [...posts, ...placeholders.filter((placeholder) => !posts.some((post) => post.id === placeholder.id))],
};
