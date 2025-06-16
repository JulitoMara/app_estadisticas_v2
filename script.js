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
    return `<span class="math-inline">\{String\(minutes\)\.padStart\(2, '0'\)\}\:</span>{String(remainingSeconds).padStart(2, '0')}`;
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
