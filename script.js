// Constantes y variables globales (mantienen su función)
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

// === Nuevas variables para el cronómetro de fútbol ===
const halfIndicator = document.getElementById('half-indicator');
const addedTimeInput = document.getElementById('added-time-input');
const setAddedTimeButton = document.getElementById('set-added-time-button');
const matchStatusDisplay = document.getElementById('match-status-display');
const totalAddedTimeDisplay = document.getElementById('total-added-time-display');

// === Elementos para el selector de mitad ===
const halfSelector = document.getElementById('half-selector'); // Contenedor del selector
const selectHalf1Button = document.getElementById('select-half-1');
const selectHalf2Button = document.getElementById('select-half-2');


let scoreA = 0;
let scoreB = 0;
let matchTimerInterval;
let matchTime = 0; // en segundos, el tiempo total transcurrido
let isMatchTimerRunning = false;

let possessionTimerAInterval;
let possessionTimerBInterval;
let possessionTimeA = 0;
let possessionTimeB = 0;
let currentPossessionTeam = null;

// === Variables de tiempo para fútbol ===
let currentHalf = 1; // 1 o 2
const REGULAR_HALF_DURATION = 45 * 60; // 45 minutos en segundos
let extraTimeFirstHalf = 0; // Tiempo añadido a la primera mitad (en segundos)
let extraTimeSecondHalf = 0; // Tiempo añadido a la segunda mitad (en segundos)
let totalTimeFirstHalf = 0; // Duración total de la primera mitad (45 + añadido)

// Estado del partido: 'not-started', 'running', 'paused', 'half-time-ended', 'full-time'
// 'half-time-ended' es cuando la primera mitad (45 + añadido) ha terminado y estamos esperando iniciar la segunda
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

// Función para formatear el tiempo
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// === Funciones para el cronómetro de partido (Adaptadas al selector de mitad) ===
function updateMatchTimerDisplay() {
    let displayTime = matchTime; // Tiempo total

    // Si estamos en la segunda mitad, la visualización empieza en 45:00
    if (currentHalf === 2) {
        // Asegúrate de que el matchTime mínimo para la 2da mitad sea 45:00 para la visualización
        displayTime = Math.max(REGULAR_HALF_DURATION, matchTime);
    }

    matchTimerDisplay.textContent = formatTime(displayTime);

    // Mostrar indicador de mitad y tiempo añadido
    let displayAddedTime = '';
    if (currentHalf === 1 && matchTime >= REGULAR_HALF_DURATION) {
        displayAddedTime = `+${formatTime(extraTimeFirstHalf)}`;
    } else if (currentHalf === 2 && matchTime >= REGULAR_HALF_DURATION * 2 + extraTimeFirstHalf) {
        displayAddedTime = `+${formatTime(extraTimeSecondHalf)}`;
    }
    halfIndicator.textContent = `${currentHalf}ª Mitad`;
    totalAddedTimeDisplay.textContent = displayAddedTime; // Actualizar el display de tiempo añadido

    // Actualizar el estado del partido en el display y la UI
    updateMatchStatusDisplay();

    // Guardar en localStorage
    localStorage.setItem('matchTime', matchTime);
    localStorage.setItem('currentHalf', currentHalf);
    localStorage.setItem('matchState', matchState);
    localStorage.setItem('extraTimeFirstHalf', extraTimeFirstHalf);
    localStorage.setItem('extraTimeSecondHalf', extraTimeSecondHalf);
    localStorage.setItem('totalTimeFirstHalf', totalTimeFirstHalf); // Guardar duración total 1ª mitad
}

