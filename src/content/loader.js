import projects from './projects.json';
import experience from './experience.json';
import gallery from './gallery.json';
import site from './site.json';
import { parseFrontmatter } from './frontmatter.js';

const mdFiles = import.meta.glob('./blog/*.md', { query: '?raw', import: 'default', eager: true });

export async function loadContent() {
  const posts = Object.entries(mdFiles)
    .map(([path, raw]) => {
      const { data, body } = parseFrontmatter(raw);
      return {
        slug: path.replace('./blog/', '').replace('.md', ''),
        title: data.title,
        date: data.date,
        body,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  return { projects, experience, gallery, site, posts };
}
