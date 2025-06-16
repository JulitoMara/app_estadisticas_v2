// ====== SELECTORES DE ELEMENTOS DEL DOM =======
// Marcador (ahora variables internas para los goles)
let _teamAGoals = 0;
let _teamBGoals = 0;
const mainScoreDisplayEl = document.getElementById('mainScoreDisplay'); // Nuevo elemento central del marcador


// Nombres de Equipos
const teamANameInput = document.getElementById('teamAName');
const teamBNameInput = document.getElementById('teamBName');

// Controles de Marcador (usando delegación de eventos en la nueva estructura)
document.querySelectorAll('.score-section .score-controls-column button').forEach(button => {
    button.addEventListener('click', (e) => {
        const targetTeam = e.target.closest('.score-controls-column').classList.contains('team-A-controls') ? 'A' : 'B';

        if (e.target.classList.contains('plus-btn')) {
            if (targetTeam === 'A') _teamAGoals++;
            else _teamBGoals++;
        } else if (e.target.classList.contains('minus-btn')) {
            if (targetTeam === 'A') _teamAGoals = Math.max(0, _teamAGoals - 1);
            else _teamBGoals = Math.max(0, _teamBGoals - 1);
        } else if (e.target.classList.contains('reset-btn')) {
            if (targetTeam === 'A') _teamAGoals = 0;
            else _teamBGoals = 0;
        }
        updateMainScoreDisplay(); // Llama a esta función para actualizar el display
    });
});


// Tiempo de Partido
const matchTimerEl = document.getElementById('matchTimer');
const toggleMatchTimerBtn = document.getElementById('toggleMatchTimer');
const resetMatchTimerBtn = document.getElementById('resetMatchTimer');
let matchTimerInterval;
let matchTimeElapsed = 0;
let isMatchTimerRunning = false; // Estado para saber si el tiempo de partido está corriendo

// Posesión de Balón
const possessionTimerAEl = document.getElementById('possessionTimerA');
const possessionTimerBEl = document.getElementById('possessionTimerB');
const togglePossessionABtn = document.getElementById('togglePossessionA');
const togglePossessionBBtn = document.getElementById('togglePossessionB');
const resetPossessionBtn = document.getElementById('resetPossession');
const possessionBarA = document.getElementById('possessionBarA');
const possessionPercentA = document.getElementById('possessionPercentA');
const possessionPercentB = document.getElementById('possessionPercentB');

let possessionIntervalA, possessionIntervalB;
let possessionTimeA = 0;
let possessionTimeB = 0;
let currentPossession = null; // 'A', 'B', or null

// Estadísticas Personalizadas
const newStatNameInput = document.getElementById('newStatName');
const addStatBtn = document.getElementById('addStatBtn');
const generalStatsContainer = document.getElementById('generalStatsContainer');

// Reiniciar Todo
const resetAllBtn = document.getElementById('resetAll');

// SELECTORES DEL MODAL
const statDetailsModal = document.getElementById('statDetailsModal');
const modalStatTitle = document.getElementById('modalStatTitle');
const modalEventList = document.getElementById('modalEventList');
const closeButton = document.querySelector('.modal .close-button');


// ====== FUNCIONES GENERALES =======