function updateMatchStatusDisplay() {
    let statusText = '';
    let startPauseBtnText = 'Iniciar';

    // Ocultar todos los botones de transición y añadir tiempo por defecto
    startPauseMatchTimerButton.style.display = 'inline-block';
    addedTimeInput.style.display = 'none';
    setAddedTimeButton.style.display = 'none';
    halfSelector.style.display = 'none'; // Por defecto ocultar el selector de mitad

    switch (matchState) {
        case 'not-started':
            statusText = 'Listo para iniciar el partido.';
            startPauseBtnText = 'Iniciar';
            halfSelector.style.display = 'flex'; // Mostrar el selector antes de iniciar
            break;
        case 'running':
            statusText = `Partido en curso (${currentHalf}ª mitad).`;
            startPauseBtnText = 'Pausar';
            break;
        case 'paused':
            statusText = `Partido pausado en ${formatTime(matchTime)}.`;
            startPauseBtnText = 'Reanudar';
            if (currentHalf === 1 && matchTime >= REGULAR_HALF_DURATION) { // Si ya pasaron los 45 min de la 1a mitad
                 addedTimeInput.style.display = 'inline-block';
                 setAddedTimeButton.style.display = 'inline-block';
            } else if (currentHalf === 2 && matchTime >= REGULAR_HALF_DURATION * 2 + extraTimeFirstHalf) { // Si ya pasaron los 90 min + extra 1a mitad
                 addedTimeInput.style.display = 'inline-block';
                 setAddedTimeButton.style.display = 'inline-block';
            }
            break;
        case 'half-time-ended':
            statusText = `¡Fin de la 1ª Mitad (${formatTime(totalTimeFirstHalf)})! Selecciona 2ª Mitad para continuar.`;
            startPauseBtnText = 'Pausado'; // El botón principal no aplica
            startPauseMatchTimerButton.style.display = 'none'; // Ocultar botón principal
            halfSelector.style.display = 'flex'; // Mostrar el selector para ir a 2ª mitad
            selectHalf1Button.disabled = true; // Desactivar 1ª mitad
            selectHalf2Button.disabled = false; // Activar 2ª mitad
            addedTimeInput.style.display = 'inline-block'; // Permitir ajustar tiempo añadido si no se hizo
            setAddedTimeButton.style.display = 'inline-block';
            break;
        case 'full-time':
            statusText = '¡PARTIDO FINALIZADO!';
            startPauseBtnText = 'Partido Finalizado';
            startPauseMatchTimerButton.style.display = 'none';
            halfSelector.style.display = 'flex'; // Mostrar selector pero deshabilitado
            selectHalf1Button.disabled = true;
            selectHalf2Button.disabled = true;
            break;
    }
    matchStatusDisplay.textContent = statusText;
    startPauseMatchTimerButton.textContent = startPauseBtnText;
}


function toggleMatchTimer() {
    if (isMatchTimerRunning) {
        // Pausar el reloj
        clearInterval(matchTimerInterval);
        isMatchTimerRunning = false;
        matchState = 'paused';
        stopPossession(); // Pausar la posesión también
    } else {
        // Iniciar o reanudar el reloj
        if (matchState === 'not-started') { // Si es el primer inicio del partido
             // Asegurarse de que el cronómetro empieza limpio si no se ha seleccionado mitad
            if (currentHalf === 1 && matchTime !== 0) matchTime = 0;
            if (currentHalf === 2 && matchTime < REGULAR_HALF_DURATION) matchTime = REGULAR_HALF_DURATION;
            totalTimeFirstHalf = REGULAR_HALF_DURATION; // Reiniciar para el calculo inicial
        }
        matchState = 'running';
        isMatchTimerRunning = true;
        matchTimerInterval = setInterval(() => {
            matchTime++;

            // --- Lógica de Detección de Hitos (45:00 y 90:00) ---
            if (currentHalf === 1 && matchTime >= REGULAR_HALF_DURATION + extraTimeFirstHalf && matchState !== 'half-time-ended') {
                // Alerta de fin de la primera mitad REGULAR + añadido
                clearInterval(matchTimerInterval); // Detener el cronómetro
                isMatchTimerRunning = false;
                matchState = 'half-time-ended'; // Estado especial para transición de mitad
                totalTimeFirstHalf = matchTime; // Guardar el tiempo final real de la primera mitad
                stopPossession(); // Pausar posesión
                alert(`¡Fin de la 1ª Mitad (${formatTime(totalTimeFirstHalf)})!`);
                updateMatchStatusDisplay(); // Actualizar el display para mostrar los botones de transición
            } else if (currentHalf === 2 && matchTime >= totalTimeFirstHalf + REGULAR_HALF_DURATION + extraTimeSecondHalf && matchState !== 'full-time') {
                // Alerta de fin de la segunda mitad REGULAR + añadido
                clearInterval(matchTimerInterval); // Detener el cronómetro
                isMatchTimerRunning = false;
                matchState = 'full-time';
                stopPossession();
                alert('¡Partido Finalizado!');
                updateMatchStatusDisplay(); // Actualizar el display para finalizar el partido
            }
            updateMatchTimerDisplay();

        }, 1000);
    }
    updateMatchStatusDisplay(); // Asegurarse de que el botón se actualiza
    localStorage.setItem('isMatchTimerRunning', isMatchTimerRunning);
}

