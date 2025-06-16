// Constantes y variables globales
const teamANameInput = document.getElementById('teamA-name');
const teamBNameInput = document.getElementById('teamB-name');
const mainScoreDisplay = document.getElementById('mainScoreDisplay');
const plusAButton = document.getElementById('plusA');
const minusAButton = document.getElementById('minusA');
const plusBButton = document.getElementById('plusB');
const minusBButton = document.getElementById('minusB');
const matchTimerDisplay = document.getElementById('match-timer');
const startPauseMatchTimerButton = document.getElementById('start-pause-match-timer');
const resetMatchTimerButton = document.getElementById('reset-match-timer');
const teamAPossessionName = document.getElementById('teamA-possession-name');
const teamBPossessionName = document.getElementById('teamB-possession-name');
const possessionTimerADisplay = document.getElementById('possession-timer-A');
const possessionTimerBDisplay = document.getElementById('possession-timer-B');
const startPossessionAButton = document.getElementById('start-possession-A');
const startPossessionBButton = document.getElementById('start-possession-B');
const resetPossessionButton = document.getElementById('reset-possession');
const possessionBarFill = document.getElementById('possession-bar-fill');
const possessionPercentA = document.getElementById('possession-percent-A');
const possessionPercentB = document.getElementById('possession-percent-B');
const newStatNameInput = document.getElementById('new-stat-name');
const addStatButton = document.getElementById('add-stat-btn');
const customStatsGrid = document.getElementById('custom-stats-grid');
const resetAllButton = document.getElementById('reset-all');

const eventModal = document.getElementById('eventModal');
const closeButton = document.querySelector('.modal .close-button');
const modalEventList = document.getElementById('modal-event-list');
const modalTitle = document.getElementById('modal-title');

const goalsList = document.getElementById('goals-list');
const viewGoalsHistoryButton = document.getElementById('view-goals-history-button');

// === Variables y elementos para el cronómetro de fútbol ===
const halfIndicator = document.getElementById('half-indicator');
const matchStatusDisplay = document.getElementById('match-status-display');
const totalAddedTimeDisplay = document.getElementById('total-added-time-display');

// === Elementos para el selector de mitad ===
const halfSelector = document.getElementById('half-selector');
const selectHalf1Button = document.getElementById('select-half-1');
const selectHalf2Button = document.getElementById('select-half-2');


let scoreA = 0;
let scoreB = 0;
let matchTimerInterval;
let matchTime = 0; // en segundos, el tiempo total transcurrido del partido (0 a 90+extra)
let isMatchTimerRunning = false;

let possessionTimerAInterval;
let possessionTimerBInterval;
let possessionTimeA = 0;
let possessionTimeB = 0;
let currentPossessionTeam = null;

// === Variables de tiempo para fútbol ===
let currentHalf = 1; // 1 o 2
const REGULAR_HALF_DURATION = 45 * 60; // 45 minutos en segundos
let extraTimeFirstHalfDisplay = 0; // Se usará para el display, no para la lógica de fin de mitad
let extraTimeSecondHalfDisplay = 0; // Se usará para el display
let totalTimeFirstHalf = 0; // Duración total de la primera mitad (45 + el tiempo REAL que duró)

// Estado del partido: 'not-started', 'running', 'paused', 'half-time-ended', 'full-time'
let matchState = 'not-started';


// Estadísticas personalizadas iniciales / preconfiguradas
const initialCustomStats = [
    { id: 101, name: 'Tiros a puerta', valueA: 0, valueB: 0, events: [] },
    { id: 102, name: 'Faltas', valueA: 0, valueB: 0, events: [] },
    { id: 103, name: 'Tarjetas Amarillas', valueA: 0, valueB: 0, events: [] },
    { id: 104, name: 'Tarjetas Rojas', valueA: 0, valueB: 0, events: [] },
    { id: 105, name: 'Saques de esquina', valueA: 0, valueB: 0, events: [] },
    { id: 106, name: 'Fueras de juego', valueA: 0, valueB: 0, events: [] },
    { id: 107, name: 'Penaltis', valueA: 0, valueB: 0, events: [] },
    { id: 108, name: 'Paradas', valueA: 0, valueB: 0, events: [] },
];

let customStats = [];
let goalsHistory = [];