// Función para formatear tiempo (HH:MM:SS)
function formatTime(seconds) {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

// Actualizar el display central del marcador
function updateMainScoreDisplay() {
    mainScoreDisplayEl.textContent = `${_teamAGoals} - ${_teamBGoals}`;
}

// Actualizar nombres de equipos (ahora solo afecta a la posesión y stats)
function updateTeamLabels() {
    // teamALabelGoals y teamBLabelGoals ya no están en el marcador principal
    const possessionTeamAEl = document.getElementById('possessionTeamA');
    const possessionTeamBEl = document.getElementById('possessionTeamB');
    if (possessionTeamAEl) possessionTeamAEl.textContent = teamANameInput.value || "Equipo A";
    if (possessionTeamBEl) possessionTeamBEl.textContent = teamBNameInput.value || "Equipo B";

    // Llamar a renderCustomStats para que actualice los nombres en las tarjetas de estadísticas
    renderCustomStats();
}

let customStats = JSON.parse(localStorage.getItem('customStats'));

if (!customStats || customStats.length === 0) {
    customStats = [
        { id: 'stat-shots-on-goal', name: 'Disparos a puerta', events: [] },
        { id: 'stat-shots-off-goal', name: 'Disparos fuera', events: [] },
        { id: 'stat-fouls', name: 'Faltas', events: [] },
        { id: 'stat-yellow-cards', name: 'Tarjetas Amarillas', events: [] },
        { id: 'stat-red-cards', name: 'Tarjetas Rojas', events: [] },
        { id: 'stat-corners', name: 'Córners', events: [] },
        { id: 'stat-offsides', name: 'Fueras de juego', events: [] },
        { id: 'stat-saves', name: 'Paradas', events: [] }
    ];
    localStorage.setItem('customStats', JSON.stringify(customStats));
}

// renderCustomStats para el diseño COMPACTO con botones verticales
function renderCustomStats() {
    generalStatsContainer.innerHTML = ''; // Limpiar el contenedor
    customStats.forEach(stat => {
        const statCard = document.createElement('div');
        statCard.classList.add('stat-card');
        statCard.dataset.statId = stat.id;

        statCard.innerHTML = `
            <h3 class="stat-card-header">
                <span class="stat-title">${stat.name}</span>
                <div class="stat-action-icons">
                    <button class="view-details-btn" data-id="${stat.id}">📋</button>
                    <button class="edit-stat-btn" data-id="${stat.id}">✏️</button>
                    <button class="delete-stat-btn" data-id="${stat.id}">🗑️</button>
                </div>
            </h3>
            <div class="stat-controls-group">
                <div class="team-buttons-column team-A-controls">
                    <button class="reset-btn" data-team="A" data-stat="${stat.id}">🔄</button>
                    <button class="minus-btn" data-team="A" data-stat="${stat.id}">-</button>
                    <button class="plus-btn" data-team="A" data-stat="${stat.id}">+</button>
                </div>
                <span class="stat-total-display" data-stat-total="${stat.id}">0 - 0</span>
                <div class="team-buttons-column team-B-controls">
                    <button class="reset-btn" data-team="B" data-stat="${stat.id}">🔄</button>
                    <button class="minus-btn" data-team="B" data-stat="${stat.id}">-</button>
                    <button class="plus-btn" data-team="B" data-stat="${stat.id}">+</button>
                </div>
            </div>
        `;
        generalStatsContainer.appendChild(statCard);
    });
    addStatCardEventListeners();
    updateCustomStatCounters(); // Esto recalculará y actualizará los contadores iniciales.
}
// FIN MODIFICACIÓN

function updateCustomStatCounters() {
    customStats.forEach(stat => {
        const teamAcount = stat.events.filter(event => event.team === 'A').length;
        const teamBcount = stat.events.filter(event => event.team === 'B').length;
        
        // Actualizar el contador general (0 - 0)
        const mainTotalSpan = generalStatsContainer.querySelector(`.stat-card[data-stat-id="${stat.id}"] .stat-total-display`);
        if (mainTotalSpan) {
            mainTotalSpan.textContent = `${teamAcount} - ${teamBcount}`;
        }
    });
}

function addStatCardEventListeners() {
    generalStatsContainer.removeEventListener('click', handleCustomStatControls); // Previene duplicados
    generalStatsContainer.addEventListener('click', handleCustomStatControls);
}

function handleCustomStatControls(e) {
    const target = e.target;
    const isControlBtn = target.classList.contains('plus-btn') || target.classList.contains('minus-btn') || target.classList.contains('reset-btn');

    if (isControlBtn) {
        const team = target.dataset.team;
        const statId = target.dataset.stat;

        const statToUpdate = customStats.find(s => s.id === statId);
        if (!statToUpdate) return;

        if (target.classList.contains('plus-btn')) {
            statToUpdate.events.push({
                timestamp: matchTimeElapsed,
                team: team
            });
        } else if (target.classList.contains('minus-btn')) {
            // Eliminar el último evento de ese equipo para esa estadística
            const eventsForTeam = statToUpdate.events.filter(event => event.team === team);
            if (eventsForTeam.length > 0) {
                // Encontrar el evento con el timestamp más reciente para eliminarlo
                const lastEventTime = Math.max(...eventsForTeam.map(event => event.timestamp));
                const indexToRemove = statToUpdate.events.findIndex(event => event.team === team && event.timestamp === lastEventTime);
                if (indexToRemove !== -1) {
                    statToUpdate.events.splice(indexToRemove, 1);
                }
            }
        } else if (target.classList.contains('reset-btn')) {
            // Eliminar todos los eventos de ese equipo para esa estadística
            statToUpdate.events = statToUpdate.events.filter(event => event.team !== team);
        }
        localStorage.setItem('customStats', JSON.stringify(customStats));
        updateCustomStatCounters(); // Esto recalculará y actualizará el contador total (0-0)
    } else if (target.classList.contains('delete-stat-btn')) {
        const statIdToDelete = target.dataset.id;
        const defaultStatIds = [
            'stat-shots-on-goal', 'stat-shots-off-goal', 'stat-fouls',
            'stat-yellow-cards', 'stat-red-cards', 'stat-corners',
            'stat-offsides', 'stat-saves'
        ];
        if (defaultStatIds.includes(statIdToDelete)) {
            alert('No se pueden eliminar las estadísticas predeterminadas.');
            return;
        }

        customStats = customStats.filter(stat => stat.id !== statIdToDelete);
        localStorage.setItem('customStats', JSON.stringify(customStats));
        renderCustomStats(); // Volver a renderizar todas las tarjetas
    } else if (target.classList.contains('edit-stat-btn')) {
        const statIdToEdit = target.dataset.id;
        const statToEdit = customStats.find(stat => stat.id === statIdToEdit);
        if (statToEdit) {
            const newName = prompt("Editar nombre de la estadística:", statToEdit.name);
            if (newName && newName.trim() !== "") {
                statToEdit.name = newName.trim();
                localStorage.setItem('customStats', JSON.stringify(customStats));
                renderCustomStats(); // Volver a renderizar todas las tarjetas para actualizar el nombre
            }
        }
    } else if (target.classList.contains('view-details-btn')) {
        const statId = target.dataset.id;
        showStatDetailsModal(statId);
    }
}


// ====== FUNCIONES DEL MODAL =======

function showStatDetailsModal(statId) {
    const stat = customStats.find(s => s.id === statId);
    if (!stat) return;

    modalStatTitle.textContent = `Detalles de ${stat.name}`;
    modalEventList.innerHTML = ''; // Limpiar lista anterior

    if (stat.events.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No hay eventos registrados para esta estadística.';
        modalEventList.appendChild(li);
    } else {
        // Ordenar los eventos por timestamp de forma ascendente
        const sortedEvents = [...stat.events].sort((a, b) => a.timestamp - b.timestamp);

        sortedEvents.forEach(event => {
            const li = document.createElement('li');
            li.classList.add(`team-${event.team}`); // Para aplicar estilos de color por equipo
            li.innerHTML = `
                <span class="event-time">${formatTime(event.timestamp)}</span>
                <span class="event-team">${event.team === 'A' ? (teamANameInput.value || 'Equipo A') : (teamBNameInput.value || 'Equipo B')}</span>
            `;
            modalEventList.appendChild(li);
        });
    }

    statDetailsModal.style.display = 'flex'; // Mostrar el modal
}

// Cerrar el modal al hacer clic en la X
closeButton.addEventListener('click', () => {
    statDetailsModal.style.display = 'none';
});

// Cerrar el modal al hacer clic fuera del contenido del modal
window.addEventListener('click', (event) => {
    if (event.target === statDetailsModal) {
        statDetailsModal.style.display = 'none';
    }
});


// ====== INICIALIZACIÓN =======
document.addEventListener('DOMContentLoaded', () => {
    updateTeamLabels(); // Esto llamará a renderCustomStats
    updateMainScoreDisplay(); // Inicializar el marcador central

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registrado con éxito:', registration);
                })
                .catch(error => {
                    console.log('Fallo el registro del Service Worker:', error);
                });
        });
    }
});