function resetMatchTimer() {
    clearInterval(matchTimerInterval);
    matchTime = 0;
    extraTimeFirstHalf = 0;
    extraTimeSecondHalf = 0;
    totalTimeFirstHalf = 0; // Resetear
    isMatchTimerRunning = false;
    currentHalf = 1;
    matchState = 'not-started'; // Vuelve al estado inicial
    updateMatchTimerDisplay(); // Actualiza el display y el indicador de mitad
    updateHalfSelectorButtons(); // Resetea la selección de mitad

    // Limpiar localStorage de tiempos y estados
    localStorage.removeItem('matchTime');
    localStorage.removeItem('isMatchTimerRunning');
    localStorage.removeItem('currentHalf');
    localStorage.removeItem('matchState');
    localStorage.removeItem('extraTimeFirstHalf');
    localStorage.removeItem('extraTimeSecondHalf');
    localStorage.removeItem('totalTimeFirstHalf');

    stopPossession(); // Asegurarse de que la posesión también se detiene
    updateMatchStatusDisplay(); // Actualiza la visibilidad de los botones
}

// Función para establecer el tiempo añadido (para la mitad actual)
function setAddedTime() {
    const timeToAdd = parseInt(addedTimeInput.value);
    if (isNaN(timeToAdd) || timeToAdd < 0) {
        alert('Por favor, introduce un número válido de minutos a añadir.');
        return;
    }

    const secondsToAdd = timeToAdd * 60;

    if (currentHalf === 1) {
        extraTimeFirstHalf = secondsToAdd;
        alert(`Se han añadido ${timeToAdd} minutos a la primera mitad.`);
        totalTimeFirstHalf = REGULAR_HALF_DURATION + extraTimeFirstHalf; // Actualizar duración total 1ª mitad
    } else if (currentHalf === 2) {
        extraTimeSecondHalf = secondsToAdd;
        alert(`Se han añadido ${timeToAdd} minutos a la segunda mitad.`);
    } else {
        alert('Solo puedes añadir tiempo durante el curso del partido.');
        return;
    }
    // Si el cronómetro estaba detenido en el momento de añadir tiempo, reanudarlo para que cuente el tiempo extra.
    if (!isMatchTimerRunning && matchState === 'paused') {
        toggleMatchTimer();
    }
    updateMatchTimerDisplay(); // Actualizar display con el nuevo tiempo añadido
    updateMatchStatusDisplay(); // Actualizar visibilidad de botones
    localStorage.setItem('extraTimeFirstHalf', extraTimeFirstHalf);
    localStorage.setItem('extraTimeSecondHalf', extraTimeSecondHalf);
    localStorage.setItem('totalTimeFirstHalf', totalTimeFirstHalf);
}


// === Funciones del selector de mitad ===
function selectHalf(halfNum) {
    if (isMatchTimerRunning && confirm('El temporizador está en marcha. Cambiar de mitad lo pausará. ¿Continuar?')) {
        toggleMatchTimer(); // Pausar si está corriendo
    }

    currentHalf = halfNum;
    localStorage.setItem('currentHalf', currentHalf);

    if (currentHalf === 1) {
        // Al seleccionar 1ª mitad, reiniciar el cronómetro a 00:00
        matchTime = 0;
        extraTimeFirstHalf = 0;
        extraTimeSecondHalf = 0;
        totalTimeFirstHalf = 0;
        matchState = 'not-started'; // Reiniciar estado para la 1ª mitad
    } else if (currentHalf === 2) {
        // Al seleccionar 2ª mitad, iniciar el cronómetro en 45:00
        matchTime = totalTimeFirstHalf || REGULAR_HALF_DURATION; // Si no hay totalTimeFirstHalf, usar 45:00
        extraTimeSecondHalf = 0; // Reiniciar tiempo extra de la 2da mitad
        matchState = 'not-started'; // Resetear estado para la 2ª mitad (antes de empezar a correrla)
    }

    updateMatchTimerDisplay(); // Actualizar la visualización
    updateHalfSelectorButtons(); // Actualizar estilo de los botones
    updateMatchStatusDisplay(); // Actualizar el estado del partido y botones de control
}

