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

// Elemento para la lista de goles en el marcador
const goalsList = document.getElementById('goals-list');

let scoreA = 0;
let scoreB = 0;
let matchTimerInterval;
let matchTime = 0; // en segundos
let isMatchTimerRunning = false;

let possessionTimerAInterval;
let possessionTimerBInterval;
let possessionTimeA = 0;
let possessionTimeB = 0;
let currentPossessionTeam = null;

// =================================================================
// NUEVO: Estadísticas personalizadas iniciales / preconfiguradas
// Esto se usará si no hay datos guardados o si están corruptos.
// Cada estadística debe tener un ID único para evitar problemas.
// =================================================================
const initialCustomStats = [
    { id: 101, name: 'Tiros a puerta', valueA: 0, valueB: 0, events: [] },
    { id: 102, name: 'Faltas', valueA: 0, valueB: 0, events: [] },
    { id: 103, name: 'Tarjetas Amarillas', valueA: 0, valueB: 0, events: [] },
    { id: 104, name: 'Tarjetas Rojas', valueA: 0, valueB: 0, events: [] },
    { id: 105, name: 'Saques de esquina', valueA: 0, valueB: 0, events: [] },
    { id: 106, name: 'Fueras de juego', valueA: 0, valueB: 0, events: [] },
    { id: 107, name: 'Penaltis', valueA: 0, valueB: 0, events: [] },
    { id: 108, name: 'Paradas', valueA: 0, valueB: 0, events: [] },
    // Puedes añadir más estadísticas aquí si lo deseas
];


let customStats = []; // Se llenará en loadCustomStats()
let goalsHistory = []; // Se llenará en renderGoalsHistory()


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

// Función para actualizar el temporizador de partido
function updateMatchTimerDisplay() {
    matchTimerDisplay.textContent = formatTime(matchTime);
    localStorage.setItem('matchTime', matchTime);
}

// Función para iniciar/pausar el temporizador de partido
function toggleMatchTimer() {
    if (isMatchTimerRunning) {
        clearInterval(matchTimerInterval);
        startPauseMatchTimerButton.textContent = 'Reanudar';
        stopPossession(); // Pausar posesión si el partido se pausa
    } else {
        matchTimerInterval = setInterval(() => {
            matchTime++;
            updateMatchTimerDisplay();
        }, 1000);
        startPauseMatchTimerButton.textContent = 'Pausar';
    }
    isMatchTimerRunning = !isMatchTimerRunning;
    localStorage.setItem('isMatchTimerRunning', isMatchTimerRunning);
}