// ====== EVENT LISTENERS =======

// Nombres de Equipos
teamANameInput.addEventListener('input', updateTeamLabels);
teamBNameInput.addEventListener('input', updateTeamLabels);

// Tiempo de Partido
toggleMatchTimerBtn.addEventListener('click', () => {
    if (isMatchTimerRunning) {
        clearInterval(matchTimerInterval);
        toggleMatchTimerBtn.textContent = '▶️ Reanudar';
        if (currentPossession) {
            // Pause possession when match timer is paused
            togglePossession(currentPossession); // This will effectively stop the current possession timer
        }
    } else {
        matchTimerInterval = setInterval(() => {
            matchTimeElapsed++;
            matchTimerEl.textContent = formatTime(matchTimeElapsed);
        }, 1000);
        toggleMatchTimerBtn.textContent = '⏸️ Pausar';
    }
    isMatchTimerRunning = !isMatchTimerRunning;
});

resetMatchTimerBtn.addEventListener('click', () => {
    clearInterval(matchTimerInterval);
    matchTimeElapsed = 0;
    matchTimerEl.textContent = formatTime(matchTimeElapsed);
    toggleMatchTimerBtn.textContent = '▶️ Iniciar';
    isMatchTimerRunning = false;
    resetPossession();
});

// Posesión de Balón
togglePossessionABtn.addEventListener('click', () => togglePossession('A'));
togglePossessionBBtn.addEventListener('click', () => togglePossession('B'));
resetPossessionBtn.addEventListener('click', resetPossession);