// Función para actualizar el marcador en el HTML
function updateScoreDisplay() {
    mainScoreDisplay.textContent = `${scoreA} - ${scoreB}`;
    localStorage.setItem('scoreA', scoreA);
    localStorage.setItem('scoreB', scoreB);
}

// Función para formatear el tiempo (HH:MM)
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// === Funciones para el cronómetro de partido ===
function updateMatchTimerDisplay() {
    let displayTime = matchTime;
    let actualTimeInHalf = 0; // Tiempo real transcurrido en la mitad actual

    if (currentHalf === 1) {
        actualTimeInHalf = matchTime;
        displayTime = matchTime; // La 1ª mitad siempre empieza en 00:00
        if (actualTimeInHalf >= REGULAR_HALF_DURATION) {
            extraTimeFirstHalfDisplay = actualTimeInHalf - REGULAR_HALF_DURATION;
        } else {
            extraTimeFirstHalfDisplay = 0;
        }
        totalAddedTimeDisplay.textContent = extraTimeFirstHalfDisplay > 0 ? `+${formatTime(extraTimeFirstHalfDisplay)}` : '';

    } else if (currentHalf === 2) {
        // El tiempo transcurrido en la segunda mitad es matchTime - totalTimeFirstHalf
        actualTimeInHalf = matchTime - totalTimeFirstHalf;
        displayTime = REGULAR_HALF_DURATION + actualTimeInHalf; // Mostrar 45:00 + tiempo extra de 2da mitad
        if (actualTimeInHalf >= REGULAR_HALF_DURATION) {
            extraTimeSecondHalfDisplay = actualTimeInHalf - REGULAR_HALF_DURATION;
        } else {
            extraTimeSecondHalfDisplay = 0;
        }
        totalAddedTimeDisplay.textContent = extraTimeSecondHalfDisplay > 0 ? `+${formatTime(extraTimeSecondHalfDisplay)}` : '';

        // Asegurarse de que no muestre tiempos negativos si matchTime es menor que totalTimeFirstHalf
        if (displayTime < REGULAR_HALF_DURATION) {
            displayTime = REGULAR_HALF_DURATION;
        }
    }

    matchTimerDisplay.textContent = formatTime(displayTime);
    halfIndicator.textContent = `${currentHalf}ª Mitad`;
    updateMatchStatusDisplay(); // Asegurar que el estado y los botones se actualizan
    localStorage.setItem('matchTime', matchTime);
    localStorage.setItem('currentHalf', currentHalf);
    localStorage.setItem('matchState', matchState);
    localStorage.setItem('totalTimeFirstHalf', totalTimeFirstHalf);
}

function updateMatchStatusDisplay() {
    let statusText = '';
    let startPauseBtnText = 'Iniciar';

    startPauseMatchTimerButton.style.display = 'inline-block';
    halfSelector.style.display = 'flex';

    switch (matchState) {
        case 'not-started':
            statusText = 'Listo para iniciar el partido.';
            startPauseBtnText = 'Iniciar';
            break;
        case 'running':
            statusText = `Partido en curso (${currentHalf}ª mitad).`;
            startPauseBtnText = 'Pausar';
            break;
        case 'paused':
            statusText = `Partido pausado en ${formatTime(matchTime)}.`;
            startPauseBtnText = 'Reanudar';
            break;
        case 'half-time-ended':
            statusText = `¡Fin de la 1ª Mitad (${formatTime(totalTimeFirstHalf)})! Selecciona 2ª Mitad para continuar.`;
            startPauseMatchTimerButton.style.display = 'none'; // No se puede iniciar/pausar desde aquí
            break;
        case 'full-time':
            statusText = '¡PARTIDO FINALIZADO!';
            startPauseMatchTimerButton.style.display = 'none';
            break;
    }
    matchStatusDisplay.textContent = statusText;
    startPauseMatchTimerButton.textContent = startPauseBtnText;
    updateHalfSelectorButtons();
}

