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

// === Variables y elementos para el cronómetro de fútbol ===
const halfIndicator = document.getElementById('half-indicator');
const addedTimeInput = document.getElementById('added-time-input');
const setAddedTimeButton = document.getElementById('set-added-time-button');
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
let extraTimeFirstHalf = 0; // Tiempo añadido a la primera mitad (en segundos)
let extraTimeSecondHalf = 0; // Tiempo añadido a la segunda mitad (en segundos)
let totalTimeFirstHalf = 0; // Duración total de la primera mitad (45 + extra)

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

    // Si estamos en la segunda mitad, ajustamos el tiempo de display para que empiece en 45:00
    if (currentHalf === 2) {
        // Asegura que la visualización de la 2da mitad comience desde 45:00
        // `matchTime - totalTimeFirstHalf` da el tiempo transcurrido DESDE el inicio "real" de la 2da mitad
        // Luego le sumamos 45 * 60 para que la visualización sea 45:00 + tiempo transcurrido
        displayTime = REGULAR_HALF_DURATION + (matchTime - totalTimeFirstHalf);
        // Evitar que muestre tiempos negativos si matchTime es menor que totalTimeFirstHalf
        if (displayTime < REGULAR_HALF_DURATION) {
            displayTime = REGULAR_HALF_DURATION;
        }
    } else { // Primera mitad
        displayTime = matchTime;
    }

    matchTimerDisplay.textContent = formatTime(displayTime);

    // Mostrar indicador de mitad y tiempo añadido
    let displayAddedTime = '';
    if (currentHalf === 1 && matchTime >= REGULAR_HALF_DURATION) {
        displayAddedTime = `+${formatTime(extraTimeFirstHalf)}`;
    } else if (currentHalf === 2 && matchTime >= totalTimeFirstHalf + REGULAR_HALF_DURATION) {
        displayAddedTime = `+${formatTime(extraTimeSecondHalf)}`;
    }
    halfIndicator.textContent = `${currentHalf}ª Mitad`;
    totalAddedTimeDisplay.textContent = displayAddedTime;

    // Actualizar el estado del partido en el display y la UI
    updateMatchStatusDisplay();

    // Guardar en localStorage
    localStorage.setItem('matchTime', matchTime);
    localStorage.setItem('currentHalf', currentHalf);
    localStorage.setItem('matchState', matchState);
    localStorage.setItem('extraTimeFirstHalf', extraTimeFirstHalf);
    localStorage.setItem('extraTimeSecondHalf', extraTimeSecondHalf);
    localStorage.setItem('totalTimeFirstHalf', totalTimeFirstHalf);
}

function updateMatchStatusDisplay() {
    let statusText = '';
    let startPauseBtnText = 'Iniciar';

    // Ocultar todos los botones de transición y añadir tiempo por defecto
    startPauseMatchTimerButton.style.display = 'inline-block';
    addedTimeInput.style.display = 'none';
    setAddedTimeButton.style.display = 'none';
    halfSelector.style.display = 'flex'; // Mostrar el selector por defecto, su estado se maneja en updateHalfSelectorButtons

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
            // Mostrar controles de añadir tiempo si estamos cerca del final de una mitad
            if (currentHalf === 1 && matchTime >= REGULAR_HALF_DURATION) {
                 addedTimeInput.style.display = 'inline-block';
                 setAddedTimeButton.style.display = 'inline-block';
            } else if (currentHalf === 2 && matchTime >= totalTimeFirstHalf + REGULAR_HALF_DURATION) {
                 addedTimeInput.style.display = 'inline-block';
                 setAddedTimeButton.style.display = 'inline-block';
            }
            break;
        case 'half-time-ended':
            statusText = `¡Fin de la 1ª Mitad (${formatTime(totalTimeFirstHalf)})! Selecciona 2ª Mitad para continuar.`;
            startPauseMatchTimerButton.style.display = 'none'; // No se puede iniciar/pausar desde aquí
            addedTimeInput.style.display = 'inline-block'; // Permitir ajustar tiempo añadido si no se hizo
            setAddedTimeButton.style.display = 'inline-block';
            break;
        case 'full-time':
            statusText = '¡PARTIDO FINALIZADO!';
            startPauseMatchTimerButton.style.display = 'none';
            addedTimeInput.style.display = 'none'; // No se puede añadir más tiempo
            setAddedTimeButton.style.display = 'none';
            break;
    }
    matchStatusDisplay.textContent = statusText;
    startPauseMatchTimerButton.textContent = startPauseBtnText;
    updateHalfSelectorButtons(); // Asegurar que el selector de mitad se actualiza con el estado
}


