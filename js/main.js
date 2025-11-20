// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const nav = document.getElementById('nav');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
        nav.style.flexDirection = 'column';
        nav.style.position = 'absolute';
        nav.style.top = '100%';
        nav.style.left = '0';
        nav.style.right = '0';
        nav.style.background = 'white';
        nav.style.padding = '1rem';
        nav.style.borderBottom = '1px solid var(--gray-200)';
    });

    // Close menu when clicking nav link
    const navLinks = nav.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 768) {
                nav.style.display = 'none';
            }
        });
    });
}

// Sticky Header
const header = document.getElementById('header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        header.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    } else {
        header.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
});

// Load Latest Blog Posts
async function loadLatestPosts() {
    try {
        const response = await fetch('articles/articles-index.json');
        const articles = await response.json();
        
        // Sort by date and get latest 3
        const latestPosts = articles
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 3);
        
        const blogGrid = document.getElementById('blogGrid');
        
        if (blogGrid && latestPosts.length > 0) {
            blogGrid.innerHTML = latestPosts.map(post => `
                <div class="card blog-card" onclick="window.location.href='${post.url}'">
                    <div class="card-header">
                        <h3>${post.title}</h3>
                        <div class="blog-card-meta">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            ${formatDate(post.date)} · ${post.readTime}
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="blog-card-excerpt">${post.excerpt}</p>
                        <a href="${post.url}" class="blog-card-link">
                            Ler mais
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </a>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading blog posts:', error);
        // Show static fallback if JSON doesn't exist yet
        const blogGrid = document.getElementById('blogGrid');
        if (blogGrid) {
            blogGrid.innerHTML = `
                <div class="card blog-card">
                    <div class="card-header">
                        <h3>Arquitetura de Microsserviços: Lições Aprendidas</h3>
                        <div class="blog-card-meta">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            10/11/2025 · 8 min
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="blog-card-excerpt">Compartilho experiências práticas sobre implementação de microsserviços em ambientes de produção...</p>
                        <span class="blog-card-link">Em breve</span>
                    </div>
                </div>
                <div class="card blog-card">
                    <div class="card-header">
                        <h3>Cloud Native: Estratégias de Deploy</h3>
                        <div class="blog-card-meta">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            05/11/2025 · 12 min
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="blog-card-excerpt">Como otimizar aplicações para ambientes cloud native utilizando containers...</p>
                        <span class="blog-card-link">Em breve</span>
                    </div>
                </div>
                <div class="card blog-card">
                    <div class="card-header">
                        <h3>Segurança em APIs: Melhores Práticas</h3>
                        <div class="blog-card-meta">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            28/10/2025 · 10 min
                        </div>
                    </div>
                    <div class="card-body">
                        <p class="blog-card-excerpt">Um guia completo sobre autenticação, autorização e proteção de dados...</p>
                        <span class="blog-card-link">Em breve</span>
                    </div>
                </div>
            `;
        }
    }
}

// Format date to pt-BR
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Load Courses from JSON
async function loadCourses() {
    try {
        const response = await fetch('data/courses.json');
        const courses = await response.json();
        
        const coursesGrid = document.getElementById('coursesGrid');
        
        if (coursesGrid && courses.length > 0) {
            coursesGrid.innerHTML = courses.map(course => `
                <div class="card course-card">
                    ${course.badge ? `
                    <div class="card-badge card-badge-${course.badge.toLowerCase()}">
                        ${course.badge}
                    </div>
                    ` : ''}
                    <div class="card-header">
                        <h3>${course.title}</h3>
                        <p>${course.description}</p>
                    </div>
                    <div class="card-body">
                        <div class="course-stats">
                            <div class="course-stat">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                ${course.duration}
                            </div>
                            <div class="course-stat">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="9" cy="7" r="4"></circle>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                                ${course.students.toLocaleString('pt-BR')} alunos
                            </div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <div class="course-price">${course.price}</div>
                        <a href="${course.link}" class="btn btn-secondary">Saber mais</a>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}

// Newsletter Form
const newsletterForm = document.getElementById('newsletterForm');

if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(newsletterForm);
        const name = formData.get('name');
        const email = formData.get('email');
        
        // Here you would send to your backend/service
        console.log('Newsletter signup:', { name, email });
        
        // Show success message
        newsletterForm.innerHTML = `
            <div style="text-align: center; padding: 2rem 0;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #10B981; margin: 0 auto 1rem;">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <h3 style="margin-bottom: 0.5rem;">Cadastro realizado!</h3>
                <p>Você receberá nossos whitepapers no e-mail cadastrado.</p>
            </div>
        `;
        
        // Reset after 5 seconds
        setTimeout(() => {
            location.reload();
        }, 5000);
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadLatestPosts();
    loadCourses();
});