function toggleMatchTimer() {
    if (isMatchTimerRunning) {
        clearInterval(matchTimerInterval);
        isMatchTimerRunning = false;
        matchState = 'paused';
        stopPossession();
    } else {
        if (matchState === 'full-time') {
            alert('El partido ya ha finalizado. Por favor, reinicia para empezar uno nuevo.');
            return;
        }
        if (matchState === 'half-time-ended' && currentHalf === 1) {
            alert('La primera mitad ha terminado. Por favor, selecciona la 2ª Mitad para continuar.');
            return;
        }

        if (matchState === 'not-started') {
            if (currentHalf === 1) {
                matchTime = 0; // Asegura que la 1ª mitad siempre inicia en 0
            } else if (currentHalf === 2) {
                // Si la 2da mitad empieza y no se ha definido totalTimeFirstHalf, asumimos 45 min
                if (totalTimeFirstHalf === 0) {
                    totalTimeFirstHalf = REGULAR_HALF_DURATION;
                }
                matchTime = totalTimeFirstHalf; // La 2da mitad empieza el tiempo donde terminó la 1ra
            }
        }

        matchState = 'running';
        isMatchTimerRunning = true;
        matchTimerInterval = setInterval(() => {
            matchTime++;

            // Fin de la 1ª mitad (a los 45 minutos exactos si no se ha superado ya)
            if (currentHalf === 1 && matchTime >= REGULAR_HALF_DURATION && matchState !== 'half-time-ended') {
                if (matchTime === REGULAR_HALF_DURATION) {
                    /*
                    clearInterval(matchTimerInterval);
                    isMatchTimerRunning = false;
                    matchState = 'half-time-ended';
                    totalTimeFirstHalf = matchTime; // Guardar el tiempo final real de la primera mitad
                    stopPossession();
                    alert(`¡Fin de la 1ª Mitad (${formatTime(totalTimeFirstHalf)})!`);
                    */
                }
            }
            // Fin del Partido (a los 90 minutos absolutos si no se ha superado ya)
            else if (currentHalf === 2 && matchTime >= totalTimeFirstHalf + REGULAR_HALF_DURATION && matchState !== 'full-time') {
                 if (matchTime === totalTimeFirstHalf + REGULAR_HALF_DURATION) {
                    /*
                    clearInterval(matchTimerInterval);
                    isMatchTimerRunning = false;
                    matchState = 'full-time';
                    stopPossession();
                    alert('¡Partido Finalizado!');
                    */
                 }
            }
            updateMatchTimerDisplay();
        }, 1000);
    }
    updateMatchStatusDisplay();
    localStorage.setItem('isMatchTimerRunning', isMatchTimerRunning);
}

function resetMatchTimer() {
    clearInterval(matchTimerInterval);
    matchTime = 0;
    extraTimeFirstHalfDisplay = 0;
    extraTimeSecondHalfDisplay = 0;
    totalTimeFirstHalf = 0;
    isMatchTimerRunning = false;
    currentHalf = 1;
    matchState = 'not-started';
    updateMatchTimerDisplay();
    updateHalfSelectorButtons();

    localStorage.removeItem('matchTime');
    localStorage.removeItem('isMatchTimerRunning');
    localStorage.removeItem('currentHalf');
    localStorage.removeItem('matchState');
    localStorage.removeItem('totalTimeFirstHalf');

    stopPossession();
    updateMatchStatusDisplay();
}


// === Funciones del selector de mitad ===
function selectHalf(halfNum) {
    if (isMatchTimerRunning) {
        toggleMatchTimer(); // Pausar si está corriendo
        alert('El temporizador del partido ha sido pausado para cambiar de mitad.');
    }

    if (halfNum === 1) {
        if (currentHalf === 2) {
            if (!confirm('Estás volviendo a la 1ª Mitad. Esto reiniciará el tiempo de la 1ª Mitad. ¿Estás seguro?')) {
                return;
            }
        }
        currentHalf = 1;
        matchTime = 0;
        extraTimeFirstHalfDisplay = 0;
        extraTimeSecondHalfDisplay = 0;
        totalTimeFirstHalf = 0;
        matchState = 'not-started';
    } else if (halfNum === 2) {
        if (currentHalf === 1 && matchTime < REGULAR_HALF_DURATION && !confirm('La 1ª mitad aún no ha alcanzado los 45 minutos. ¿Deseas iniciar la 2ª mitad de todas formas? El tiempo de la 1ª mitad se establecerá a 45 minutos.')) {
            return;
        }

        currentHalf = 2;
        if (totalTimeFirstHalf === 0 || totalTimeFirstHalf < REGULAR_HALF_DURATION) {
            totalTimeFirstHalf = REGULAR_HALF_DURATION;
        }
        matchTime = totalTimeFirstHalf;
        extraTimeSecondHalfDisplay = 0;
        matchState = 'not-started';
    }

    localStorage.setItem('currentHalf', currentHalf);
    localStorage.setItem('matchTime', matchTime);
    localStorage.setItem('totalTimeFirstHalf', totalTimeFirstHalf);
    localStorage.setItem('matchState', matchState);

    updateMatchTimerDisplay();
    updateHalfSelectorButtons();
    updateMatchStatusDisplay();
}