// Función para resetear el temporizador de partido
function resetMatchTimer() {
    clearInterval(matchTimerInterval);
    matchTime = 0;
    isMatchTimerRunning = false;
    updateMatchTimerDisplay();
    startPauseMatchTimerButton.textContent = 'Iniciar';
    localStorage.removeItem('matchTime');
    localStorage.removeItem('isMatchTimerRunning');
    stopPossession(); // Asegurarse de que la posesión también se detiene al reiniciar el partido
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
    // NUEVO: Solo permitir iniciar la posesión si el temporizador del partido está en marcha
    if (!isMatchTimerRunning) {
        alert('Debes iniciar el temporizador del partido para controlar la posesión.');
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

    // Botón Ver Detalles
    const viewButton = document.createElement('button');
    viewButton.innerHTML = '📋';
    viewButton.title = 'Ver Eventos';
    viewButton.addEventListener('click', () => {
        showEventModal(stat.events, stat.name); // Pasar el nombre de la estadística al modal
    });
    actionIcons.appendChild(viewButton);

    // Botón Editar Nombre
    const editButton = document.createElement('button');
    editButton.innerHTML = '✏️';
    editButton.title = 'Editar Nombre';
    editButton.addEventListener('click', () => {
        const newName = prompt('Editar nombre de la estadística:', stat.name);
        if (newName && newName.trim() !== '') {
            stat.name = newName.trim();
            statTitle.textContent = newName.trim();
            saveCustomStats();
        }
    });
    actionIcons.appendChild(editButton);

    // Botón Eliminar
    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '🗑️';
    deleteButton.title = 'Eliminar Estadística';
    deleteButton.addEventListener('click', () => {
        if (confirm(`¿Estás seguro de que quieres eliminar la estadística "${stat.name}"?`)) {
            customStats = customStats.filter(s => s.id !== stat.id);
            saveCustomStats();
            renderCustomStats();
        }
    });
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
    plusA.addEventListener('click', () => {
        stat.valueA++;
        updateStatDisplay();
        stat.events.push({ time: formatTime(matchTime), team: teamANameInput.value, type: 'sum', value: 1 });
        saveCustomStats();
    });
    const minusA = document.createElement('button');
    minusA.classList.add('minus-btn');
    minusA.textContent = '-';
    minusA.addEventListener('click', () => {
        if (stat.valueA > 0) {
            stat.valueA--;
            updateStatDisplay();
            stat.events.push({ time: formatTime(matchTime), team: teamANameInput.value, type: 'subtract', value: 1 });
            saveCustomStats();
        }
    });
    const resetA = document.createElement('button');
    resetA.classList.add('reset-btn');
    resetA.innerHTML = '🔄';
    resetA.title = `Reiniciar ${teamANameInput.value}`;
    resetA.addEventListener('click', () => {
        if (confirm(`¿Reiniciar ${stat.name} para ${teamANameInput.value}?`)) {
            stat.valueA = 0;
            updateStatDisplay();
            stat.events.push({ time: formatTime(matchTime), team: teamANameInput.value, type: 'reset' });
            saveCustomStats();
        }
    });
    teamAControls.appendChild(plusA);
    teamAControls.appendChild(minusA);
    teamAControls.appendChild(resetA);
    controlsGroup.appendChild(teamAControls);

    // Display central
    const statTotalDisplay = document.createElement('span');
    statTotalDisplay.classList.add('stat-total-display');
    statTotalDisplay.textContent = `${stat.valueA} - ${stat.valueB}`;
    controlsGroup.appendChild(statTotalDisplay);

    // Controles Equipo B
    const teamBControls = document.createElement('div');
    teamBControls.classList.add('team-buttons-column');
    const plusB = document.createElement('button');
    plusB.classList.add('plus-btn');
    plusB.textContent = '+';
    plusB.addEventListener('click', () => {
        stat.valueB++;
        updateStatDisplay();
        stat.events.push({ time: formatTime(matchTime), team: teamBNameInput.value, type: 'sum', value: 1 });
        saveCustomStats();
    });
    const minusB = document.createElement('button');
    minusB.classList.add('minus-btn');
    minusB.textContent = '-';
    minusB.addEventListener('click', () => {
        if (stat.valueB > 0) {
            stat.valueB--;
            updateStatDisplay();
            stat.events.push({ time: formatTime(matchTime), team: teamBNameInput.value, type: 'subtract', value: 1 });
            saveCustomStats();
        }
    });
    const resetB = document.createElement('button');
    resetB.classList.add('reset-btn');
    resetB.innerHTML = '🔄';
    resetB.title = `Reiniciar ${teamBNameInput.value}`;
    resetB.addEventListener('click', () => {
        if (confirm(`¿Reiniciar ${stat.name} para ${teamBNameInput.value}?`)) {
            stat.valueB = 0;
            updateStatDisplay();
            stat.events.push({ time: formatTime(matchTime), team: teamBNameInput.value, type: 'reset' });
            saveCustomStats();
        }
    });
    teamBControls.appendChild(plusB);
    teamBControls.appendChild(minusB);
    teamBControls.appendChild(resetB);
    controlsGroup.appendChild(teamBControls);

    statCard.appendChild(controlsGroup);

    // Función interna para actualizar el display de esta tarjeta
    function updateStatDisplay() {
        statTotalDisplay.textContent = `${stat.valueA} - ${stat.valueB}`;
    }

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
    document.getElementById('modal-title').textContent = `Historial de ${statName}`; // Actualizar título del modal
    modalEventList.innerHTML = ''; // Limpiar lista
    if (events.length === 0) {
        const li = document.createElement('li');
        li.textContent = `No hay eventos registrados para ${statName}.`;
        modalEventList.appendChild(li);
    } else {
        events.forEach(event => {
            const li = document.createElement('li');
            li.classList.add(event.team === teamANameInput.value ? 'team-A' : 'team-B');
            let eventTypeText;
            if (event.type === 'sum') eventTypeText = 'Incremento';
            else if (event.type === 'subtract') eventTypeText = 'Decremento';
            else if (event.type === 'reset') eventTypeText = 'Reiniciado';
            else eventTypeText = event.type; // Fallback
            li.innerHTML = `<span class="event-time">${event.time}</span> - <span class="event-team">${event.team}: ${eventTypeText}</span>`;
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
    const goalTime = formatTime(matchTime);
    const goalEntry = { time: goalTime, team: teamName };
    goalsHistory.push(goalEntry);
    localStorage.setItem('goalsHistory', JSON.stringify(goalsHistory));
    renderGoalsHistory(); // Renderizar en la lista del marcador
}

// Función para eliminar el ÚLTIMO gol del equipo especificado del historial
function removeLastGoalFromHistory(teamName) {
    // Buscar la última ocurrencia del gol de este equipo en el historial
    for (let i = goalsHistory.length - 1; i >= 0; i--) {
        if (goalsHistory[i].team === teamName) {
            goalsHistory.splice(i, 1); // Eliminar esa entrada
            break; // Salir del bucle después de encontrar y eliminar el último
        }
    }
    localStorage.setItem('goalsHistory', JSON.stringify(goalsHistory));
    renderGoalsHistory(); // Volver a renderizar la lista
}


// Función para renderizar el historial de goles
function renderGoalsHistory() {
    goalsList.innerHTML = ''; // Limpiar la lista antes de renderizar
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
            goalsHistory = []; // Reset if corrupted
        }
    } else {
        goalsHistory = []; // Ensure it's an empty array if nothing in localStorage
    }


    if (goalsHistory.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Aún no se han marcado goles.';
        goalsList.appendChild(li);
    } else {
        // Renderizar los goles
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
    isMatchTimerRunning = JSON.parse(localStorage.getItem('isMatchTimerRunning')) || false;
    updateMatchTimerDisplay();
    // No reanudar automáticamente el match timer aquí, para evitar que corra sin interacción
    // El usuario debe hacer clic en "Reanudar" si quiere que siga.
    if (isMatchTimerRunning) {
        startPauseMatchTimerButton.textContent = 'Pausar'; // Actualizar el texto del botón
        matchTimerInterval = setInterval(() => { // Asegurarse de que el intervalo se reestablece
            matchTime++;
            updateMatchTimerDisplay();
        }, 1000);
    } else {
        startPauseMatchTimerButton.textContent = 'Iniciar';
    }


    // Cargar posesión
    possessionTimeA = parseInt(localStorage.getItem('possessionTimeA')) || 0;
    possessionTimeB = parseInt(localStorage.getItem('possessionTimeB')) || 0;
    currentPossessionTeam = localStorage.getItem('currentPossessionTeam');
    updatePossessionDisplays();
    // No reanudar la posesión automáticamente, solo si el partido está en marcha
    if (isMatchTimerRunning && currentPossessionTeam) {
         startPossession(currentPossessionTeam); // Reanudar si estaba corriendo y el partido está corriendo
    }

    // Cargar estadísticas personalizadas (usando la nueva lógica de carga)
    loadCustomStats();

    // Cargar y renderizar historial de goles
    renderGoalsHistory(); // Esta función ahora carga desde localStorage internamente
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

        // Reiniciar Temporizador de Partido
        resetMatchTimer(); // Esto también detendrá la posesión

        // Reiniciar Posesión (por si acaso, aunque resetMatchTimer ya lo hace)
        resetPossession();

        // Reiniciar Estadísticas Personalizadas a las predefinidas
        customStats = initialCustomStats.map(stat => ({ ...stat })); // Clonar para que sean independientes
        saveCustomStats(); // Guarda el array predefinido
        renderCustomStats(); // Renderiza las estadísticas predefinidas

        // Limpiar nombres de equipos si se desea (opcional)
        // teamANameInput.value = 'Equipo A';
        // teamBNameInput.value = 'Equipo B';
        // localStorage.removeItem('teamAName');
        // localStorage.removeItem('teamBName');
        // teamAPossessionName.textContent = 'Equipo A';
        // teamBPossessionName.textContent = 'Equipo B';

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
