#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const yaml = require('js-yaml');

// Directories
const articlesDir = path.join(process.cwd(), 'articles');
const templatePath = path.join(process.cwd(), '.github', 'templates', 'article-template.html');

// Read template
const template = fs.readFileSync(templatePath, 'utf8');

// Array to store article metadata
const articlesIndex = [];

// Function to extract frontmatter from markdown
function parseFrontmatter(content) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (!match) {
        throw new Error('No frontmatter found');
    }
    
    const frontmatter = yaml.load(match[1]);
    const markdown = match[2];
    
    return { frontmatter, markdown };
}

// Function to calculate read time
function calculateReadTime(content) {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min`;
}

// Function to format date (UTC, para não cair no dia anterior por causa do fuso)
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00Z');
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
    });
}

// Tipo de conteúdo da marca fredmosc.tech (Notícia, Análise, Relato, Fora da tech)
function contentType(category) {
    const c = String(category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (c.startsWith('noticia')) return { cls: 'noticia', label: 'Notícia' };
    if (c.startsWith('analise')) return { cls: 'analise', label: 'Análise técnica' };
    if (c.startsWith('relato')) return { cls: 'relato', label: 'Relato' };
    if (c.startsWith('fora')) return { cls: 'fora', label: 'Fora da tech' };
    return { cls: 'analise', label: String(category || '') };
}

// Escapa texto que vai para atributos e títulos do HTML
function esc(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Function to generate HTML from markdown file
function generateHTML(mdFile) {
    console.log(`Processing: ${mdFile}`);
    
    const mdPath = path.join(articlesDir, mdFile);
    const content = fs.readFileSync(mdPath, 'utf8');
    
    try {
        const parsed = parseFrontmatter(content);
        const frontmatter = parsed.frontmatter;
        // O título já aparece no cabeçalho do artigo: remove o "# Título" do início do corpo, se houver
        const markdown = parsed.markdown.replace(/^\s*#\s+[^\n]*\n/, '');
        
        // Generate HTML content from markdown
        const htmlContent = marked(markdown);
        
        // Calculate read time if not provided
        const readTime = frontmatter.readTime || calculateReadTime(markdown);
        
        // Generate slug from filename
        const slug = path.basename(mdFile, '.md');
        const htmlFilename = `${slug}.html`;
        const url = `articles/${htmlFilename}`;
        
        // Generate tags HTML
        const tagsHtml = frontmatter.tags
            .map(tag => `<span class="article-tag">${tag}</span>`)
            .join('');
        
        // Replace placeholders in template
        // (uma passada só e com função: o conteúdo pode ter "$1", "$&" ou "{{algo}}" sem quebrar nada)
        const type = contentType(frontmatter.category);
        const values = {
            title: esc(frontmatter.title),
            excerpt: esc(frontmatter.excerpt),
            category: esc(frontmatter.category),
            categoryClass: type.cls,
            categoryLabel: type.label,
            date: esc(frontmatter.date),
            formattedDate: formatDate(frontmatter.date),
            readTime: esc(readTime),
            tags: esc(frontmatter.tags.join(', ')),
            tagsHtml: tagsHtml,
            content: htmlContent,
            url: url
        };
        const html = template.replace(/{{(\w+)}}/g, (m, key) =>
            Object.prototype.hasOwnProperty.call(values, key) ? values[key] : m);
        
        // Write HTML file
        const htmlPath = path.join(articlesDir, htmlFilename);
        fs.writeFileSync(htmlPath, html);
        
        console.log(`✓ Generated: ${htmlFilename}`);
        
        // Add to index
        articlesIndex.push({
            title: frontmatter.title,
            excerpt: frontmatter.excerpt,
            date: frontmatter.date,
            readTime: readTime,
            category: frontmatter.category,
            tags: frontmatter.tags,
            url: url,
            slug: slug
        });
        
    } catch (error) {
        console.error(`Error processing ${mdFile}:`, error.message);
    }
}

// Main execution
console.log('Starting article generation...\n');

// Get all .md files in articles directory
const mdFiles = fs.readdirSync(articlesDir)
    .filter(file => file.endsWith('.md') && file !== 'README.md');

if (mdFiles.length === 0) {
    console.log('No markdown files found in articles directory.');
    process.exit(0);
}

// Process each markdown file
mdFiles.forEach(generateHTML);

// Sort articles by date (newest first)
articlesIndex.sort((a, b) => new Date(b.date) - new Date(a.date));

// Write articles index JSON
const indexPath = path.join(articlesDir, 'articles-index.json');
fs.writeFileSync(indexPath, JSON.stringify(articlesIndex, null, 2));

console.log(`\n✓ Generated articles index: articles-index.json`);

// Sitemap: páginas fixas + artigos (lastmod só nos artigos, onde a data é confiável)
const SITE = 'https://fredmosc.tech';
const staticPages = ['', 'about.html', 'blog.html', 'palestras.html', 'videos.html', 'privacidade.html'];
const urls = staticPages.map(p => `  <url><loc>${SITE}/${p}</loc></url>`);
articlesIndex.forEach(a => {
    const lastmod = /^\d{4}-\d{2}-\d{2}$/.test(String(a.date)) ? `<lastmod>${a.date}</lastmod>` : '';
    urls.push(`  <url><loc>${SITE}/${a.url}</loc>${lastmod}</url>`);
});
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(process.cwd(), 'sitemap.xml'), sitemap);
console.log(`✓ Generated sitemap.xml (${urls.length} URLs)`);
console.log(`\nTotal articles processed: ${articlesIndex.length}`);
console.log('\nDone! 🎉');
