(function(){
  const timeDisplay = document.getElementById('timeDisplay');
  const statusLabel = document.getElementById('statusLabel');
  const startPauseBtn = document.getElementById('startPause');
  const resetBtn = document.getElementById('reset');
  const lapBtn = document.getElementById('lap');
  const lapsPanel = document.getElementById('lapsPanel');
  const lapsEmpty = document.getElementById('lapsEmpty');
  const ringProgress = document.getElementById('ringProgress');
  const ringLap = document.getElementById('ringLap');

  const R_MAIN = 92, R_LAP = 84;
  const CIRC_MAIN = 2 * Math.PI * R_MAIN;
  const CIRC_LAP = 2 * Math.PI * R_LAP;
  ringProgress.style.strokeDasharray = CIRC_MAIN;
  ringLap.style.strokeDasharray = CIRC_LAP;
  ringProgress.style.strokeDashoffset = CIRC_MAIN;
  ringLap.style.strokeDashoffset = CIRC_LAP;

  let running = false;
  let startTime = 0;
  let elapsed = 0;      // ms elapsed before current run segment
  let rafId = null;
  let laps = [];
  let lastLapElapsed = 0;

  function formatTime(ms){
    const totalCentis = Math.floor(ms / 10);
    const centis = totalCentis % 100;
    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);
    const pad = (n, l=2) => String(n).padStart(l, '0');
    let main;
    if (hours > 0){
      main = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    } else {
      main = `${pad(minutes)}:${pad(seconds)}`;
    }
    return { main, centis: pad(centis) };
  }

  function render(currentElapsed){
    const { main, centis } = formatTime(currentElapsed);
    timeDisplay.innerHTML = `${main}<span class="ms">.${centis}</span>`;

    // main ring: fills every 60s
    const secondFrac = (currentElapsed % 60000) / 60000;
    ringProgress.style.strokeDashoffset = CIRC_MAIN * (1 - secondFrac);

    // lap ring: fills since last lap, over a 30s cycle for visual interest
    const sinceLap = currentElapsed - lastLapElapsed;
    const lapFrac = (sinceLap % 30000) / 30000;
    ringLap.style.strokeDashoffset = CIRC_LAP * (1 - lapFrac);
  }

  function tick(){
    const now = performance.now();
    const currentElapsed = elapsed + (now - startTime);
    render(currentElapsed);
    rafId = requestAnimationFrame(tick);
  }

  function start(){
    running = true;
    startTime = performance.now();
    rafId = requestAnimationFrame(tick);
    startPauseBtn.textContent = 'Pause';
    startPauseBtn.classList.add('pause-state');
    statusLabel.textContent = 'Running';
    statusLabel.classList.add('running');
    resetBtn.disabled = true;
    lapBtn.disabled = false;
  }

  function pause(){
    running = false;
    cancelAnimationFrame(rafId);
    elapsed += performance.now() - startTime;
    startPauseBtn.textContent = 'Start';
    startPauseBtn.classList.remove('pause-state');
    statusLabel.textContent = 'Paused';
    statusLabel.classList.remove('running');
    resetBtn.disabled = false;
    lapBtn.disabled = true;
  }

  function reset(){
    running = false;
    cancelAnimationFrame(rafId);
    elapsed = 0;
    lastLapElapsed = 0;
    laps = [];
    render(0);
    startPauseBtn.textContent = 'Start';
    startPauseBtn.classList.remove('pause-state');
    statusLabel.textContent = 'Ready';
    statusLabel.classList.remove('running');
    resetBtn.disabled = true;
    lapBtn.disabled = true;
    lapsPanel.innerHTML = '';
    lapsPanel.appendChild(lapsEmpty);
  }

  function recordLap(){
    const now = performance.now();
    const currentElapsed = elapsed + (running ? (now - startTime) : 0);
    const delta = currentElapsed - lastLapElapsed;
    lastLapElapsed = currentElapsed;
    laps.push(currentElapsed);

    if (lapsEmpty.parentNode === lapsPanel){
      lapsPanel.removeChild(lapsEmpty);
    }

    const row = document.createElement('div');
    row.className = 'lap-row';
    const { main, centis } = formatTime(currentElapsed);
    const deltaFmt = formatTime(delta);
    row.innerHTML = `
      <span class="lap-index">LAP ${String(laps.length).padStart(2,'0')}</span>
      <span class="lap-time">${main}.${centis}</span>
      <span class="lap-delta">+${deltaFmt.main}.${deltaFmt.centis}</span>
    `;
    lapsPanel.prepend(row);
  }

  startPauseBtn.addEventListener('click', () => {
    if (running) pause(); else start();
  });
  resetBtn.addEventListener('click', reset);
  lapBtn.addEventListener('click', recordLap);

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space'){
      e.preventDefault();
      if (running) pause(); else start();
    } else if (e.code === 'KeyL' && !lapBtn.disabled){
      recordLap();
    } else if (e.code === 'KeyR' && !resetBtn.disabled){
      reset();
    }
  });

  render(0);
})();