function togglePossession(team) {
    if (!isMatchTimerRunning && currentPossession === null) {
        alert('Para iniciar la posesión, primero debes iniciar el tiempo de partido.');
        return;
    }

    clearInterval(possessionIntervalA);
    clearInterval(possessionIntervalB);

    if (currentPossession === team) {
        currentPossession = null;
        updatePossessionButtons();
    } else {
        currentPossession = team;
        if (team === 'A') {
            possessionIntervalA = setInterval(() => {
                possessionTimeA++;
                possessionTimerAEl.textContent = formatTime(possessionTimeA);
                updatePossessionBar();
            }, 1000);
        } else { // This 'else' block is for Team B
            possessionIntervalB = setInterval(() => {
                possessionTimeB++;
                possessionTimerBEl.textContent = formatTime(possessionTimeB);
                updatePossessionBar();
            }, 1000);
        }
        updatePossessionButtons();
    }
}

function resetPossession() {
    clearInterval(possessionIntervalA);
    clearInterval(possessionIntervalB);
    possessionTimeA = 0;
    possessionTimeB = 0;
    currentPossession = null;
    possessionTimerAEl.textContent = formatTime(0);
    possessionTimerBEl.textContent = formatTime(0);
    updatePossessionBar();
    updatePossessionButtons();
}

function updatePossessionBar() {
    const totalTime = possessionTimeA + possessionTimeB;
    if (totalTime === 0) {
        possessionBarA.style.width = '50%';
        possessionPercentA.textContent = '0%';
        possessionPercentB.textContent = '0%';
        return;
    }

    const percentA = (possessionTimeA / totalTime) * 100;
    const percentB = (possessionTimeB / totalTime) * 100;

    possessionBarA.style.width = `${percentA}%`;
    possessionPercentA.textContent = `${Math.round(percentA)}%`;
    possessionPercentB.textContent = `${Math.round(percentB)}%`;
}

function updatePossessionButtons() {
    togglePossessionABtn.classList.remove('active');
    togglePossessionBBtn.classList.remove('active');
    if (currentPossession === 'A') {
        togglePossessionABtn.classList.add('active');
    } else if (currentPossession === 'B') {
        togglePossessionBBtn.classList.add('active');
    }
}

// Estadísticas Personalizadas: Añadir nueva estadística
addStatBtn.addEventListener('click', () => {
    const newStatName = newStatNameInput.value.trim();
    if (newStatName) {
        const newId = 'stat-' + newStatName.toLowerCase().replace(/\s+/g, '-');
        if (customStats.some(stat => stat.id === newId)) {
            alert('¡Ya existe una estadística con un nombre similar!');
            return;
        }

        customStats.push({ id: newId, name: newStatName, events: [] });
        localStorage.setItem('customStats', JSON.stringify(customStats));
        newStatNameInput.value = '';
        renderCustomStats();
    }
});

// Reiniciar Todas las Estadísticas
resetAllBtn.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que quieres reiniciar TODAS las estadísticas del partido actual?')) {
        // Reiniciar goles del marcador
        _teamAGoals = 0;
        _teamBGoals = 0;
        updateMainScoreDisplay(); // Actualizar el display central

        clearInterval(matchTimerInterval);
        matchTimeElapsed = 0;
        matchTimerEl.textContent = formatTime(matchTimeElapsed);
        toggleMatchTimerBtn.textContent = '▶️ Iniciar';
        isMatchTimerRunning = false;

        resetPossession();

        customStats.forEach(stat => {
            stat.events = [];
        });
        localStorage.setItem('customStats', JSON.stringify(customStats));
        updateCustomStatCounters();
    }
});
