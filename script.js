document.addEventListener('DOMContentLoaded', () => {
    // === SELECTORES DE ELEMENTOS DEL DOM ===

    // Selectors for team names
    const teamANameInput = document.getElementById('teamAName');
    const teamBNameInput = document.getElementById('teamBName');
    const teamALabelGoals = document.getElementById('teamALabelGoals');
    const teamBLabelGoals = document.getElementById('teamBLabelGoals');
    const possessionTeamA = document.getElementById('possessionTeamA');
    const possessionTeamB = document.getElementById('possessionTeamB');

    // Match timer elements (NEW)
    const matchTimerEl = document.getElementById('matchTimer');
    const toggleMatchTimerBtn = document.getElementById('toggleMatchTimer');
    const resetMatchTimerBtn = document.getElementById('resetMatchTimer');

    // Possession timer elements
    const possessionTimerAEl = document.getElementById('possessionTimerA');
    const possessionTimerBEl = document.getElementById('possessionTimerB');
    const possessionPercentAEl = document.getElementById('possessionPercentA');
    const possessionPercentBEl = document.getElementById('possessionPercentB');
    const possessionBarA = document.getElementById('possessionBarA');
    const togglePossessionABtn = document.getElementById('togglePossessionA');
    const togglePossessionBBtn = document.getElementById('togglePossessionB');
    const resetPossessionBtn = document.getElementById('resetPossession');
    const timerGroupA = possessionTimerAEl.closest('.timer-group');
    const timerGroupB = possessionTimerBEl.closest('.timer-group');

    // Custom stats management elements
    const newStatNameInput = document.getElementById('newStatName');
    const addStatBtn = document.getElementById('addStatBtn');
    const generalStatsContainer = document.getElementById('generalStatsContainer');

    // Reset All button
    const resetAllBtn = document.getElementById('resetAll');


    // === VARIABLES DE ESTADO INICIALES ===
    let matchTime = 0; // in milliseconds
    let matchInterval = null;
    let matchRunning = false; // Is the main match timer running?

    let possessionInterval = null;
    let currentPossessionTeam = null; // 'A' or 'B'
    let possessionTimeA = 0; // in milliseconds
    let possessionTimeB = 0; // in milliseconds

    let customStats = []; // Array to hold custom stat objects {id, name, valueA, valueB}
    let statIdCounter = 0; // Counter for unique stat IDs

    // Predetermined stats for initial load
    const defaultStats = [
        "Disparos a puerta",
        "Disparos Fuera",
        "Corners",
        "Fuera de juego",
        "Faltas",
        "Amarilla",
        "Roja",
        "Saques de puerta"
    ];

    // === FUNCIONES DE PERSISTENCIA (GUARDADO/CARGA AUTOMÁTICO) ===
    function saveState() {
        const state = {
            teamA: teamANameInput.value,
            teamB: teamBNameInput.value,
            teamAGoals: parseInt(document.getElementById('teamAGoals').textContent),
            teamBGoals: parseInt(document.getElementById('teamBGoals').textContent),
            matchTime: matchTime,
            matchRunning: matchRunning, // Save running state too
            possessionTimeA: possessionTimeA,
            possessionTimeB: possessionTimeB,
            currentPossessionTeam: currentPossessionTeam,
            customStats: customStats,
            statIdCounter: statIdCounter
        };
        localStorage.setItem('matchStatsApp', JSON.stringify(state));
        console.log('Estado guardado automáticamente.');
    }

    function loadState() {
        const savedState = JSON.parse(localStorage.getItem('matchStatsApp'));
        if (savedState) {
            teamANameInput.value = savedState.teamA || 'Tarragona';
            teamBNameInput.value = savedState.teamB || 'Camp Clar';
            document.getElementById('teamAGoals').textContent = savedState.teamAGoals || 0;
            document.getElementById('teamBGoals').textContent = savedState.teamBGoals || 0;

            matchTime = savedState.matchTime || 0;
            // matchRunning is handled by start/pause logic, not loaded directly
            // If it was running, we restart it after load.

            possessionTimeA = savedState.possessionTimeA || 0;
            possessionTimeB = savedState.possessionB || 0;
            currentPossessionTeam = savedState.currentPossessionTeam || null;

            customStats = savedState.customStats || [];
            statIdCounter = savedState.statIdCounter || 0;

            // Initialize UI based on loaded state
            updateTeamNames();
            updateMatchTimerDisplay(); // Update display for match timer
            updatePossessionTimers(); // Update display for possession timers
            renderCustomStats(); // Re-render custom stats

            // If match was running before, restart it (but allow user to explicitly pause if needed)
            if (savedState.matchRunning) {
                // We don't call toggleMatchTimer directly on load, as it might start immediately.
                // It's better to let the user decide to resume.
                console.log("Partido estaba en curso. Pulsa 'Iniciar' para reanudar.");
                toggleMatchTimerBtn.textContent = '▶️ Iniciar'; // Ensure button reflects paused state
                toggleMatchTimerBtn.classList.add('active'); // Visually indicate it's ready to play
                matchRunning = false; // Set to false so the user has to click to resume
            }

            console.log('Estado cargado automáticamente.');
        } else {
            // Initialize with default stats if no saved state
            initializeDefaultStats();
            updateTeamNames();
            updateMatchTimerDisplay();
            updatePossessionTimers();
            renderCustomStats();
            console.log('No hay estado guardado, inicializando con valores por defecto.');
        }
    }

    // === FUNCIONES PRINCIPALES ===

    // Formato de tiempo (reutilizable para ambos temporizadores)
    function formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return [hours, minutes, seconds]
            .map(t => String(t).padStart(2, '0'))
            .join(':');
    }

    // Match Timer Logic
    function updateMatchTimerDisplay() {
        matchTimerEl.textContent = formatTime(matchTime);
    }

    function toggleMatchTimer() {
        if (matchRunning) {
            clearInterval(matchInterval);
            matchRunning = false;
            toggleMatchTimerBtn.textContent = '▶️ Iniciar';
            toggleMatchTimerBtn.classList.add('active'); // Style for paused state
            // Pause possession timer if it was running
            if (currentPossessionTeam) {
                clearInterval(possessionInterval);
                // Keep currentPossessionTeam as it was, so it can resume
                console.log(`Posesión de ${currentPossessionTeam} pausada.`);
            }
        } else {
            matchInterval = setInterval(() => {
                matchTime += 1000;
                updateMatchTimerDisplay();
                // We don't save state on every second to avoid performance issues.
                // Save state will be called by other events.
            }, 1000);
            matchRunning = true;
            toggleMatchTimerBtn.textContent = '⏸️ Pausar';
            toggleMatchTimerBtn.classList.remove('active'); // Style for running state
            // Resume possession timer if it was active and match resumes
            if (currentPossessionTeam) {
                startPossession(currentPossessionTeam, true); // true to signal it's a resume not a toggle
            }
        }
        saveState(); // Save state when match timer starts/pauses
    }

    function resetMatchTimer() {
        if (confirm('¿Estás seguro de que quieres reiniciar el tiempo del partido?')) {
            clearInterval(matchInterval);
            matchTime = 0;
            matchRunning = false;
            updateMatchTimerDisplay();
            toggleMatchTimerBtn.textContent = '▶️ Iniciar';
            toggleMatchTimerBtn.classList.remove('active'); // Ensure consistent styling after reset

            // Also reset possession if match timer is reset
            resetPossession(); // This function already saves state internally
            saveState(); // Ensure this state is saved too
        }
    }

    toggleMatchTimerBtn.addEventListener('click', toggleMatchTimer);
    resetMatchTimerBtn.addEventListener('click', resetMatchTimer);


    // Update team names dynamically
    function updateTeamNames() {
        const teamA = teamANameInput.value || 'Equipo A';
        const teamB = teamBNameInput.value || 'Equipo B';
        teamALabelGoals.textContent = teamA;
        teamBLabelGoals.textContent = teamB;
        possessionTeamA.textContent = teamA;
        possessionTeamB.textContent = teamB;
        togglePossessionABtn.textContent = teamA + ' Posesión';
        togglePossessionBBtn.textContent = teamB + ' Posesión';

        // Update existing custom stats labels
        document.querySelectorAll('.stat-team-container .team-label-custom-stat').forEach(label => {
            const teamId = label.dataset.team;
            label.textContent = teamId === 'A' ? teamA : teamB;
        });
        saveState(); // Save state after team name changes
    }

    teamANameInput.addEventListener('input', updateTeamNames);
    teamBNameInput.addEventListener('input', updateTeamNames);

    // Goal counters
    document.querySelectorAll('.score-section .controls button').forEach(button => {
        button.addEventListener('click', (event) => {
            const targetId = event.target.dataset.target;
            const counter = document.getElementById(targetId);
            let value = parseInt(counter.textContent);

            if (event.target.classList.contains('plus-btn')) {
                value++;
            } else if (event.target.classList.contains('minus-btn')) {
                value = Math.max(0, value - 1);
            } else if (event.target.classList.contains('reset-btn')) {
                value = 0;
            }
            counter.textContent = value;
            saveState(); // Save state after goal changes
        });
    });

    // Possession timer logic
    function updatePossessionTimers() {
        let totalTime = possessionTimeA + possessionTimeB;
        let percentA = 0;
        let percentB = 0;

        possessionTimerAEl.textContent = formatTime(possessionTimeA);
        possessionTimerBEl.textContent = formatTime(possessionTimeB);

        if (totalTime > 0) {
            percentA = ((possessionTimeA / totalTime) * 100);
            percentB = 100 - percentA;

            possessionPercentAEl.textContent = `${percentA.toFixed(0)}%`;
            possessionPercentBEl.textContent = `${percentB.toFixed(0)}%`;

            if (percentA === 0) possessionPercentAEl.classList.add('hidden-zero');
            else possessionPercentAEl.classList.remove('hidden-zero');

            if (percentB === 0) possessionPercentBEl.classList.add('hidden-zero');
            else possessionPercentBEl.classList.remove('hidden-zero');

        } else {
            possessionPercentAEl.textContent = '0%';
            possessionPercentBEl.textContent = '0%';
            possessionPercentAEl.classList.add('hidden-zero');
            possessionPercentBEl.classList.add('hidden-zero');
        }

        possessionBarA.style.width = `${percentA}%`;

        if (percentA === 100) {
            possessionBarA.style.borderRadius = '15px';
        } else {
            possessionBarA.style.borderRadius = '15px 0 0 15px';
        }
        // Save state is handled by startPossession/resetPossession/match timer pause
    }

    // 'isResume' parameter ensures it doesn't toggle currentPossessionTeam
    function startPossession(team, isResume = false) {
        // Only start/resume possession if the main match timer is running
        if (!matchRunning && !isResume) { // If it's not a resume and match isn't running
            alert('Por favor, inicia el temporizador del partido antes de controlar la posesión.');
            return;
        }

        clearInterval(possessionInterval);

        timerGroupA.classList.remove('active');
        timerGroupB.classList.remove('active');
        togglePossessionABtn.classList.remove('active');
        togglePossessionBBtn.classList.remove('active');

        if (currentPossessionTeam === team && !isResume) { // If same button is pressed (and not a resume), stop
            currentPossessionTeam = null;
        } else { // Else, start/switch to new team
            currentPossessionTeam = team;
            if (team === 'A') {
                togglePossessionABtn.classList.add('active');
                timerGroupA.classList.add('active');
            } else {
                togglePossessionBBtn.classList.add('active');
                timerGroupB.classList.add('active');
            }

            // Only set interval if match is running and a team is selected for possession
            if (matchRunning && currentPossessionTeam) {
                possessionInterval = setInterval(() => {
                    if (currentPossessionTeam === 'A') {
                        possessionTimeA += 1000;
                    } else if (currentPossessionTeam === 'B') {
                        possessionTimeB += 1000;
                    }
                    updatePossessionTimers();
                }, 1000);
            }
        }
        updatePossessionTimers(); // Update display immediately
        saveState(); // Save state after possession change
    }

    togglePossessionABtn.addEventListener('click', () => startPossession('A'));
    togglePossessionBBtn.addEventListener('click', () => startPossession('B'));

    function resetPossession() {
        clearInterval(possessionInterval);
        possessionTimeA = 0;
        possessionTimeB = 0;
        currentPossessionTeam = null;
        updatePossessionTimers();
        timerGroupA.classList.remove('active');
        timerGroupB.classList.remove('active');
        togglePossessionABtn.classList.remove('active');
        togglePossessionBBtn.classList.remove('active');
        saveState(); // Save state after resetting possession
    }
    resetPossessionBtn.addEventListener('click', resetPossession);


    // Custom stats management
    function initializeDefaultStats() {
        defaultStats.forEach(statName => {
            statIdCounter++;
            customStats.push({ id: statIdCounter, name: statName, valueA: 0, valueB: 0 });
        });
    }

    function renderCustomStats() {
        generalStatsContainer.innerHTML = '';
        customStats.forEach(stat => {
            const statRow = document.createElement('div');
            statRow.className = 'stat-row';
            statRow.dataset.id = stat.id;

            const teamA = teamANameInput.value || 'Equipo A';
            const teamB = teamBNameInput.value || 'Equipo B';

            statRow.innerHTML = `
                <div class="stat-name">
                    <input type="text" value="${stat.name}" disabled data-id="${stat.id}">
                    <div class="name-actions">
                        <button class="edit-stat-name-btn">✏️</button>
                        <button class="delete-stat-btn">🗑️</button>
                    </div>
                </div>
                <div class="stat-team-container">
                    <span class="team-label-custom-stat" data-team="A">${teamA}</span>
                    <span id="stat-${stat.id}-A" class="counter">${stat.valueA}</span>
                    <div class="controls compact-controls">
                        <button class="reset-btn" data-stat-id="${stat.id}" data-team="A">🔄</button>
                        <button class="minus-btn" data-stat-id="${stat.id}" data-team="A">-</button>
                        <button class="plus-btn" data-stat-id="${stat.id}" data-team="A">+</button>
                    </div>
                </div>
                <div class="stat-team-container">
                    <span class="team-label-custom-stat" data-team="B">${teamB}</span>
                    <span id="stat-${stat.id}-B" class="counter">${stat.valueB}</span>
                    <div class="controls compact-controls">
                        <button class="reset-btn" data-stat-id="${stat.id}" data-team="B">🔄</button>
                        <button class="minus-btn" data-stat-id="${stat.id}" data-team="B">-</button>
                        <button class="plus-btn" data-stat-id="${stat.id}" data-team="B">+</button>
                    </div>
                </div>
            `;
            generalStatsContainer.appendChild(statRow);
        });

        attachCustomStatListeners();
    }

    function attachCustomStatListeners() {
        generalStatsContainer.querySelectorAll('.plus-btn, .minus-btn, .reset-btn').forEach(button => {
            button.removeEventListener('click', handleStatButtonClick);
            button.addEventListener('click', handleStatButtonClick);
        });

        generalStatsContainer.querySelectorAll('.delete-stat-btn').forEach(button => {
            button.removeEventListener('click', handleDeleteStat);
            button.addEventListener('click', handleDeleteStat);
        });

        generalStatsContainer.querySelectorAll('.edit-stat-name-btn').forEach(button => {
            button.removeEventListener('click', handleEditStatName);
            button.addEventListener('click', handleEditStatName);
        });

        generalStatsContainer.querySelectorAll('.stat-name input[type="text"]').forEach(input => {
            input.removeEventListener('blur', handleStatNameBlur);
            input.addEventListener('blur', handleStatNameBlur);
            input.removeEventListener('keypress', handleStatNameKeypress);
            input.addEventListener('keypress', handleStatNameKeypress);
        });
    }

    function handleStatButtonClick(event) {
        const statId = parseInt(event.target.dataset.statId);
        const team = event.target.dataset.team;
        const stat = customStats.find(s => s.id === statId);

        if (!stat) return;

        if (event.target.classList.contains('plus-btn')) {
            stat[`value${team}`]++;
        } else if (event.target.classList.contains('minus-btn')) {
            stat[`value${team}`] = Math.max(0, stat[`value${team}`] - 1);
        } else if (event.target.classList.contains('reset-btn')) {
            stat[`value${team}`] = 0;
        }
        document.getElementById(`stat-${statId}-${team}`).textContent = stat[`value${team}`];
        saveState(); // Save state after custom stat change
    }

    function handleDeleteStat(event) {
        const statRow = event.target.closest('.stat-row');
        const statId = parseInt(statRow.dataset.id);
        if (confirm('¿Estás seguro de que quieres eliminar esta estadística?')) {
            customStats = customStats.filter(stat => stat.id !== statId);
            renderCustomStats();
            saveState(); // Save state after deleting a stat
        }
    }

    function handleEditStatName(event) {
        const input = event.target.closest('.stat-name').querySelector('input[type="text"]');
        input.disabled = !input.disabled;
        if (!input.disabled) {
            input.focus();
            input.setSelectionRange(0, input.value.length);
        } else {
            const statId = parseInt(input.dataset.id);
            const stat = customStats.find(s => s.id === statId);
            if (stat) {
                stat.name = input.value;
                saveState(); // Save state after editing stat name
            }
        }
    }

    function handleStatNameBlur(event) {
        const input = event.target;
        if (!input.disabled) {
            const statId = parseInt(input.dataset.id);
            const stat = customStats.find(s => s.id === statId);
            if (stat) {
                stat.name = input.value;
                input.disabled = true;
                saveState();
            }
        }
    }

    function handleStatNameKeypress(event) {
        if (event.key === 'Enter') {
            event.target.blur();
        }
    }

    addStatBtn.addEventListener('click', () => {
        const name = newStatNameInput.value.trim();
        if (name) {
            statIdCounter++;
            customStats.push({ id: statIdCounter, name: name, valueA: 0, valueB: 0 });
            newStatNameInput.value = '';
            renderCustomStats();
            saveState(); // Save state after adding a new stat
        } else {
            alert('Por favor, ingresa un nombre para la nueva estadística.');
        }
    });


    // Reset All button
    function resetAllStats() {
        if (confirm('¿Estás seguro de que quieres reiniciar TODAS las estadísticas del partido, incluyendo los tiempos y los goles?')) {
            // Reset goals
            document.getElementById('teamAGoals').textContent = '0';
            document.getElementById('teamBGoals').textContent = '0';

            // Reset match timer
            clearInterval(matchInterval);
            matchTime = 0;
            matchRunning = false;
            updateMatchTimerDisplay();
            toggleMatchTimerBtn.textContent = '▶️ Iniciar';
            toggleMatchTimerBtn.classList.remove('active');

            // Reset possession
            clearInterval(possessionInterval);
            possessionTimeA = 0;
            possessionTimeB = 0;
            currentPossessionTeam = null;
            updatePossessionTimers();
            timerGroupA.classList.remove('active');
            timerGroupB.classList.remove('active');
            togglePossessionABtn.classList.remove('active');
            togglePossessionBBtn.classList.remove('active');

            // Reset custom stats (to default values if desired, or clear completely)
            // For now, reset values to 0, but keep the default stats
            customStats = customStats.map(stat => ({ ...stat, valueA: 0, valueB: 0 }));
            // Or if you want to remove all custom stats and re-add defaults:
            // customStats = [];
            // initializeDefaultStats();

            renderCustomStats();

            alert('Todas las estadísticas han sido reiniciadas.');
            saveState(); // Save the reset state
        }
    }
    resetAllBtn.addEventListener('click', resetAllStats);

    // === INICIALIZACIÓN AL CARGAR LA PÁGINA ===
    loadState(); // Try to load saved state first
    updateTeamNames(); // Ensure team names propagate if loaded or default
    updateMatchTimerDisplay(); // Initial display for match timer
    updatePossessionTimers(); // Initial display for possession timers
    renderCustomStats(); // Render custom stats (either loaded or defaults)

});