function updateHalfSelectorButtons() {
    selectHalf1Button.classList.remove('active');
    selectHalf2Button.classList.remove('active');

    if (currentHalf === 1) {
        selectHalf1Button.classList.add('active');
        selectHalf1Button.disabled = false; // Siempre activado para 1ª mitad
        selectHalf2Button.disabled = false; // Activar 2ª mitad
    } else {
        selectHalf2Button.classList.add('active');
        // Cuando estamos en la 2ª mitad, la 1ª mitad ya no se puede seleccionar si ya ha terminado
        selectHalf1Button.disabled = true;
        selectHalf2Button.disabled = false;
    }

    // Deshabilitar selectores si el partido ha terminado
    if (matchState === 'full-time') {
        selectHalf1Button.disabled = true;
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
    // Solo permitir iniciar la posesión si el temporizador del partido está en marcha ('running')
    if (matchState !== 'running') {
        alert('El temporizador del partido debe estar en marcha para controlar la posesión.');
        return;
    }

    // Si el mismo equipo ya tiene la posesión, no hacer nada
    if (currentPossessionTeam === team) return;

    // Pausar el temporizador del equipo actual si hay uno
    if (currentPossessionTeam === 'A') clearInterval(possessionTimerAInterval);
    if (currentPossessionTeam === 'B') clearInterval(possessionTimerBInterval);

    // Desactivar botones si se estaban resaltando
    startPossessionAButton.classList.remove('active');
    startPossessionBButton.classList.remove('active');

    // Iniciar el temporizador para el nuevo equipo
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
    statCard.dataset.id = stat.id; // Almacena el ID para la delegación de eventos

    const header = document.createElement('div');
    header.classList.add('stat-card-header');

    const statTitle = document.createElement('span');
    statTitle.classList.add('stat-title');
    statTitle.textContent = stat.name;
    header.appendChild(statTitle);

    const actionIcons = document.createElement('div');
    actionIcons.classList.add('stat-action-icons');

    // Botón Ver Detalles
    const viewButton = document.createElement('button');
    viewButton.innerHTML = '📋';
    viewButton.title = 'Ver Eventos';
    viewButton.dataset.action = 'view'; // Para delegación de eventos
    actionIcons.appendChild(viewButton);

    // Botón Editar Nombre
    const editButton = document.createElement('button');
    editButton.innerHTML = '✏️';
    editButton.title = 'Editar Nombre';
    editButton.dataset.action = 'edit'; // Para delegación de eventos
    actionIcons.appendChild(editButton);

    // Botón Eliminar
    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '🗑️';
    deleteButton.title = 'Eliminar Estadística';
    deleteButton.dataset.action = 'delete'; // Para delegación de eventos
    actionIcons.appendChild(deleteButton);

    header.appendChild(actionIcons);
    statCard.appendChild(header);

    const controlsGroup = document.createElement('div');
    controlsGroup.classList.add('stat-controls-group');

    // Controles Equipo A
    const teamAControls = document.createElement('div');
    teamAControls.classList.add('team-buttons-column');
    const plusA = document.createElement('button');
    plusA.classList.add('plus-btn');
    plusA.textContent = '+';
    plusA.dataset.team = 'A'; // Para delegación de eventos
    plusA.dataset.action = 'increment'; // Para delegación de eventos
    const minusA = document.createElement('button');
    minusA.classList.add('minus-btn');
    minusA.textContent = '-';
    minusA.dataset.team = 'A'; // Para delegación de eventos
    minusA.dataset.action = 'decrement'; // Para delegación de eventos
    teamAControls.appendChild(plusA);
    teamAControls.appendChild(minusA);
    controlsGroup.appendChild(teamAControls);

    // Display central
    const statTotalDisplay = document.createElement('span');
    statTotalDisplay.classList.add('stat-total-display');
    statTotalDisplay.textContent = `${stat.valueA} - ${stat.valueB}`;
    statTotalDisplay.dataset.display = 'value'; // Identificador para actualizar fácilmente
    controlsGroup.appendChild(statTotalDisplay);

    // Controles Equipo B
    const teamBControls = document.createElement('div');
    teamBControls.classList.add('team-buttons-column');
    const plusB = document.createElement('button');
    plusB.classList.add('plus-btn');
    plusB.textContent = '+';
    plusB.dataset.team = 'B'; // Para delegación de eventos
    plusB.dataset.action = 'increment'; // Para delegación de eventos
    const minusB = document.createElement('button');
    minusB.classList.add('minus-btn');
    minusB.textContent = '-';
    minusB.dataset.team = 'B'; // Para delegación de eventos
    minusB.dataset.action = 'decrement'; // Para delegación de eventos
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
        // Asegurarse de que el ID es único, usando una marca de tiempo
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
    customStatsGrid.innerHTML = ''; // Limpiar antes de renderizar
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
            // Verificar si los datos parseados son un array y tienen el formato esperado
            if (Array.isArray(parsedStats) && parsedStats.every(s => typeof s.id === 'number' && typeof s.name === 'string')) {
                customStats = parsedStats;
            } else {
                console.warn("Datos de customStats en localStorage corruptos o con formato incorrecto. Cargando estadísticas iniciales.");
                customStats = initialCustomStats.map(stat => ({ ...stat })); // Clonar para evitar mutación
            }
        } catch (e) {
            console.error("Error al parsear custom stats de localStorage:", e);
            console.warn("Cargando estadísticas iniciales.");
            customStats = initialCustomStats.map(stat => ({ ...stat })); // Clonar para evitar mutación
        }
    } else {
        // Si no hay nada en localStorage, cargar las estadísticas iniciales
        customStats = initialCustomStats.map(stat => ({ ...stat })); // Clonar para evitar mutación
    }
    renderCustomStats();
}


