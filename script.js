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

// Guardar y Cargar Partidos (NUEVOS SELECTORES)
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
    document.getElementById('possessionTeamA').textContent = teamANameInput.value || "Equipo A";
    document.getElementById('possessionTeamB').textContent = teamBNameInput.value || "Equipo B";
    // Si tienes stats personalizadas, sus labels se actualizarán con la función de renderizar
}

// Cargar estadísticas personalizadas desde localStorage al inicio
let customStats = JSON.parse(localStorage.getItem('customStats')) || [];

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
            <div class="stat-group">
                <div class="team-stat">
                    <span class="counter" data-team="A" data-stat="${stat.id}">0</span>
                    <span>${teamANameInput.value || "Equipo A"}</span>
                    <div class="controls compact-controls">
                        <button class="reset-btn" data-team="A" data-stat="${stat.id}">🔄</button>
                        <button class="minus-btn" data-team="A" data-stat="${stat.id}">-</button>
                        <button class="plus-btn" data-team="A" data-stat="${stat.id}">+</button>
                    </div>
                </div>
                <div class="team-stat">
                    <span class="counter" data-team="B" data-stat="${stat.id}">0</span>
                    <span>${teamBNameInput.value || "Equipo B"}</span>
                    <div class="controls compact-controls">
                        <button class="reset-btn" data-team="B" data-stat="${stat.id}">🔄</button>
                        <button class="minus-btn" data-team="B" data-stat="${stat.id}">-</button>
                        <button class="plus-btn" data-team="B" data-stat="${stat.id}">+</button>
                    </div>
                </div>
            </div>
        `;
        generalStatsContainer.appendChild(statCard);
    });
    // Volver a vincular los eventos si es necesario
    addStatCardEventListeners();
}

function addStatCardEventListeners() {
    // Escuchar clics en el contenedor de estadísticas personalizadas
    generalStatsContainer.removeEventListener('click', handleCustomStatControls); // Evitar duplicados
    generalStatsContainer.addEventListener('click', handleCustomStatControls);
}

function handleCustomStatControls(e) {
    const target = e.target;
    if (target.classList.contains('plus-btn') || target.classList.contains('minus-btn') || target.classList.contains('reset-btn')) {
        const team = target.dataset.team;
        const statId = target.dataset.stat;
        const counterEl = generalStatsContainer.querySelector(`.counter[data-team="${team}"][data-stat="${statId}"]`);

        if (counterEl) {
            let currentValue = parseInt(counterEl.textContent);
            if (target.classList.contains('plus-btn')) {
                currentValue++;
            } else if (target.classList.contains('minus-btn')) {
                currentValue = Math.max(0, currentValue - 1);
            } else if (target.classList.contains('reset-btn')) {
                currentValue = 0;
            }
            counterEl.textContent = currentValue;
        }
    } else if (target.classList.contains('delete-stat-btn')) {
        const statIdToDelete = target.dataset.id;
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
        possessionPercentA.style.left = 'calc(25% - 20px)'; // Centrar
        possessionPercentB.style.right = 'calc(25% - 20px)';
        return;
    }

    const percentA = (possessionTimeA / totalTime) * 100;
    const percentB = (possessionTimeB / totalTime) * 100;

    possessionBarA.style.width = `${percentA}%`;
    possessionPercentA.textContent = `${Math.round(percentA)}%`;
    possessionPercentB.textContent = `${Math.round(percentB)}%`;

    // Posicionar los porcentajes para que no se solapen
    if (percentA < 15) {
        possessionPercentA.style.left = `${percentA + 2}%`; // Moverlo un poco a la derecha si es pequeño
        possessionPercentB.style.right = '2%';
    } else if (percentB < 15) {
        possessionPercentA.style.left = '2%';
        possessionPercentB.style.right = `${percentB + 2}%`; // Moverlo un poco a la izquierda si es pequeño
    } else {
        possessionPercentA.style.left = '2%';
        possessionPercentB.style.right = '2%';
    }
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


// Estadísticas Personalizadas
addStatBtn.addEventListener('click', () => {
    const newStatName = newStatNameInput.value.trim();
    if (newStatName) {
        customStats.push({ id: Date.now().toString(), name: newStatName, teamA: 0, teamB: 0 }); // Añadir id y valores iniciales
        localStorage.setItem('customStats', JSON.stringify(customStats)); // Guardar en localStorage
        newStatNameInput.value = '';
        renderCustomStats(); // Volver a renderizar para mostrar la nueva stat
    }
});

// Reiniciar Todas las Estadísticas
resetAllBtn.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que quieres reiniciar TODAS las estadísticas del partido actual?')) {
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

        // Estadísticas Personalizadas
        // Necesitamos reiniciar los contadores en el DOM sin eliminar las stats
        generalStatsContainer.querySelectorAll('.counter').forEach(counterEl => {
            counterEl.textContent = '0';
        });
    }
});


// ============ NUEVAS FUNCIONES PARA GUARDAR Y CARGAR PARTIDOS ============

// Función para recolectar todos los datos del partido actual
function collectCurrentMatchData() {
    const customStatValues = {};
    generalStatsContainer.querySelectorAll('.stat-card').forEach(card => {
        const statId = card.dataset.statId;
        const teamAValue = parseInt(card.querySelector(`.counter[data-team="A"]`).textContent);
        const teamBValue = parseInt(card.querySelector(`.counter[data-team="B"]`).textContent);
        const statName = card.querySelector('.stat-title').textContent;
        customStatValues[statId] = { name: statName, teamA: teamAValue, teamB: teamBValue };
    });

    // MODIFICADO: Solo guardamos la fecha, no la hora
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString();

    return {
        id: Date.now(), // Un ID único para el partido
        timestamp: formattedDate, // MODIFICADO: Solo la fecha
        teamA: teamANameInput.value,
        teamB: teamBNameInput.value,
        goalsA: parseInt(teamAGoalsEl.textContent),
        goalsB: parseInt(teamBGoalsEl.textContent),
        matchTime: matchTimeElapsed,
        possessionA: possessionTimeA,
        possessionB: possessionTimeB,
        customStats: customStatValues,
        // Almacenar también la estructura de customStats por si se han añadido nuevas
        customStatsDefinition: customStats.map(stat => ({ id: stat.id, name: stat.name }))
    };
}

// Función para guardar el partido actual en localStorage
function saveCurrentMatch() {
    const matchData = collectCurrentMatchData();
    let savedMatches = JSON.parse(localStorage.getItem('savedMatches')) || [];

    // Opcional: Pedir un nombre para el partido
    const matchName = prompt("Introduce un nombre para el partido (ej: Final Copa 2024 vs EquipoX):", `${matchData.teamA} vs ${matchData.teamB} - ${matchData.timestamp}`);
    if (matchName === null) { // Si el usuario cancela
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

// Función para cargar un partido específico en la interfaz
function loadSelectedMatch(id) {
    const savedMatches = JSON.parse(localStorage.getItem('savedMatches')) || [];
    const matchToLoad = savedMatches.find(match => match.id === id);

    if (matchToLoad && confirm('¿Estás seguro de que quieres cargar este partido? El partido actual se perderá si no lo has guardado.')) {
        // Marcador
        teamANameInput.value = matchToLoad.teamA;
        teamBNameInput.value = matchToLoad.teamB;
        updateTeamLabels(); // Para actualizar los nombres en el DOM

        teamAGoalsEl.textContent = matchToLoad.goalsA;
        teamBGoalsEl.textContent = matchToLoad.goalsB;

        // Tiempo de Partido
        clearInterval(matchTimerInterval); // Asegurarse de detener el timer actual
        matchTimeElapsed = matchToLoad.matchTime;
        matchTimerEl.textContent = formatTime(matchTimeElapsed);
        toggleMatchTimerBtn.textContent = '▶️ Iniciar'; // Asume que el partido cargado está pausado
        isMatchTimerRunning = false;

        // Posesión de Balón
        clearInterval(possessionIntervalA);
        clearInterval(possessionIntervalB);
        possessionTimeA = matchToLoad.possessionA;
        possessionTimeB = matchToLoad.possessionB;
        currentPossession = null; // Reiniciar posesión activa
        possessionTimerAEl.textContent = formatTime(possessionTimeA);
        possessionTimerBEl.textContent = formatTime(possessionTimeB);
        updatePossessionBar();
        updatePossessionButtons();

        // Estadísticas Personalizadas
        // Primero, asegurarnos de que la definición de estadísticas personalizadas está actualizada
        customStats = matchToLoad.customStatsDefinition || [];
        localStorage.setItem('customStats', JSON.stringify(customStats));
        renderCustomStats(); // Renderiza la estructura (con 0s iniciales)

        // Luego, actualizar los valores de las estadísticas cargadas
        // Esto asume que customStatsDefinition del partido guardado es el origen de la verdad
        // Y que los IDs de las stats coinciden.
        setTimeout(() => { // Pequeño delay para asegurar que renderCustomStats ha terminado
            for (const statId in matchToLoad.customStats) {
                const statData = matchToLoad.customStats[statId];
                const teamACounter = generalStatsContainer.querySelector(`.counter[data-team="A"][data-stat="${statId}"]`);
                const teamBCounter = generalStatsContainer.querySelector(`.counter[data-team="B"][data-stat="${statId}"]`);
                if (teamACounter) teamACounter.textContent = statData.teamA;
                if (teamBCounter) teamBCounter.textContent = statData.teamB;
            }
        }, 50); // Un pequeño retraso para asegurar que los elementos se han creado

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

// NOTA: El registro del Service Worker ya está en DOMContentLoaded
