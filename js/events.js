// Load Events from JSON
async function loadEvents() {
    try {
        const response = await fetch('data/events.json');
        const events = await response.json();
        
        // Sort by date (nearest first)
        const sortedEvents = events.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Take only next 4 events
        const upcomingEvents = sortedEvents.slice(0, 4);
        
        renderEvents(upcomingEvents);
    } catch (error) {
        console.error('Error loading events:', error);
        // Show static fallback if JSON doesn't exist
        showFallbackEvents();
    }
}

function renderEvents(events) {
    const eventsGrid = document.querySelector('.events-grid');
    
    if (!eventsGrid) return;
    
    if (events.length === 0) {
        eventsGrid.innerHTML = '<p class="no-events">Nenhum evento programado no momento.</p>';
        return;
    }
    
    eventsGrid.innerHTML = events.map(event => `
        <div class="card event-card">
            <div class="card-header">
                <div class="event-badges">
                    <span class="badge ${event.type === 'Online' ? 'badge-secondary' : 'badge-primary'}">${event.type}</span>
                    <span class="badge badge-outline">${event.status}</span>
                </div>
                <h3>${event.title}</h3>
            </div>
            <div class="card-body">
                ${event.description ? `<p class="event-description">${event.description}</p>` : ''}
                <div class="event-info">
                    <div class="event-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        ${formatEventDate(event.date)}
                    </div>
                    <div class="event-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        ${event.time}
                    </div>
                    <div class="event-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        ${event.location}
                    </div>
                </div>
                <button class="btn btn-outline btn-block" onclick="window.location.href='${event.link}'">
                    Mais informações
                </button>
            </div>
        </div>
    `).join('');
}

function formatEventDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

function showFallbackEvents() {
    // Static fallback when JSON is not available
    const eventsGrid = document.querySelector('.events-grid');
    if (!eventsGrid) return;
    
    eventsGrid.innerHTML = `
        <div class="card event-card">
            <div class="card-header">
                <div class="event-badges">
                    <span class="badge badge-primary">Presencial</span>
                    <span class="badge badge-outline">Confirmado</span>
                </div>
                <h3>Em Breve</h3>
            </div>
            <div class="card-body">
                <div class="event-info">
                    <div class="event-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        27 de novembro de 2025
                    </div>
                    <div class="event-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        19:00
                    </div>
                    <div class="event-detail">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        ExoHub - ACIFI
                    </div>
                </div>
                <button class="btn btn-outline btn-block">Mais informações</button>
            </div>
        </div>
    `;
}

// Add event description style
const style = document.createElement('style');
style.textContent = `
    .event-description {
        color: var(--gray-700);
        font-size: 0.875rem;
        line-height: 1.6;
        margin-bottom: 1rem;
    }
    .no-events {
        text-align: center;
        padding: 3rem;
        color: var(--gray-600);
        font-size: 1.125rem;
    }
`;
document.head.appendChild(style);

// Initialize events when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadEvents);
} else {
    loadEvents();
}
