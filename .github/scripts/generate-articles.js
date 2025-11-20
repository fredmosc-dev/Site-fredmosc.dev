#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const yaml = require('js-yaml');

// Directories
const articlesDir = path.join(process.cwd(), 'articles');
const templatePath = path.join(process.cwd(), 'article-template.html');

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

// Function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

// Function to generate HTML from markdown file
function generateHTML(mdFile) {
    console.log(`Processing: ${mdFile}`);
    
    const mdPath = path.join(articlesDir, mdFile);
    const content = fs.readFileSync(mdPath, 'utf8');
    
    try {
        const { frontmatter, markdown } = parseFrontmatter(content);
        
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
        let html = template
            .replace(/{{title}}/g, frontmatter.title)
            .replace(/{{excerpt}}/g, frontmatter.excerpt)
            .replace(/{{category}}/g, frontmatter.category)
            .replace(/{{date}}/g, frontmatter.date)
            .replace(/{{formattedDate}}/g, formatDate(frontmatter.date))
            .replace(/{{readTime}}/g, readTime)
            .replace(/{{tags}}/g, frontmatter.tags.join(', '))
            .replace(/{{tagsHtml}}/g, tagsHtml)
            .replace(/{{content}}/g, htmlContent)
            .replace(/{{url}}/g, url);
        
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
console.log(`\nTotal articles processed: ${articlesIndex.length}`);
console.log('\nDone! 🎉');
