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
let isMatchTimerRunning = false;

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

// Guardar y Cargar Partidos
const saveMatchBtn = document.getElementById('saveMatchBtn');
const matchesHistoryList = document.getElementById('matchesHistoryList');

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

// ============ MODIFICACIÓN CLAVE: ESTADÍSTICAS PREDETERMINADAS ============
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
// =========================================================================

// MODIFICACIÓN: renderCustomStats para la nueva estructura compacta y vertical de botones
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
                <div class="team-controls">
                    <button class="reset-btn" data-team="A" data-stat="${stat.id}">🔄</button>
                    <button class="minus-btn" data-team="A" data-stat="${stat.id}">-</button>
                    <button class="plus-btn" data-team="A" data-stat="${stat.id}">+</button>
                </div>
                <span class="score-display" data-team-main-counter="${stat.id}">0 - 0</span>
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

// NUEVA FUNCIÓN: Para actualizar solo los contadores de las stats personalizadas
function updateCustomStatCounters() {
    customStats.forEach(stat => {
        const scoreDisplayEl = generalStatsContainer.querySelector(`.score-display[data-team-main-counter="${stat.id}"]`);
        if (scoreDisplayEl) {
            scoreDisplayEl.textContent = `${stat.teamA} - ${stat.teamB}`;
        }
    });
}

function addStatCardEventListeners() {
    // Escuchar clics en el contenedor de estadísticas personalizadas
    generalStatsContainer.removeEventListener('click', handleCustomStatControls); // Evitar duplicados
    generalStatsContainer.addEventListener('click', handleCustomStatControls);
}

// MODIFICACIÓN: handleCustomStatControls para la nueva estructura
function handleCustomStatControls(e) {
    const target = e.target;
    if (target.classList.contains('plus-btn') || target.classList.contains('minus-btn') || target.classList.contains('reset-btn')) {
        const team = target.dataset.team;
        const statId = target.dataset.stat;

        // Encuentra la estadística en el array `customStats`
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
        localStorage.setItem('customStats', JSON.stringify(customStats)); // Guardar el estado
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
        renderCustomStats(); // Vuelve a renderizar toda la cuadrícula
    } else if (target.classList.contains('edit-stat-btn')) {
        const statIdToEdit = target.dataset.id;
        const statToEdit = customStats.find(stat => stat.id === statIdToEdit);
        if (statToEdit) {
            const newName = prompt("Editar nombre de la estadística:", statToEdit.name);
            if (newName && newName.trim() !== "") {
                statToEdit.name = newName.trim();
                localStorage.setItem('customStats', JSON.stringify(customStats));
                renderCustomStats(); // Vuelve a renderizar toda la cuadrícula
            }
        }
    }
}


// ====== INICIALIZACIÓN =======
document.addEventListener('DOMContentLoaded', () => {
    updateTeamLabels();
    renderCustomStats(); // Cargar y renderizar las estadísticas personalizadas existentes

    // Cargar partidos guardados al inicio
    loadMatchesHistory();

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
});

// Posesión de Balón
togglePossessionABtn.addEventListener('click', () => togglePossession('A'));
togglePossessionBBtn.addEventListener('click', () => togglePossession('B'));
resetPossessionBtn.addEventListener('click', resetPossession);

function togglePossession(team) {
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
    if (confirm('¿Estás seguro de que quieres reiniciar TODAS las estadísticas del partido actual? Esto no afectará a los partidos guardados.')) {
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
        resetPossession(); // Reutilizamos la función de reseteo de posesión

        // Estadísticas Personalizadas - Reiniciar los valores en el array y en el DOM
        customStats.forEach(stat => {
            stat.teamA = 0;
            stat.teamB = 0;
        });
        localStorage.setItem('customStats', JSON.stringify(customStats)); // Guardar el estado reiniciado
        updateCustomStatCounters(); // Actualizar el DOM con los 0s
    }
});


// ============ NUEVAS FUNCIONES PARA GUARDAR Y CARGAR PARTIDOS ============

// Función para recolectar todos los datos del partido actual
function collectCurrentMatchData() {
    const customStatValues = {};
    customStats.forEach(stat => { // Iterar sobre el array customStats para obtener los valores actuales
        customStatValues[stat.id] = { name: stat.name, teamA: stat.teamA, teamB: stat.teamB };
    });

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString();

    return {
        id: Date.now(),
        timestamp: formattedDate,
        teamA: teamANameInput.value,
        teamB: teamBNameInput.value,
        goalsA: parseInt(teamAGoalsEl.textContent),
        goalsB: parseInt(teamBGoalsEl.textContent),
        matchTime: matchTimeElapsed,
        possessionA: possessionTimeA,
        possessionB: possessionTimeB,
        customStats: customStatValues,
        customStatsDefinition: customStats.map(stat => ({ id: stat.id, name: stat.name }))
    };
}