function updateHalfSelectorButtons() {
    selectHalf1Button.classList.remove('active');
    selectHalf2Button.classList.remove('active');
    selectHalf1Button.disabled = false;
    selectHalf2Button.disabled = false;

    if (currentHalf === 1) {
        selectHalf1Button.classList.add('active');
    } else if (currentHalf === 2) {
        selectHalf2Button.classList.add('active');
        if (matchState === 'full-time') {
            selectHalf1Button.disabled = true;
            selectHalf2Button.disabled = true;
        }
    }

    if (matchState === 'full-time') {
        selectHalf1Button.disabled = true;
        selectHalf2Button.disabled = true;
    }

    if (currentHalf === 1 && matchTime < REGULAR_HALF_DURATION && matchState === 'running') {
        selectHalf2Button.disabled = true;
    }
}


// Función para actualizar el display de posesión
function updatePossessionDisplays() {
    possessionTimerADisplay.textContent = formatTime(possessionTimeA);
    possessionTimerBDisplay.textContent = formatTime(possessionTimeB);

    const totalTime = possessionTimeA + possessionTimeB;
    let percentA = 0;
    let percentB = 0;

    if (totalTime > 0) {
        percentA = (possessionTimeA / totalTime) * 100;
        percentB = (possessionTimeB / totalTime) * 100;
    }

    possessionBarFill.style.width = `${percentA}%`;
    possessionPercentA.textContent = `${Math.round(percentA)}%`;
    possessionPercentB.textContent = `${Math.round(percentB)}%`;

    localStorage.setItem('possessionTimeA', possessionTimeA);
    localStorage.setItem('possessionTimeB', possessionTimeB);
}

// Función para iniciar la posesión de un equipo
function startPossession(team) {
    if (matchState !== 'running') {
        alert('El temporizador del partido debe estar en marcha para controlar la posesión.');
        return;
    }

    if (currentPossessionTeam === team) return;

    if (currentPossessionTeam === 'A') clearInterval(possessionTimerAInterval);
    if (currentPossessionTeam === 'B') clearInterval(possessionTimerBInterval);

    startPossessionAButton.classList.remove('active');
    startPossessionBButton.classList.remove('active');

    currentPossessionTeam = team;
    if (team === 'A') {
        possessionTimerAInterval = setInterval(() => {
            possessionTimeA++;
            updatePossessionDisplays();
        }, 1000);
        startPossessionAButton.classList.add('active');
    } else if (team === 'B') {
        possessionTimerBInterval = setInterval(() => {
            possessionTimeB++;
            updatePossessionDisplays();
        }, 1000);
        startPossessionBButton.classList.add('active');
    }
    localStorage.setItem('currentPossessionTeam', currentPossessionTeam);
}

// Función para detener la posesión (útil si se reinicia o se para el partido)
function stopPossession() {
    clearInterval(possessionTimerAInterval);
    clearInterval(possessionTimerBInterval);
    currentPossessionTeam = null;
    startPossessionAButton.classList.remove('active');
    startPossessionBButton.classList.remove('active');
    localStorage.removeItem('currentPossessionTeam');
}

// Función para resetear la posesión
function resetPossession() {
    stopPossession();
    possessionTimeA = 0;
    possessionTimeB = 0;
    updatePossessionDisplays();
    localStorage.removeItem('possessionTimeA');
    localStorage.removeItem('possessionTimeB');
}