// Funciones para el modal de eventos
function showEventModal(events, statName) {
    if (modalTitle) {
        modalTitle.textContent = `Historial de ${statName}`;
    } else {
        console.error("Elemento con ID 'modal-title' no encontrado en el DOM.");
    }

    modalEventList.innerHTML = ''; // Limpiar lista
    if (events.length === 0) {
        const li = document.createElement('li');
        li.textContent = `No hay eventos registrados para ${statName}.`;
        modalEventList.appendChild(li);
    } else {
        events.forEach(event => {
            const li = document.createElement('li');
            // La clase para el color del equipo
            li.classList.add(event.team === teamANameInput.value ? 'team-A' : 'team-B');

            li.textContent = `${event.time} - ${event.team}`;
            modalEventList.appendChild(li);
        });
    }
    eventModal.style.display = 'flex'; // Mostrar el modal
}

function hideEventModal() {
    eventModal.style.display = 'none'; // Ocultar el modal
}


// Función para añadir un gol al historial
function addGoalToHistory(teamName) {
    const goalTime = formatTime(matchTime); // Usar el matchTime real para el registro
    const goalEntry = { time: goalTime, team: teamName };
    goalsHistory.push(goalEntry);
    localStorage.setItem('goalsHistory', JSON.stringify(goalsHistory));
    renderGoalsHistory(); // Renderizar en la lista del marcador
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
    renderGoalsHistory();
}


// Función para renderizar el historial de goles
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
    } else {
        goalsHistory.forEach(goal => {
            const li = document.createElement('li');
            li.classList.add(goal.team === teamANameInput.value ? 'team-A' : 'team-B');
            li.innerHTML = `<span class="event-time">${goal.time}</span> - <span class="event-team">${goal.team}</span>`;
            goalsList.appendChild(li);
        });
    }
}


// Event Listeners
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
    extraTimeFirstHalf = parseInt(localStorage.getItem('extraTimeFirstHalf')) || 0;
    extraTimeSecondHalf = parseInt(localStorage.getItem('extraTimeSecondHalf')) || 0;
    totalTimeFirstHalf = parseInt(localStorage.getItem('totalTimeFirstHalf')) || REGULAR_HALF_DURATION; // Cargar la duración real de la 1ª mitad
    matchState = localStorage.getItem('matchState') || 'not-started';
    isMatchTimerRunning = JSON.parse(localStorage.getItem('isMatchTimerRunning')) || false;


    updateMatchTimerDisplay(); // Llama esto para que muestre el estado inicial
    updateMatchStatusDisplay(); // Actualiza visibilidad de botones al cargar
    updateHalfSelectorButtons(); // Actualizar estilo de los botones del selector de mitad

    // Si el cronómetro estaba corriendo al cerrar la app, reanudarlo
    if (isMatchTimerRunning && matchState === 'running') {
        toggleMatchTimer(); // Esto reinicia el intervalo
    }


    // Cargar posesión
    possessionTimeA = parseInt(localStorage.getItem('possessionTimeA')) || 0;
    possessionTimeB = parseInt(localStorage.getItem('possessionTimeB')) || 0;
    currentPossessionTeam = localStorage.getItem('currentPossessionTeam');
    updatePossessionDisplays();
    // Reanudar posesión si el partido está en 'running' y había un equipo con posesión
    if (matchState === 'running' && currentPossessionTeam) {
        startPossession(currentPossessionTeam);
    }

    // Cargar estadísticas personalizadas
    loadCustomStats();

    // Cargar y renderizar historial de goles
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
setAddedTimeButton.addEventListener('click', setAddedTime);