// Función para guardar el partido actual en localStorage
function saveCurrentMatch() {
    const matchData = collectCurrentMatchData();
    let savedMatches = JSON.parse(localStorage.getItem('savedMatches')) || [];

    const matchName = prompt("Introduce un nombre para el partido (ej: Final Copa 2024 vs EquipoX):", `${matchData.teamA} vs ${matchData.teamB} - ${matchData.timestamp}`);
    if (matchName === null) {
        return;
    }
    matchData.name = matchName || `Partido ${matchData.teamA} vs ${matchData.teamB}`;

    savedMatches.push(matchData);
    localStorage.setItem('savedMatches', JSON.stringify(savedMatches));
    alert('Partido guardado con éxito!');
    loadMatchesHistory(); // Actualizar la lista de partidos guardados
}

// Función para cargar los partidos desde localStorage y renderizar la lista
function loadMatchesHistory() {
    const savedMatches = JSON.parse(localStorage.getItem('savedMatches')) || [];
    matchesHistoryList.innerHTML = ''; // Limpiar la lista actual

    if (savedMatches.length === 0) {
        matchesHistoryList.innerHTML = '<p>No hay partidos guardados aún.</p>';
        return;
    }

    const ul = document.createElement('ul');
    savedMatches.forEach(match => {
        const li = document.createElement('li');
        li.classList.add('match-history-item');
        li.innerHTML = `
            <span>${match.name || `Partido ${match.teamA} vs ${match.teamB}`} (${match.timestamp})</span>
            <div class="match-history-controls">
                <button class="load-match-btn" data-id="${match.id}">Cargar</button>
                <button class="delete-match-btn" data-id="${match.id}">Eliminar</button>
            </div>
        `;
        ul.appendChild(li);
    });
    matchesHistoryList.appendChild(ul);

    // Añadir event listeners a los botones de cargar y eliminar
    ul.addEventListener('click', (e) => {
        const target = e.target;
        const matchId = parseInt(target.dataset.id);

        if (target.classList.contains('load-match-btn')) {
            loadSelectedMatch(matchId);
        } else if (target.classList.contains('delete-match-btn')) {
            deleteMatch(matchId);
        }
    });
}

// MODIFICACIÓN: loadSelectedMatch para la nueva estructura
function loadSelectedMatch(id) {
    const savedMatches = JSON.parse(localStorage.getItem('savedMatches')) || [];
    const matchToLoad = savedMatches.find(match => match.id === id);

    if (matchToLoad && confirm('¿Estás seguro de que quieres cargar este partido? El partido actual se perderá si no lo has guardado.')) {
        // Marcador
        teamANameInput.value = matchToLoad.teamA;
        teamBNameInput.value = matchToLoad.teamB;
        updateTeamLabels();

        teamAGoalsEl.textContent = matchToLoad.goalsA;
        teamBGoalsEl.textContent = matchToLoad.goalsB;

        // Tiempo de Partido
        clearInterval(matchTimerInterval);
        matchTimeElapsed = matchToLoad.matchTime;
        matchTimerEl.textContent = formatTime(matchTimeElapsed);
        toggleMatchTimerBtn.textContent = '▶️ Iniciar';
        isMatchTimerRunning = false;

        // Posesión de Balón
        clearInterval(possessionIntervalA);
        clearInterval(possessionIntervalB);
        possessionTimeA = matchToLoad.possessionA;
        possessionTimeB = matchToLoad.possessionB;
        currentPossession = null;
        possessionTimerAEl.textContent = formatTime(possessionTimeA);
        possessionTimerBEl.textContent = formatTime(possessionTimeB);
        updatePossessionBar();
        updatePossessionButtons();

        // ============ RESTAURACIÓN DE ESTADÍSTICAS PERSONALIZADAS ============
        // Restaurar la definición de customStats del partido guardado
        customStats = matchToLoad.customStatsDefinition || [];
        localStorage.setItem('customStats', JSON.stringify(customStats));
        renderCustomStats(); // Vuelve a renderizar la estructura de las tarjetas

        // Luego, actualizar los valores de las estadísticas cargadas
        // Un pequeño delay para asegurar que el DOM se ha actualizado
        setTimeout(() => {
            for (const statId in matchToLoad.customStats) {
                const statData = matchToLoad.customStats[statId];
                const statObj = customStats.find(s => s.id === statId);
                if (statObj) {
                    statObj.teamA = statData.teamA;
                    statObj.teamB = statData.teamB;
                }
            }
            updateCustomStatCounters(); // Actualizar el DOM con los valores cargados
            localStorage.setItem('customStats', JSON.stringify(customStats)); // Guardar el estado con los valores cargados
        }, 50);
        // ====================================================================

        alert(`Partido "${matchToLoad.name}" cargado con éxito!`);
    }
}

// Función para eliminar un partido del historial
function deleteMatch(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este partido del historial?')) {
        let savedMatches = JSON.parse(localStorage.getItem('savedMatches')) || [];
        savedMatches = savedMatches.filter(match => match.id !== id);
        localStorage.setItem('savedMatches', JSON.stringify(savedMatches));
        alert('Partido eliminado.');
        loadMatchesHistory(); // Actualizar la lista
    }
}

// Event Listener para el botón de Guardar Partido
saveMatchBtn.addEventListener('click', saveCurrentMatch);