// Función para renderizar una tarjeta de estadística
function renderStatCard(stat) {
    const statCard = document.createElement('div');
    statCard.classList.add('stat-card');
    statCard.dataset.id = stat.id;

    const header = document.createElement('div');
    header.classList.add('stat-card-header');

    const statTitle = document.createElement('span');
    statTitle.classList.add('stat-title');
    statTitle.textContent = stat.name;
    header.appendChild(statTitle);

    const actionIcons = document.createElement('div');
    actionIcons.classList.add('stat-action-icons');

    const viewButton = document.createElement('button');
    viewButton.innerHTML = '📋';
    viewButton.title = 'Ver Eventos';
    viewButton.dataset.action = 'view';
    actionIcons.appendChild(viewButton);

    const editButton = document.createElement('button');
    editButton.innerHTML = '✏️';
    editButton.title = 'Editar Nombre';
    editButton.dataset.action = 'edit';
    actionIcons.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '🗑️';
    deleteButton.title = 'Eliminar Estadística';
    deleteButton.dataset.action = 'delete';
    actionIcons.appendChild(deleteButton);

    header.appendChild(actionIcons);
    statCard.appendChild(header);

    // DISPLAY DEL VALOR DE LA ESTADÍSTICA (AHORA MÁS PROMINENTE)
    const statTotalDisplay = document.createElement('span');
    statTotalDisplay.classList.add('stat-total-display');
    statTotalDisplay.textContent = `${stat.valueA} - ${stat.valueB}`;
    statCard.appendChild(statTotalDisplay);


    const controlsGroup = document.createElement('div');
    controlsGroup.classList.add('stat-controls-group');

    const teamAControls = document.createElement('div');
    teamAControls.classList.add('team-buttons-column');
    const plusA = document.createElement('button');
    plusA.classList.add('plus-btn');
    plusA.textContent = '+';
    plusA.dataset.team = 'A';
    plusA.dataset.action = 'increment';
    const minusA = document.createElement('button');
    minusA.classList.add('minus-btn');
    minusA.textContent = '-';
    minusA.dataset.team = 'A';
    minusA.dataset.action = 'decrement';
    teamAControls.appendChild(plusA);
    teamAControls.appendChild(minusA);
    controlsGroup.appendChild(teamAControls);

    // NOTA: EL statTotalDisplay se ha movido fuera de controlsGroup, directamente bajo header

    const teamBControls = document.createElement('div');
    teamBControls.classList.add('team-buttons-column');
    const plusB = document.createElement('button');
    plusB.classList.add('plus-btn');
    plusB.textContent = '+';
    plusB.dataset.team = 'B';
    plusB.dataset.action = 'increment';
    const minusB = document.createElement('button');
    minusB.classList.add('minus-btn');
    minusB.textContent = '-';
    minusB.dataset.team = 'B';
    minusB.dataset.action = 'decrement';
    teamBControls.appendChild(plusB);
    teamBControls.appendChild(minusB);
    controlsGroup.appendChild(teamBControls);

    statCard.appendChild(controlsGroup);

    return statCard;
}

// Función para añadir una nueva estadística
function addCustomStat() {
    const statName = newStatNameInput.value.trim();
    if (statName) {
        const newStat = {
            id: Date.now(),
            name: statName,
            valueA: 0,
            valueB: 0,
            events: []
        };
        customStats.push(newStat);
        saveCustomStats();
        renderCustomStats();
        newStatNameInput.value = '';
    } else {
        alert('Por favor, introduce un nombre para la estadística.');
    }
}

// Función para renderizar todas las estadísticas personalizadas
function renderCustomStats() {
    customStatsGrid.innerHTML = '';
    if (customStats.length === 0) {
        const noStatsMessage = document.createElement('p');
        noStatsMessage.textContent = 'No hay estadísticas personalizadas. ¡Añade una o reinicia para cargar las predeterminadas!';
        noStatsMessage.style.textAlign = 'center';
        noStatsMessage.style.color = '#777';
        noStatsMessage.style.marginTop = '20px';
        customStatsGrid.appendChild(noStatsMessage);
    }
    customStats.forEach(stat => {
        customStatsGrid.appendChild(renderStatCard(stat));
    });
}

// Función para guardar estadísticas en localStorage
function saveCustomStats() {
    localStorage.setItem('customStats', JSON.stringify(customStats));
}