function toggleMatchTimer() {
    if (isMatchTimerRunning) {
        // Pausar el reloj
        clearInterval(matchTimerInterval);
        isMatchTimerRunning = false;
        matchState = 'paused';
        stopPossession(); // Pausar la posesión también
    } else {
        // No permitir iniciar si el partido ha terminado
        if (matchState === 'full-time' || matchState === 'half-time-ended') {
            alert('No se puede iniciar el cronómetro en este estado. Por favor, selecciona la siguiente mitad o reinicia el partido.');
            return;
        }

        // Si es el primer inicio en una mitad (o reanudación desde 'not-started' de la mitad)
        if (matchState === 'not-started') {
            if (currentHalf === 1) {
                matchTime = 0; // Asegurarse de que la 1ra mitad empieza en 0
                totalTimeFirstHalf = REGULAR_HALF_DURATION; // Valor por defecto antes de añadir tiempo
            } else if (currentHalf === 2) {
                // Si la 2da mitad empieza y no se ha definido totalTimeFirstHalf, asumimos 45 min
                if (totalTimeFirstHalf === 0) { // Esto podría ocurrir si se carga desde localStorage un estado intermedio
                    totalTimeFirstHalf = REGULAR_HALF_DURATION;
                }
                matchTime = totalTimeFirstHalf; // La 2da mitad empieza el tiempo donde terminó la 1ra
            }
        }

        matchState = 'running';
        isMatchTimerRunning = true;
        matchTimerInterval = setInterval(() => {
            matchTime++;

            // --- Lógica de Detección de Hitos (Fin de mitades) ---
            if (currentHalf === 1 && matchTime >= REGULAR_HALF_DURATION + extraTimeFirstHalf && matchState !== 'half-time-ended') {
                clearInterval(matchTimerInterval); // Detener el cronómetro
                isMatchTimerRunning = false;
                matchState = 'half-time-ended'; // Estado especial para transición de mitad
                totalTimeFirstHalf = matchTime; // Guardar el tiempo final real de la primera mitad
                stopPossession(); // Pausar posesión
                alert(`¡Fin de la 1ª Mitad (${formatTime(totalTimeFirstHalf)})!`);
            } else if (currentHalf === 2 && matchTime >= totalTimeFirstHalf + REGULAR_HALF_DURATION + extraTimeSecondHalf && matchState !== 'full-time') {
                clearInterval(matchTimerInterval); // Detener el cronómetro
                isMatchTimerRunning = false;
                matchState = 'full-time';
                stopPossession();
                alert('¡Partido Finalizado!');
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
    totalTimeFirstHalf = 0;
    isMatchTimerRunning = false;
    currentHalf = 1; // Siempre vuelve a la 1ª mitad
    matchState = 'not-started';
    updateMatchTimerDisplay();
    updateHalfSelectorButtons(); // Resetea la selección de mitad

    // Limpiar localStorage de tiempos y estados
    localStorage.removeItem('matchTime');
    localStorage.removeItem('isMatchTimerRunning');
    localStorage.removeItem('currentHalf');
    localStorage.removeItem('matchState');
    localStorage.removeItem('extraTimeFirstHalf');
    localStorage.removeItem('extraTimeSecondHalf');
    localStorage.removeItem('totalTimeFirstHalf');

    stopPossession();
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
        totalTimeFirstHalf = REGULAR_HALF_DURATION + extraTimeFirstHalf; // Actualizar duración total 1ª mitad
        alert(`Se han añadido ${timeToAdd} minutos a la primera mitad.`);
        // Si estaba en 'half-time-ended', volver a 'paused' para permitir reanudar
        if (matchState === 'half-time-ended') {
            matchState = 'paused';
        }
    } else if (currentHalf === 2) {
        extraTimeSecondHalf = secondsToAdd;
        alert(`Se han añadido ${timeToAdd} minutos a la segunda mitad.`);
        // Si estaba en estado de finalización de 2da mitad, pasar a full-time definitivo
        if (matchTime >= totalTimeFirstHalf + REGULAR_HALF_DURATION + extraTimeSecondHalf) {
             matchState = 'full-time';
             clearInterval(matchTimerInterval);
             isMatchTimerRunning = false;
        }
    } else {
        alert('Solo puedes añadir tiempo al final de la mitad correspondiente.');
        return;
    }

    updateMatchTimerDisplay();
    updateMatchStatusDisplay();
    localStorage.setItem('extraTimeFirstHalf', extraTimeFirstHalf);
    localStorage.setItem('extraTimeSecondHalf', extraTimeSecondHalf);
    localStorage.setItem('totalTimeFirstHalf', totalTimeFirstHalf);
}


// === Funciones del selector de mitad ===
function selectHalf(halfNum) {
    if (isMatchTimerRunning) {
        // Si el cronómetro está corriendo, pausarlo primero
        toggleMatchTimer(); // Esto cambiará matchState a 'paused'
        alert('El temporizador del partido ha sido pausado para cambiar de mitad.');
    }

    // Lógica para cambiar de mitad
    if (halfNum === 1) {
        // NUEVO: Aviso si se intenta volver a la 1ª mitad desde la 2ª
        if (currentHalf === 2) {
            if (!confirm('Estás volviendo a la 1ª Mitad. Esto reiniciará el tiempo de la 1ª Mitad y afectará el tiempo acumulado para la 2ª Mitad. ¿Estás seguro?')) {
                return; // Si el usuario cancela, no hacer nada
            }
        }
        currentHalf = 1;
        matchTime = 0;
        extraTimeFirstHalf = 0;
        extraTimeSecondHalf = 0;
        totalTimeFirstHalf = 0;
        matchState = 'not-started'; // Reinicia el estado para la 1ª mitad
    } else if (halfNum === 2) {
        // Para la segunda mitad, el tiempo "interno" comienza donde terminó la primera mitad
        // Si totalTimeFirstHalf no está definido (ej. carga inicial), se asume 45 mins
        currentHalf = 2;
        if (totalTimeFirstHalf === 0) { // Esto podría ocurrir si se carga desde localStorage un estado intermedio
            totalTimeFirstHalf = REGULAR_HALF_DURATION; // Establecer a 45 minutos si no hay un valor previo
        }
        matchTime = totalTimeFirstHalf; // El cronómetro absoluto se posiciona al final de la 1ª mitad
        extraTimeSecondHalf = 0;
        matchState = 'not-started'; // Estado inicial para la 2ª mitad (antes de iniciarla)
    }

    localStorage.setItem('currentHalf', currentHalf);
    localStorage.setItem('matchTime', matchTime);
    localStorage.setItem('totalTimeFirstHalf', totalTimeFirstHalf);
    localStorage.setItem('matchState', matchState); // Guardar el nuevo estado

    updateMatchTimerDisplay(); // Actualizar la visualización del cronómetro
    updateHalfSelectorButtons(); // Actualizar el estilo de los botones del selector
    updateMatchStatusDisplay(); // Actualizar el mensaje de estado y visibilidad de botones
}

function updateHalfSelectorButtons() {
    selectHalf1Button.classList.remove('active');
    selectHalf2Button.classList.remove('active');
    selectHalf1Button.disabled = false; // Por defecto habilitamos ambos
    selectHalf2Button.disabled = false;

    if (currentHalf === 1) {
        selectHalf1Button.classList.add('active');
    } else if (currentHalf === 2) {
        selectHalf2Button.classList.add('active');
        // MODIFICADO: Solo deshabilitar 1ª mitad si el partido ha finalizado COMPLETAMENTE (full-time)
        if (matchState === 'full-time') {
            selectHalf1Button.disabled = true;
        }
    }

    // Deshabilitar selectores si el partido ha terminado completamente
    if (matchState === 'full-time') {
        selectHalf1Button.disabled = true;
        selectHalf2Button.disabled = true;
    }
    // Deshabilitar la 2ª mitad si la 1ª aún no ha terminado (tiempo regulatorio + añadido)
    // Y no está ya en el estado de "half-time-ended" (que es el puente)
    if (currentHalf === 1 && matchTime < REGULAR_HALF_DURATION + extraTimeFirstHalf && matchState !== 'half-time-ended') {
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

    const statTotalDisplay = document.createElement('span');
    statTotalDisplay.classList.add('stat-total-display');
    statTotalDisplay.textContent = `${stat.valueA} - ${stat.valueB}`;
    statTotalDisplay.dataset.display = 'value';
    controlsGroup.appendChild(statTotalDisplay);

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
    const goalTime = formatTime(matchTime); // Usar el matchTime real para el registro
    const currentScore = `${scoreA} - ${scoreB}`; // NUEVO: Capturar el marcador actual
    const goalEntry = { time: goalTime, team: teamName, score: currentScore }; // MODIFICADO: Añadir el marcador
    goalsHistory.push(goalEntry);
    localStorage.setItem('goalsHistory', JSON.stringify(goalsHistory));
    renderGoalsHistory();
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
            // MODIFICADO: Añadir el marcador al texto
            li.innerHTML = `<span class="event-time">${goal.time}</span> - <span class="event-team">${goal.team}</span> <span class="goal-score">(${goal.score})</span>`;
            goalsList.appendChild(li);
        });
    }
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
    extraTimeFirstHalf = parseInt(localStorage.getItem('extraTimeFirstHalf')) || 0;
    extraTimeSecondHalf = parseInt(localStorage.getItem('extraTimeSecondHalf')) || 0;
    totalTimeFirstHalf = parseInt(localStorage.getItem('totalTimeFirstHalf')) || REGULAR_HALF_DURATION;

    // Asegurarse de que totalTimeFirstHalf no sea 0 si la mitad actual es 2
    if (currentHalf === 2 && totalTimeFirstHalf === 0) {
        totalTimeFirstHalf = REGULAR_HALF_DURATION;
    }

    matchState = localStorage.getItem('matchState') || 'not-started';
    isMatchTimerRunning = JSON.parse(localStorage.getItem('isMatchTimerRunning')) || false;


    updateMatchTimerDisplay();
    updateMatchStatusDisplay();
    updateHalfSelectorButtons();

    // Si el cronómetro estaba corriendo al cerrar la app, reanudarlo
    if (isMatchTimerRunning && matchState === 'running') {
        toggleMatchTimer();
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
    const statCard = target.closest('.stat-card');
    if (!statCard) return;

    const statId = parseInt(statCard.dataset.id);
    const stat = customStats.find(s => s.id === statId);

    if (!stat) return;

    const action = target.dataset.action;
    const team = target.dataset.team;

    switch (action) {
        case 'view':
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
        scoreA = 0;
        scoreB = 0;
        updateScoreDisplay();
        goalsHistory = [];
        localStorage.removeItem('goalsHistory');
        renderGoalsHistory();

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
