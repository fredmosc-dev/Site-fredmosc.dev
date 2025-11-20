// Blog page specific JavaScript
let allArticles = [];
let filteredArticles = [];

// Load articles
async function loadArticles() {
    try {
        const response = await fetch('articles/articles-index.json');
        allArticles = await response.json();
        filteredArticles = [...allArticles];
        renderArticles();
    } catch (error) {
        console.error('Error loading articles:', error);
        showNoArticles();
    }
}

// Render articles
function renderArticles() {
    const grid = document.getElementById('articlesGrid');
    const noResults = document.getElementById('noResults');
    
    if (filteredArticles.length === 0) {
        grid.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    
    grid.innerHTML = filteredArticles.map(article => `
        <a href="${article.url}" class="card article-card">
            <div class="card-header">
                <span class="badge badge-secondary">${article.category}</span>
                <h3>${article.title}</h3>
                <div class="blog-card-meta">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    ${formatDate(article.date)}
                    <span>·</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    ${article.readTime}
                </div>
            </div>
            <div class="card-body">
                <p class="blog-card-excerpt">${article.excerpt}</p>
                <div class="article-tags">
                    ${article.tags.map(tag => `<span class="article-tag">${tag}</span>`).join('')}
                </div>
            </div>
        </a>
    `).join('');
}

// Show no articles message
function showNoArticles() {
    const grid = document.getElementById('articlesGrid');
    grid.innerHTML = '<div class="no-results"><p>Nenhum artigo publicado ainda. Volte em breve!</p></div>';
}

// Filter by category
function filterByCategory(category) {
    if (category === 'all') {
        filteredArticles = [...allArticles];
    } else {
        filteredArticles = allArticles.filter(article => article.category === category);
    }
    renderArticles();
}

// Search articles
function searchArticles(query) {
    const searchTerm = query.toLowerCase();
    
    if (!searchTerm) {
        filteredArticles = [...allArticles];
    } else {
        filteredArticles = allArticles.filter(article => 
            article.title.toLowerCase().includes(searchTerm) ||
            article.excerpt.toLowerCase().includes(searchTerm) ||
            article.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }
    
    renderArticles();
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Category buttons
const categoryBtns = document.querySelectorAll('.category-btn');
categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active from all
        categoryBtns.forEach(b => b.classList.remove('active'));
        // Add active to clicked
        btn.classList.add('active');
        // Filter
        const category = btn.dataset.category;
        filterByCategory(category);
    });
});

// Search input
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchArticles(e.target.value);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadArticles();
});