// Función para cargar estadísticas de localStorage o usar predefinidas
function loadCustomStats() {
    const savedStats = localStorage.getItem('customStats');
    if (savedStats) {
        try {
            const parsedStats = JSON.parse(savedStats);
            if (Array.isArray(parsedStats) && parsedStats.every(s => typeof s.id === 'number' && typeof s.name === 'string')) {
                customStats = parsedStats;
            } else {
                console.warn("Datos de customStats en localStorage corruptos o con formato incorrecto. Cargando estadísticas iniciales.");
                customStats = initialCustomStats.map(stat => ({ ...stat }));
            }
        } catch (e) {
            console.error("Error al parsear custom stats de localStorage:", e);
            console.warn("Cargando estadísticas iniciales.");
            customStats = initialCustomStats.map(stat => ({ ...stat }));
        }
    } else {
        customStats = initialCustomStats.map(stat => ({ ...stat }));
    }
    renderCustomStats();
}


// Funciones para el modal de eventos
function showEventModal(events, statName) {
    console.log(`Mostrando modal para: ${statName} con ${events.length} eventos.`); // Debugging
    if (modalTitle) {
        modalTitle.textContent = `Historial de ${statName}`;
    } else {
        console.error("Elemento con ID 'modal-title' no encontrado en el DOM.");
    }

    modalEventList.innerHTML = '';
    if (events.length === 0) {
        const li = document.createElement('li');
        li.textContent = `No hay eventos registrados para ${statName}.`;
        modalEventList.appendChild(li);
    } else {
        events.forEach(event => {
            const li = document.createElement('li');
            li.classList.add(event.team === teamANameInput.value ? 'team-A' : 'team-B');

            li.textContent = `${event.time} - ${event.team}`;
            modalEventList.appendChild(li);
        });
    }
    eventModal.style.display = 'flex';
}

function hideEventModal() {
    eventModal.style.display = 'none';
}


// Función para añadir un gol al historial
function addGoalToHistory(teamName) {
    const goalTime = formatTime(matchTime);
    const currentScore = `${scoreA} - ${scoreB}`;
    const goalEntry = { time: goalTime, team: teamName, score: currentScore };
    goalsHistory.push(goalEntry);
    localStorage.setItem('goalsHistory', JSON.stringify(goalsHistory));
    renderGoalsHistory(); // Volver a renderizar el resumen
}

// Función para eliminar el ÚLTIMO gol del equipo especificado del historial
function removeLastGoalFromHistory(teamName) {
    for (let i = goalsHistory.length - 1; i >= 0; i--) {
        if (goalsHistory[i].team === teamName) {
            goalsHistory.splice(i, 1);
            break;
        }
    }
    localStorage.setItem('goalsHistory', JSON.stringify(goalsHistory));
    renderGoalsHistory(); // Volver a renderizar el resumen
}


// Función para renderizar el historial de goles (RESUMEN en la vista principal)
function renderGoalsHistory() {
    goalsList.innerHTML = '';
    const savedGoals = localStorage.getItem('goalsHistory');
    if (savedGoals) {
        try {
            const parsedGoals = JSON.parse(savedGoals);
            if (Array.isArray(parsedGoals)) {
                goalsHistory = parsedGoals;
            } else {
                console.warn("Datos de goalsHistory en localStorage corruptos. Reiniciando historial de goles.");
                goalsHistory = [];
            }
        } catch (e) {
            console.error("Error al parsear goals history de localStorage:", e);
            goalsHistory = [];
        }
    } else {
        goalsHistory = [];
    }

    if (goalsHistory.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Aún no se han marcado goles.';
        goalsList.appendChild(li);
        viewGoalsHistoryButton.style.display = 'none'; // Si no hay goles, ocultar el botón
    } else {
        // Solo mostrar el último gol en la lista principal
        const lastGoal = goalsHistory[goalsHistory.length - 1];
        const li = document.createElement('li');
        li.classList.add(lastGoal.team === teamANameInput.value ? 'team-A' : 'team-B');
        li.innerHTML = `<span class="event-time">${lastGoal.time}</span> - <span class="event-team">${lastGoal.team}</span> <span class="goal-score">(${lastGoal.score})</span> (Último gol)`;
        goalsList.appendChild(li);

        // Mostrar el botón "Ver Historial Completo" si hay al menos un gol
        viewGoalsHistoryButton.style.display = 'block';
    }
}

