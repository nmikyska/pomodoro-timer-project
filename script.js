const TIME_MODES = {
    pomodoro: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
};

let currentMode = 'pomodoro';
let timeLeft = TIME_MODES[currentMode];
let timerId = null;
let isRunning = false;

// DOM Elements
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const modeBtns = document.querySelectorAll('.mode-btn');
const timeDisplay = document.querySelector('.time-display');
const customMinutesInput = document.getElementById('customMinutes');
const setCustomBtn = document.getElementById('setCustomBtn');

// Audio Context for the alert chime
let audioCtx = null;

function playChime() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    // Resume audio context if it was suspended
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    // Play a pleasant 2-tone melodic chime
    const playNote = (frequency, startTime, duration) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    };

    const now = audioCtx.currentTime;
    playNote(523.25, now, 0.6); // C5
    playNote(659.25, now + 0.3, 0.8); // E5
    playNote(783.99, now + 0.6, 1.0); // G5
}

function updateDisplay() {
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    
    minutesEl.textContent = min.toString().padStart(2, '0');
    secondsEl.textContent = sec.toString().padStart(2, '0');
    
    // Document title update for visibility when tab is inactive
    document.title = `${minutesEl.textContent}:${secondsEl.textContent} - Pomodoro`;
    
    // Add warning color if less than 1 minute remaining
    if (timeLeft <= 60 && timeLeft > 0) {
        timeDisplay.classList.add('pulse-warning');
    } else {
        timeDisplay.classList.remove('pulse-warning');
    }
}

function switchMode(mode) {
    if (isRunning) {
        if (!confirm('Timer is running. Are you sure you want to switch modes?')) {
            return;
        }
        pauseTimer();
    }
    
    currentMode = mode;
    timeLeft = TIME_MODES[currentMode];
    
    // Update active button state
    modeBtns.forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    timeDisplay.classList.remove('pulse-warning');
    updateDisplay();
}

function startTimer() {
    // Initialize audio context on first user interaction
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (timeLeft === 0) return;
    
    isRunning = true;
    startBtn.textContent = 'Pause';
    timeDisplay.classList.remove('paused');
    
    const expectedEnd = Date.now() + (timeLeft * 1000);
    
    // Using simple interval but calculating difference from expected end 
    // to handle tab background throttling
    timerId = setInterval(() => {
        const remaining = Math.round((expectedEnd - Date.now()) / 1000);
        
        if (remaining !== timeLeft) {
            timeLeft = remaining;
            
            if (timeLeft <= 0) {
                timeLeft = 0;
                pauseTimer();
                updateDisplay();
                playChime();
            } else {
                updateDisplay();
            }
        }
    }, 200); // Check more frequently than 1s to ensure accuracy, display updates only when second changes
}

function pauseTimer() {
    isRunning = false;
    startBtn.textContent = 'Start';
    timeDisplay.classList.add('paused');
    clearInterval(timerId);
}

function resetTimer() {
    pauseTimer();
    timeLeft = TIME_MODES[currentMode];
    updateDisplay();
    timeDisplay.classList.remove('pulse-warning');
}

// Event Listeners
startBtn.addEventListener('click', () => {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
});

resetBtn.addEventListener('click', resetTimer);

modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        switchMode(btn.dataset.mode);
    });
});

setCustomBtn.addEventListener('click', () => {
    const mins = parseInt(customMinutesInput.value, 10);
    if (isNaN(mins) || mins <= 0) {
        alert('Please enter a valid positive number of minutes.');
        return;
    }
    
    if (isRunning) {
        if (!confirm('Timer is running. Are you sure you want to change the time?')) {
            return;
        }
        pauseTimer();
    }
    
    currentMode = 'custom';
    TIME_MODES['custom'] = mins * 60;
    timeLeft = TIME_MODES['custom'];
    
    modeBtns.forEach(btn => btn.classList.remove('active'));
    
    timeDisplay.classList.remove('pulse-warning');
    updateDisplay();
    customMinutesInput.value = ''; // clear input after setting
});

// Initialize display and state
timeDisplay.classList.add('paused');
updateDisplay();