// =================================================================
// Delegación de eventos para las estadísticas personalizadas
// =================================================================
customStatsGrid.addEventListener('click', (event) => {
    const target = event.target;
    const statCard = target.closest('.stat-card'); // Encuentra la tarjeta de estadística más cercana
    if (!statCard) return; // Si no es un clic dentro de una tarjeta de estadística, salir

    const statId = parseInt(statCard.dataset.id);
    const stat = customStats.find(s => s.id === statId);

    if (!stat) return; // Si no se encuentra la estadística, salir

    const action = target.dataset.action; // Acción definida en el dataset del botón
    const team = target.dataset.team; // Equipo (A/B) para botones de incremento/decremento

    switch (action) {
        case 'view':
            showEventModal(stat.events, stat.name);
            break;
        case 'edit':
            const newName = prompt('Editar nombre de la estadística:', stat.name);
            if (newName && newName.trim() !== '') {
                stat.name = newName.trim();
                // Actualizar el título en la tarjeta directamente
                statCard.querySelector('.stat-title').textContent = newName.trim();
                saveCustomStats();
            }
            break;
        case 'delete':
            if (confirm(`¿Estás seguro de que quieres eliminar la estadística "${stat.name}"?`)) {
                customStats = customStats.filter(s => s.id !== stat.id);
                saveCustomStats();
                renderCustomStats(); // Volver a renderizar la cuadrícula
            }
            break;
        case 'increment':
            if (team === 'A') {
                stat.valueA++;
                // Añadir evento al historial de la estadística con un ID único para poder eliminarlo después
                stat.events.push({ id: Date.now(), time: formatTime(matchTime), team: teamANameInput.value });
            } else if (team === 'B') {
                stat.valueB++;
                // Añadir evento al historial de la estadística con un ID único para poder eliminarlo después
                stat.events.push({ id: Date.now(), time: formatTime(matchTime), team: teamBNameInput.value });
            }
            break;
        case 'decrement':
            if (team === 'A' && stat.valueA > 0) {
                stat.valueA--;
                // Encontrar el índice del ÚLTIMO evento de este equipo
                const lastEventIndex = stat.events.map(e => e.team).lastIndexOf(teamANameInput.value);
                if (lastEventIndex !== -1) {
                    stat.events.splice(lastEventIndex, 1); // Eliminar ese evento
                }
            } else if (team === 'B' && stat.valueB > 0) {
                stat.valueB--;
                // Encontrar el índice del ÚLTIMO evento de este equipo
                const lastEventIndex = stat.events.map(e => e.team).lastIndexOf(teamBNameInput.value);
                if (lastEventIndex !== -1) {
                    stat.events.splice(lastEventIndex, 1); // Eliminar ese evento
                }
            }
            break;
        default:
            return; // No es una acción conocida
    }

    // Después de cualquier cambio de valor, actualizar el display y guardar
    if (action === 'increment' || action === 'decrement') {
        const statDisplay = statCard.querySelector('[data-display="value"]');
        if (statDisplay) {
            statDisplay.textContent = `${stat.valueA} - ${stat.valueB}`;
        }
        saveCustomStats();
    }
});


// Event Listener para Reiniciar Todo
resetAllButton.addEventListener('click', () => {
    if (confirm('¿Estás seguro de que quieres reiniciar TODO el partido? Esto borrará el marcador, tiempos, posesión y todas las estadísticas personalizadas.')) {
        // Reiniciar Marcador
        scoreA = 0;
        scoreB = 0;
        updateScoreDisplay();
        goalsHistory = [];
        localStorage.removeItem('goalsHistory');
        renderGoalsHistory();

        // Reiniciar Temporizador de Partido (con la nueva función mejorada)
        resetMatchTimer();

        // Reiniciar Posesión (por si acaso, aunque resetMatchTimer ya lo hace)
        resetPossession();

        // Reiniciar Estadísticas Personalizadas a las predefinidas
        customStats = initialCustomStats.map(stat => ({ ...stat })); // Clonar para que sean independientes
        saveCustomStats(); // Guarda el array predefinido
        renderCustomStats(); // ¡Asegurarse de que se rendericen después de resetear!

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