// Función para mostrar el modal con el historial completo de goles
function showGoalsHistoryModal() {
    modalTitle.textContent = 'Historial de Goles';
    modalEventList.innerHTML = '';

    if (goalsHistory.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No hay goles registrados.';
        modalEventList.appendChild(li);
    } else {
        goalsHistory.forEach(goal => {
            const li = document.createElement('li');
            li.classList.add(goal.team === teamANameInput.value ? 'team-A' : 'team-B');
            li.innerHTML = `<span class="event-time">${goal.time}</span> - <span class="event-team">${goal.team}</span> <span class="goal-score">(${goal.score})</span>`;
            modalEventList.appendChild(li);
        });
    }
    eventModal.style.display = 'flex';
}


// Event Listeners - Inicialización al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    // Cargar nombres de equipos
    teamANameInput.value = localStorage.getItem('teamAName') || 'Equipo A';
    teamBNameInput.value = localStorage.getItem('teamBName') || 'Equipo B';
    teamAPossessionName.textContent = teamANameInput.value;
    teamBPossessionName.textContent = teamBNameInput.value;

    // Cargar marcador
    scoreA = parseInt(localStorage.getItem('scoreA')) || 0;
    scoreB = parseInt(localStorage.getItem('scoreB')) || 0;
    updateScoreDisplay();

    // Cargar temporizador de partido
    matchTime = parseInt(localStorage.getItem('matchTime')) || 0;
    currentHalf = parseInt(localStorage.getItem('currentHalf')) || 1;
    totalTimeFirstHalf = parseInt(localStorage.getItem('totalTimeFirstHalf')) || REGULAR_HALF_DURATION;

    if (currentHalf === 2 && totalTimeFirstHalf === 0) {
        totalTimeFirstHalf = REGULAR_HALF_DURATION;
    }

    if (currentHalf === 1 && matchTime >= REGULAR_HALF_DURATION) {
        extraTimeFirstHalfDisplay = matchTime - REGULAR_HALF_DURATION;
    } else if (currentHalf === 2 && matchTime >= totalTimeFirstHalf + REGULAR_HALF_DURATION) {
        extraTimeSecondHalfDisplay = matchTime - (totalTimeFirstHalf + REGULAR_HALF_DURATION);
    }

    matchState = localStorage.getItem('matchState') || 'not-started';
    isMatchTimerRunning = JSON.parse(localStorage.getItem('isMatchTimerRunning')) || false;


    updateMatchTimerDisplay();
    updateMatchStatusDisplay();
    updateHalfSelectorButtons();

    if (isMatchTimerRunning && matchState === 'running') {
        toggleMatchTimer(); // Reinicia el temporizador si estaba corriendo
    }


    // Cargar posesión
    possessionTimeA = parseInt(localStorage.getItem('possessionTimeA')) || 0;
    possessionTimeB = parseInt(localStorage.getItem('possessionTimeB')) || 0;
    currentPossessionTeam = localStorage.getItem('currentPossessionTeam');
    updatePossessionDisplays();
    if (matchState === 'running' && currentPossessionTeam) {
        startPossession(currentPossessionTeam);
    }

    // Cargar estadísticas personalizadas
    loadCustomStats();

    // Cargar y renderizar historial de goles - Asegura que se ejecuta al final para reflejar el estado correcto
    renderGoalsHistory();
});

// Event Listeners para nombres de equipos
teamANameInput.addEventListener('input', () => {
    localStorage.setItem('teamAName', teamANameInput.value);
    teamAPossessionName.textContent = teamANameInput.value;
});
teamBNameInput.addEventListener('input', () => {
    localStorage.setItem('teamBName', teamBNameInput.value);
    teamBPossessionName.textContent = teamBNameInput.value;
});

// Event Listeners para el Marcador
plusAButton.addEventListener('click', () => {
    scoreA++;
    updateScoreDisplay();
    addGoalToHistory(teamANameInput.value);
});
minusAButton.addEventListener('click', () => {
    if (scoreA > 0) {
        scoreA--;
        updateScoreDisplay();
        removeLastGoalFromHistory(teamANameInput.value);
    }
});

plusBButton.addEventListener('click', () => {
    scoreB++;
    updateScoreDisplay();
    addGoalToHistory(teamBNameInput.value);
});
minusBButton.addEventListener('click', () => {
    if (scoreB > 0) {
        scoreB--;
        updateScoreDisplay();
        removeLastGoalFromHistory(teamBNameInput.value);
    }
});


