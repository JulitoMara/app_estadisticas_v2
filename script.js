// ====== SELECTORES DE ELEMENTOS DEL DOM =======
// Marcador
const teamAGoalsEl = document.getElementById('teamAGoals');
const teamBGoalsEl = document.getElementById('teamBGoals');
const teamALabelGoals = document.getElementById('teamALabelGoals');
const teamBLabelGoals = document.getElementById('teamBLabelGoals');

// Nombres de Equipos
const teamANameInput = document.getElementById('teamAName');
const teamBNameInput = document.getElementById('teamBName');

// Controles de Marcador (usando delegación de eventos)
document.querySelectorAll('.score-section .controls').forEach(controls => {
    controls.addEventListener('click', (e) => {
        const targetId = e.target.dataset.target;
        if (!targetId) return; // No es un botón de control

        const counterEl = document.getElementById(targetId);
        let currentValue = parseInt(counterEl.textContent);

        if (e.target.classList.contains('plus-btn')) {
            currentValue++;
        } else if (e.target.classList.contains('minus-btn')) {
            currentValue = Math.max(0, currentValue - 1); // No bajar de 0
        } else if (e.target.classList.contains('reset-btn')) {
            currentValue = 0;
        }
        counterEl.textContent = currentValue;
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
const possessionPercentB = document = document.getElementById('possessionPercentB');

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

// Se eliminan selectores de Guardar y Cargar Partidos: saveMatchBtn, matchesHistoryList

// ====== FUNCIONES GENERALES =======

// Función para formatear tiempo (HH:MM:SS)
function formatTime(seconds) {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

// Actualizar nombres de equipos
function updateTeamLabels() {
    teamALabelGoals.textContent = teamANameInput.value || "Equipo A";
    teamBLabelGoals.textContent = teamBNameInput.value || "Equipo B";
    const possessionTeamAEl = document.getElementById('possessionTeamA');
    const possessionTeamBEl = document.getElementById('possessionTeamB');
    if (possessionTeamAEl) possessionTeamAEl.textContent = teamANameInput.value || "Equipo A";
    if (possessionTeamBEl) possessionTeamBEl.textContent = teamBNameInput.value || "Equipo B";
}

// Cargar estadísticas personalizadas desde localStorage, o usar las predeterminadas
let customStats = JSON.parse(localStorage.getItem('customStats'));

// Si no hay estadísticas guardadas o el localStorage está vacío, inicializar con estas
if (!customStats || customStats.length === 0) {
    customStats = [
        { id: 'stat-shots-on-goal', name: 'Disparos a puerta', teamA: 0, teamB: 0 },
        { id: 'stat-shots-off-goal', name: 'Disparos fuera', teamA: 0, teamB: 0 },
        { id: 'stat-fouls', name: 'Faltas', teamA: 0, teamB: 0 },
        { id: 'stat-yellow-cards', name: 'Tarjetas Amarillas', teamA: 0, teamB: 0 },
        { id: 'stat-red-cards', name: 'Tarjetas Rojas', teamA: 0, teamB: 0 },
        { id: 'stat-corners', name: 'Córners', teamA: 0, teamB: 0 },
        { id: 'stat-offsides', name: 'Fueras de juego', teamA: 0, teamB: 0 },
        { id: 'stat-saves', name: 'Paradas', teamA: 0, teamB: 0 }
    ];
    // Guardar las predeterminadas en localStorage para futuras visitas
    localStorage.setItem('customStats', JSON.stringify(customStats));
}

// Renderiza las tarjetas de estadísticas personalizadas
function renderCustomStats() {
    generalStatsContainer.innerHTML = ''; // Limpiar el contenedor
    customStats.forEach(stat => {
        const statCard = document.createElement('div');
        statCard.classList.add('stat-card');
        statCard.dataset.statId = stat.id; // Añadir un ID para identificarla

        statCard.innerHTML = `
            <h3>
                <span class="stat-title">${stat.name}</span>
                <button class="edit-stat-btn" data-id="${stat.id}">✏️</button>
                <button class="delete-stat-btn" data-id="${stat.id}">🗑️</button>
            </h3>
            <div class="stat-controls-compact">
                <!-- Controles Equipo A (izquierda del contador) -->
                <div class="team-controls">
                    <button class="reset-btn" data-team="A" data-stat="${stat.id}">🔄</button>
                    <button class="minus-btn" data-team="A" data-stat="${stat.id}">-</button>
                    <button class="plus-btn" data-team="A" data-stat="${stat.id}">+</button>
                </div>
                <!-- Contador Central (0 - 0) -->
                <span class="score-display" data-team-main-counter="${stat.id}">0 - 0</span>
                <!-- Controles Equipo B (derecha del contador) -->
                <div class="team-controls">
                    <button class="reset-btn" data-team="B" data-stat="${stat.id}">🔄</button>
                    <button class="minus-btn" data-team="B" data-stat="${stat.id}">-</button>
                    <button class="plus-btn" data-team="B" data-stat="${stat.id}">+</button>
                </div>
            </div>
        `;
        generalStatsContainer.appendChild(statCard);
    });
    addStatCardEventListeners(); // Volver a vincular los eventos
    updateCustomStatCounters(); // Llamar para mostrar los valores iniciales/actuales
}

// Función para actualizar solo los contadores de las stats personalizadas
function updateCustomStatCounters() {
    customStats.forEach(stat => {
        const scoreDisplayEl = generalStatsContainer.querySelector(`.score-display[data-team-main-counter="${stat.id}"]`);
        if (scoreDisplayEl) {
            scoreDisplayEl.textContent = `${stat.teamA} - ${stat.teamB}`;
        }
    });
}

function addStatCardEventListeners() {
    generalStatsContainer.removeEventListener('click', handleCustomStatControls); // Evitar duplicados
    generalStatsContainer.addEventListener('click', handleCustomStatControls);
}

// Maneja los clics en los botones de estadísticas personalizadas
function handleCustomStatControls(e) {
    const target = e.target;
    if (target.classList.contains('plus-btn') || target.classList.contains('minus-btn') || target.classList.contains('reset-btn')) {
        const team = target.dataset.team;
        const statId = target.dataset.stat;

        const statToUpdate = customStats.find(s => s.id === statId);
        if (!statToUpdate) return;

        if (team === 'A') {
            if (target.classList.contains('plus-btn')) {
                statToUpdate.teamA++;
            } else if (target.classList.contains('minus-btn')) {
                statToUpdate.teamA = Math.max(0, statToUpdate.teamA - 1);
            } else if (target.classList.contains('reset-btn')) {
                statToUpdate.teamA = 0;
            }
        } else if (team === 'B') {
            if (target.classList.contains('plus-btn')) {
                statToUpdate.teamB++;
            } else if (target.classList.contains('minus-btn')) {
                statToUpdate.teamB = Math.max(0, statToUpdate.teamB - 1);
            } else if (target.classList.contains('reset-btn')) {
                statToUpdate.teamB = 0;
            }
        }
        localStorage.setItem('customStats', JSON.stringify(customStats)); // Guardar el estado actual de las stats
        updateCustomStatCounters(); // Actualizar el DOM
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
        renderCustomStats();
    } else if (target.classList.contains('edit-stat-btn')) {
        const statIdToEdit = target.dataset.id;
        const statToEdit = customStats.find(stat => stat.id === statIdToEdit);
        if (statToEdit) {
            const newName = prompt("Editar nombre de la estadística:", statToEdit.name);
            if (newName && newName.trim() !== "") {
                statToEdit.name = newName.trim();
                localStorage.setItem('customStats', JSON.stringify(customStats));
                renderCustomStats();
            }
        }
    }
}


// ====== INICIALIZACIÓN =======
document.addEventListener('DOMContentLoaded', () => {
    updateTeamLabels();
    renderCustomStats(); // Cargar y renderizar las estadísticas personalizadas existentes

    // Se elimina la llamada a loadMatchesHistory();

    // Registrar Service Worker
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
        // PAUSAR TAMBIÉN LA POSESIÓN SI EL PARTIDO ESTÁ PAUSADO
        if (currentPossession) { // Si hay posesión activa al pausar el partido
            togglePossession(currentPossession); // Llamar para detener la posesión
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
    // Detener y reiniciar la posesión si se reinicia el partido
    resetPossession();
});

// Posesión de Balón
togglePossessionABtn.addEventListener('click', () => togglePossession('A'));
togglePossessionBBtn.addEventListener('click', () => togglePossession('B'));
resetPossessionBtn.addEventListener('click', resetPossession);

function togglePossession(team) {
    // AHORA: SOLO INICIAR/CAMBIAR POSESIÓN SI EL TIEMPO DE PARTIDO ESTÁ CORRIENDO
    if (!isMatchTimerRunning && currentPossession === null) {
        alert('Para iniciar la posesión, primero debes iniciar el tiempo de partido.');
        return;
    }

    // Detener ambos intervalos primero
    clearInterval(possessionIntervalA);
    clearInterval(possessionIntervalB);

    if (currentPossession === team) {
        // Si ya estaba en posesión este equipo, la detenemos
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
        } else {
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

        customStats.push({ id: newId, name: newStatName, teamA: 0, teamB: 0 });
        localStorage.setItem('customStats', JSON.stringify(customStats)); // Guardar en localStorage
        newStatNameInput.value = '';
        renderCustomStats(); // Volver a renderizar para mostrar la nueva stat
    }
});

// Reiniciar Todas las Estadísticas
resetAllBtn.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que quieres reiniciar TODAS las estadísticas del partido actual?')) { // Se elimina la mención a "partidos guardados"
        // Marcador
        teamAGoalsEl.textContent = '0';
        teamBGoalsEl.textContent = '0';

        // Tiempo de Partido
        clearInterval(matchTimerInterval);
        matchTimeElapsed = 0;
        matchTimerEl.textContent = formatTime(matchTimeElapsed);
        toggleMatchTimerBtn.textContent = '▶️ Iniciar';
        isMatchTimerRunning = false;

        // Posesión de Balón
        resetPossession();

        // Estadísticas Personalizadas - Reiniciar los valores en el array y en el DOM
        customStats.forEach(stat => {
            stat.teamA = 0;
            stat.teamB = 0;
        });
        localStorage.setItem('customStats', JSON.stringify(customStats)); // Guardar el estado reiniciado
        updateCustomStatCounters(); // Actualizar el DOM con los 0s
    }
});


// Se eliminan todas las funciones y lógica relacionadas con Guardar y Cargar Partidos:
// collectCurrentMatchData, saveCurrentMatch, loadMatchesHistory, loadSelectedMatch, deleteMatch.
// También se elimina el Event Listener para saveMatchBtn.
