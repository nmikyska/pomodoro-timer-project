const TIME_MODES = {
    pomodoro: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
};

let currentMode = 'pomodoro';
let timeLeft = TIME_MODES[currentMode];
let timerId = null;
let isRunning = false;
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
    
    $('#minutes').text(min.toString().padStart(2, '0'));
    $('#seconds').text(sec.toString().padStart(2, '0'));
    
    // Document title update for visibility when tab is inactive
    document.title = `${$('#minutes').text()}:${$('#seconds').text()} - Pomodoro`;
    
    // Add warning color if less than 1 minute remaining
    if (timeLeft <= 60 && timeLeft > 0) {
        $('.time-display').addClass('pulse-warning');
    } else {
        $('.time-display').removeClass('pulse-warning');
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
    $('.mode-btn').removeClass('active');
    $(`.mode-btn[data-mode="${mode}"]`).addClass('active');

    $('.time-display').removeClass('pulse-warning');
    updateDisplay();
}

function startTimer() {
    // Initialize audio context on first user interaction
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    if (timeLeft === 0) return;
    
    isRunning = true;
    $('#startBtn').text('Pause');
    $('.time-display').removeClass('paused');
    
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
    $('#startBtn').text('Start');
    $('.time-display').addClass('paused');
    clearInterval(timerId);
}

function resetTimer() {
    pauseTimer();
    timeLeft = TIME_MODES[currentMode];
    updateDisplay();
    $('.time-display').removeClass('pulse-warning');
}

$(document).ready(function() {
    // Event Listeners
    $('#startBtn').on('click', () => {
        if (isRunning) {
            pauseTimer();
        } else {
            startTimer();
        }
    });

    $('#resetBtn').on('click', resetTimer);

    $('.mode-btn').on('click', function() {
        switchMode($(this).data('mode'));
    });

    $('#setCustomBtn').on('click', () => {
        const mins = parseInt($('#customMinutes').val(), 10);
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
        
        $('.mode-btn').removeClass('active');
        
        $('.time-display').removeClass('pulse-warning');
        updateDisplay();
        $('#customMinutes').val(''); // clear input after setting
    });

    // Initialize display and state
    $('.time-display').addClass('paused');
    updateDisplay();
});
