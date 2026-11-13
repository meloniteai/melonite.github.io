import { defineConfig } from 'vite';
import type { ViteDevServer } from 'vite';
import { join, resolve, sep } from 'node:path';
import { generatePosts, normalizeBase, projectRoot } from './scripts/generate-posts.ts';

export default defineConfig(async () => {
  const base = normalizeBase(process.env.BASE_PATH);
  const articles = await generatePosts(projectRoot, base);
  return {
    base,
    build: {
      rollupOptions: {
        input: [join(projectRoot, 'index.html'), ...articles.map((article) => join(projectRoot, article.path, 'index.html'))],
      },
    },
    plugins: [{
      name: 'markdown-pages',
      configureServer(server: ViteDevServer) {
        const contentDirectory = join(projectRoot, 'content/posts');
        server.watcher.add(contentDirectory);
        let pending = Promise.resolve();
        const onContentChange = (event: string, file: string) => {
          if (!['add', 'change', 'unlink'].includes(event) || !resolve(file).startsWith(contentDirectory + sep) || !file.endsWith('.md')) return;
          pending = pending.then(async () => {
            await generatePosts(projectRoot, base);
            server.ws.send({ type: 'full-reload' });
          }).catch((error: Error) => {
            server.config.logger.error(error.message);
            server.ws.send({ type: 'error', err: { message: error.message, stack: error.stack ?? '' } });
          });
        };
        server.watcher.on('all', onContentChange);
        server.httpServer?.once('close', () => server.watcher.off('all', onContentChange));
      },
    }],
  };
});