// Event Listeners para el Temporizador del Partido
startPauseMatchTimerButton.addEventListener('click', toggleMatchTimer);
resetMatchTimerButton.addEventListener('click', resetMatchTimer);

// Event Listeners para Posesión
startPossessionAButton.addEventListener('click', () => startPossession('A'));
startPossessionBButton.addEventListener('click', () => startPossession('B'));
resetPossessionButton.addEventListener('click', resetPossession);

// Event Listener para añadir estadística
addStatButton.addEventListener('click', addCustomStat);

// === NUEVOS EVENT LISTENERS PARA EL CONTROL DE MITADES ===
selectHalf1Button.addEventListener('click', () => selectHalf(1));
selectHalf2Button.addEventListener('click', () => selectHalf(2));

// === NUEVO EVENT LISTENER para el botón de Ver Historial Completo de goles ===
viewGoalsHistoryButton.addEventListener('click', showGoalsHistoryModal);


// =================================================================
// Delegación de eventos para las estadísticas personalizadas
// =================================================================
customStatsGrid.addEventListener('click', (event) => {
    const target = event.target;
    const statCard = target.closest('.stat-card');
    if (!statCard) return;

    const statId = parseInt(statCard.dataset.id);
    const stat = customStats.find(s => s.id === statId);

    if (!stat) return;

    const action = target.dataset.action;
    const team = target.dataset.team;

    switch (action) {
        case 'view':
            console.log('Botón "Ver Eventos" clickeado para:', stat.name); // Debugging
            showEventModal(stat.events, stat.name);
            break;
        case 'edit':
            const newName = prompt('Editar nombre de la estadística:', stat.name);
            if (newName && newName.trim() !== '') {
                stat.name = newName.trim();
                statCard.querySelector('.stat-title').textContent = newName.trim();
                saveCustomStats();
            }
            break;
        case 'delete':
            if (confirm(`¿Estás seguro de que quieres eliminar la estadística "${stat.name}"?`)) {
                customStats = customStats.filter(s => s.id !== stat.id);
                saveCustomStats();
                renderCustomStats();
            }
            break;
        case 'increment':
            if (team === 'A') {
                stat.valueA++;
                stat.events.push({ id: Date.now(), time: formatTime(matchTime), team: teamANameInput.value });
            } else if (team === 'B') {
                stat.valueB++;
                stat.events.push({ id: Date.now(), time: formatTime(matchTime), team: teamBNameInput.value });
            }
            break;
        case 'decrement':
            if (team === 'A' && stat.valueA > 0) {
                stat.valueA--;
                const lastEventIndex = stat.events.map(e => e.team).lastIndexOf(teamANameInput.value);
                if (lastEventIndex !== -1) {
                    stat.events.splice(lastEventIndex, 1);
                }
            } else if (team === 'B' && stat.valueB > 0) {
                stat.valueB--;
                const lastEventIndex = stat.events.map(e => e.team).lastIndexOf(teamBNameInput.value);
                if (lastEventIndex !== -1) {
                    stat.events.splice(lastEventIndex, 1);
                }
            }
            break;
        default:
            return;
    }

    if (action === 'increment' || action === 'decrement') {
        const statDisplay = statCard.querySelector('.stat-total-display');
        if (statDisplay) {
            statDisplay.textContent = `${stat.valueA} - ${stat.valueB}`;
        }
        saveCustomStats();
    }
});


// Event Listener para Reiniciar Todo
resetAllButton.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que quieres reiniciar TODO el partido? Esto borrará el marcador, tiempos, posesión y todas las estadísticas personalizadas.')) {
        scoreA = 0;
        scoreB = 0;
        updateScoreDisplay();
        goalsHistory = [];
        localStorage.removeItem('goalsHistory');
        renderGoalsHistory(); // Renderizar el historial de goles después de borrarlo

        resetMatchTimer();

        resetPossession();

        customStats = initialCustomStats.map(stat => ({ ...stat }));
        saveCustomStats();
        renderCustomStats();

        alert('El partido ha sido reiniciado por completo. Las estadísticas predeterminadas han sido cargadas.');
    }
});


// Event Listeners para el Modal
closeButton.addEventListener('click', hideEventModal);
window.addEventListener('click', (event) => {
    if (event.target === eventModal) {
        hideEventModal();
    }
});
