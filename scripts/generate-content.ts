import { generatePosts, normalizeBase, projectRoot } from './generate-posts.ts';
import { generatePartners, partnerMetadata } from './generate-partners.ts';
import { generateBrandAssets } from './generate-brand-assets.ts';
import { homeMetadata } from './page-metadata.ts';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function generateSiteContent(root = projectRoot, base = normalizeBase(process.env.BASE_PATH)) {
  const articles = await generatePosts(root, base);
  await generatePartners(root, base);
  await generateBrandAssets(root, [
    homeMetadata, partnerMetadata(), partnerMetadata(true),
    ...articles.map(article => ({ title: article.title, description: article.description ?? article.title, path: article.path, type: 'article' as const })),
  ]);
  return articles;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const articles = await generateSiteContent();
  console.log(`Generated ${articles.length} Markdown article(s), the Partners pages, favicons, and social preview images.`);
}
