import { generatePosts, normalizeBase, projectRoot } from './generate-posts.ts';
import { generatePartners } from './generate-partners.ts';

const base = normalizeBase(process.env.BASE_PATH);
const articles = await generatePosts(projectRoot, base);
await generatePartners(projectRoot, base);
console.log(`Generated ${articles.length} Markdown article(s) and the Partners pages.`);
