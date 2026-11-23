(() => {
  const host = document.getElementById('trajectoryAnalysis');
  if (!host) return;
  const image = document.getElementById('trajectoryAnalysisImage');
  const tasks = document.getElementById('trajectoryAnalysisTasks');
  const buttons = [...host.querySelectorAll('button[data-analysis-image]')];
  buttons.forEach((button) => button.addEventListener('click', () => {
    image.src = button.dataset.analysisImage;
    image.alt = button.dataset.analysisAlt;
    tasks.textContent = button.dataset.analysisTasks + '.';
    buttons.forEach((candidate) => {
      const active = candidate === button;
      candidate.classList.toggle('on', active);
      candidate.setAttribute('aria-pressed', String(active));
    });
    host.querySelector('.analysis-scroll').scrollLeft = 0;
  }));
})();
