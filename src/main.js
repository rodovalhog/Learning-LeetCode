import './style.css';
import { PROBLEMS } from './problems.js';
import { runAndTrace } from './tracer.js';
import { createCodeEditor } from './editor.js';
import { renderExecutionState, renderSnapshotsAccordion } from './visualizer.js';
import confetti from 'canvas-confetti';

// State variables
let currentProblemIndex = 0;
let currentProblem = PROBLEMS[0];
let currentTestCaseIndex = 0;
let autoRunEnabled = true;

let executionResult = null;
let currentStepIndex = 0;
let isPlaying = false;
let playInterval = null;
let playbackSpeed = 600;
let debounceTimer = null;
let currentViewMode = 'interactive'; // 'interactive' | 'snapshots'

// DOM Elements
const problemSelect = document.getElementById('problem-select');
const problemDescCard = document.getElementById('problem-desc-card');
const editorContainer = document.getElementById('editor-container');
const testCasesButtonsContainer = document.getElementById('test-cases-buttons');
const visualizerScrollArea = document.getElementById('visualizer-scroll-area');

// View Mode Tabs & Containers
const tabInteractive = document.getElementById('tab-interactive');
const tabSnapshots = document.getElementById('tab-snapshots');
const viewInteractiveContainer = document.getElementById('view-interactive-container');
const viewSnapshotsContainer = document.getElementById('view-snapshots-container');
const snapshotsCountBadge = document.getElementById('snapshots-count-badge');
const snapshotsToolbarCounter = document.getElementById('snapshots-toolbar-counter');
const snapshotsScrollArea = document.getElementById('snapshots-scroll-area');
const btnExpandAllSnapshots = document.getElementById('btn-expand-all-snapshots');
const btnCollapseAllSnapshots = document.getElementById('btn-collapse-all-snapshots');

const btnToggleAutoRun = document.getElementById('btn-toggle-autorun');
const btnRunTests = document.getElementById('btn-run-tests');
const btnRunManual = document.getElementById('btn-run-manual');
const btnResetCode = document.getElementById('btn-reset-code');
const btnToggleDesc = document.getElementById('btn-toggle-desc');
const btnHelp = document.getElementById('btn-help');

const btnFirstStep = document.getElementById('btn-first-step');
const btnPrevStep = document.getElementById('btn-prev-step');
const btnPlayPause = document.getElementById('btn-play-pause');
const btnNextStep = document.getElementById('btn-next-step');
const btnLastStep = document.getElementById('btn-last-step');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');
const speedSelect = document.getElementById('speed-select');
const stepSlider = document.getElementById('step-slider');
const stepCounterText = document.getElementById('step-counter-text');

const modalTests = document.getElementById('modal-tests');
const modalTestsBody = document.getElementById('modal-tests-body');
const btnCloseTests = document.getElementById('btn-close-tests');

const modalHelp = document.getElementById('modal-help');
const btnCloseHelp = document.getElementById('btn-close-help');

// Initialize CodeMirror Editor
const editor = createCodeEditor({
  container: editorContainer,
  initialCode: currentProblem.defaultCode,
  onChange: handleCodeChange
});

// Populate Problem Selector
function setupProblemSelector() {
  problemSelect.innerHTML = PROBLEMS.map((p, idx) => `
    <option value="${idx}">${p.number > 0 ? `#${p.number} - ` : ''}${p.title}</option>
  `).join('');

  problemSelect.addEventListener('change', (e) => {
    selectProblem(parseInt(e.target.value, 10));
  });
}

function selectProblem(index) {
  stopPlayback();
  currentProblemIndex = index;
  currentProblem = PROBLEMS[index];
  currentTestCaseIndex = 0;

  renderProblemInfo();
  renderTestCaseButtons();
  editor.setCode(currentProblem.defaultCode);
  executeCurrentCode();
}

function renderProblemInfo() {
  const diffBadgeClass = currentProblem.difficulty === 'Fácil' ? 'badge-difficulty-easy' : 'badge-difficulty-medium';
  problemDescCard.innerHTML = `
    <div class="problem-meta-badges">
      <span class="${diffBadgeClass}">${currentProblem.difficulty}</span>
      ${currentProblem.tags.map(t => `<span class="badge-tag">${t}</span>`).join('')}
    </div>
    <div class="problem-prompt">${currentProblem.description}</div>
  `;
}

function renderTestCaseButtons() {
  if (!currentProblem.testCases || currentProblem.testCases.length === 0) {
    testCasesButtonsContainer.innerHTML = '';
    return;
  }

  testCasesButtonsContainer.innerHTML = currentProblem.testCases.map((tc, idx) => `
    <button class="test-case-btn ${idx === currentTestCaseIndex ? 'active' : ''}" data-index="${idx}">
      ${tc.name || `Caso ${idx + 1}`}
    </button>
  `).join('');

  testCasesButtonsContainer.querySelectorAll('.test-case-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.dataset.index, 10);
      switchTestCase(idx);
    });
  });
}

/**
 * Replaces the call in user code with the selected test case input
 */
function switchTestCase(idx) {
  currentTestCaseIndex = idx;
  renderTestCaseButtons();

  const tc = currentProblem.testCases[idx];
  if (!tc) return;

  const currentCode = editor.getCode();
  // Detect function call at the end of the script (e.g. fn(args...))
  const callRegex = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\((?:[^)(]|\([^)(]*\))*\);?\s*$/;
  const match = currentCode.match(callRegex);

  if (match) {
    const fnName = match[1];
    const newArgsStr = tc.args.map(a => JSON.stringify(a)).join(', ');
    const newCall = `${fnName}(${newArgsStr});`;
    const newCode = currentCode.replace(callRegex, newCall);
    editor.setCode(newCode);
    executeCurrentCode();
  } else {
    executeCurrentCode();
  }
}

/**
 * Switches between interactive player view and snapshots accordion view
 */
function switchViewMode(mode) {
  currentViewMode = mode;
  if (mode === 'interactive') {
    tabInteractive.classList.add('active');
    tabSnapshots.classList.remove('active');
    viewInteractiveContainer.style.display = 'flex';
    viewSnapshotsContainer.style.display = 'none';
  } else {
    tabSnapshots.classList.add('active');
    tabInteractive.classList.remove('active');
    viewSnapshotsContainer.style.display = 'flex';
    viewInteractiveContainer.style.display = 'none';
    renderSnapshots();
    const activeStep = executionResult?.steps?.[currentStepIndex];
    if (activeStep && activeStep.line) {
      editor.highlightLine(activeStep.line);
    }
  }
}

let snapshotHoverTimer = null;

function renderSnapshots() {
  if (!executionResult || !executionResult.steps) {
    if (snapshotsScrollArea) {
      snapshotsScrollArea.innerHTML = '<div class="visualizer-empty"><p>Nenhum snapshot disponível.</p></div>';
    }
    return;
  }

  renderSnapshotsAccordion(
    snapshotsScrollArea,
    executionResult.steps,
    currentStepIndex,
    (jumpIndex) => {
      // Quando clica em "Ver no Player", comuta para a aba do player e vai para o passo
      switchViewMode('interactive');
      goToStep(jumpIndex);
    },
    currentProblem ? currentProblem.id : 'default',
    (hoverIndex, line) => {
      if (line && line > 0) {
        editor.highlightLine(line);
      }
    }
  );
}

function updateActiveSnapshotInAccordion(index) {
  if (!snapshotsScrollArea) return;
  snapshotsScrollArea.querySelectorAll('.snapshot-card').forEach((card, idx) => {
    if (idx === index) {
      card.classList.add('active-snapshot');
    } else {
      card.classList.remove('active-snapshot');
    }
  });
}

/**
 * Executes current code and updates visualizer state
 */
function executeCurrentCode() {
  const code = editor.getCode();
  executionResult = runAndTrace(code);

  if (!executionResult.success) {
    stopPlayback();
    editor.highlightLine(executionResult.error?.line || 1);
    renderExecutionState(visualizerScrollArea, null, 0, executionResult.error);
    if (snapshotsScrollArea) {
      snapshotsScrollArea.innerHTML = `
        <div class="visualizer-empty">
          <p style="color: #fb7185;">Erro no código. Corrija para gerar os snapshots.</p>
        </div>
      `;
    }
    snapshotsCountBadge.textContent = '0';
    snapshotsToolbarCounter.textContent = '0 etapas';
    updatePlayerControls(0, 0);
    return;
  }

  const steps = executionResult.steps || [];
  stepSlider.max = Math.max(0, steps.length - 1);
  snapshotsCountBadge.textContent = `${steps.length}`;
  snapshotsToolbarCounter.textContent = `${steps.length} etapa${steps.length === 1 ? '' : 's'} gerada${steps.length === 1 ? '' : 's'}`;

  // Jump to step 0 or stay in current step
  currentStepIndex = 0;
  goToStep(currentStepIndex);
  renderSnapshots();
}

function handleCodeChange(newCode) {
  if (!autoRunEnabled) return;
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    executeCurrentCode();
  }, 400);
}

/**
 * Jump to step index
 */
function goToStep(index) {
  if (!executionResult || !executionResult.steps || executionResult.steps.length === 0) return;

  const steps = executionResult.steps;
  currentStepIndex = Math.max(0, Math.min(index, steps.length - 1));
  const activeStep = steps[currentStepIndex];

  // Highlight line in CodeMirror
  if (activeStep && activeStep.line) {
    editor.highlightLine(activeStep.line);
  }

  // Render Visualizer
  renderExecutionState(
    visualizerScrollArea,
    activeStep,
    steps.length,
    null,
    executionResult.returnValue
  );

  // Update controls
  updatePlayerControls(currentStepIndex, steps.length);

  // Update active state in snapshots
  updateActiveSnapshotInAccordion(currentStepIndex);
}

function updatePlayerControls(current, total) {
  stepSlider.value = current;
  stepCounterText.textContent = total > 0 ? `Passo ${current + 1} de ${total}` : 'Passo 0 de 0';

  btnFirstStep.disabled = current <= 0;
  btnPrevStep.disabled = current <= 0;
  btnNextStep.disabled = current >= total - 1;
  btnLastStep.disabled = current >= total - 1;
}

/**
 * Player playback loop
 */
function togglePlayPause() {
  if (isPlaying) {
    stopPlayback();
  } else {
    startPlayback();
  }
}

function startPlayback() {
  if (!executionResult || !executionResult.steps || executionResult.steps.length <= 1) return;
  isPlaying = true;
  iconPlay.style.display = 'none';
  iconPause.style.display = 'block';

  // If already at end, restart from beginning
  if (currentStepIndex >= executionResult.steps.length - 1) {
    currentStepIndex = 0;
    goToStep(0);
  }

  clearInterval(playInterval);
  playInterval = setInterval(() => {
    if (currentStepIndex < executionResult.steps.length - 1) {
      goToStep(currentStepIndex + 1);
    } else {
      stopPlayback();
    }
  }, playbackSpeed);
}

function stopPlayback() {
  isPlaying = false;
  clearInterval(playInterval);
  iconPlay.style.display = 'block';
  iconPause.style.display = 'none';
}

/**
 * Test Suite Runner
 */
function runAllTestCases() {
  const code = editor.getCode();
  const testCases = currentProblem.testCases || [];

  if (testCases.length === 0) {
    alert('Nenhum caso de teste pré-definido para este problema.');
    return;
  }

  modalTestsBody.innerHTML = '<p style="color: var(--text-muted);">Executando casos de teste...</p>';
  modalTests.style.display = 'flex';

  setTimeout(() => {
    let allPassed = true;
    let passedCount = 0;

    // Extract function name
    const match = code.match(/function\s+([a-zA-Z0-9_$]+)/);
    const fnName = match ? match[1] : null;

    if (!fnName) {
      modalTestsBody.innerHTML = `
        <div class="test-suite-card">
          <div class="test-status-pill status-failed">Erro</div>
          <p>Não foi possível identificar a função principal declarada no código.</p>
        </div>
      `;
      return;
    }

    const resultsHtml = testCases.map((tc, idx) => {
      // Test code with this input
      const testCode = `${code}\n${fnName}(...${JSON.stringify(tc.args)});`;
      const res = runAndTrace(testCode);

      const actual = res.returnValue;
      const expected = tc.expected;
      const isPassed = JSON.stringify(actual) === JSON.stringify(expected);

      if (isPassed) passedCount++;
      else allPassed = false;

      return `
        <div class="test-suite-card">
          <div class="test-suite-header">
            <span style="font-weight: 700; font-size: 0.88rem;">${tc.name || `Caso #${idx + 1}`}</span>
            <span class="test-status-pill ${isPassed ? 'status-passed' : 'status-failed'}">
              ${isPassed ? '✓ PASSOU' : '✕ FALHOU'}
            </span>
          </div>
          <div class="test-suite-details">
            <div>Entrada: <code>${tc.args.map(a => JSON.stringify(a)).join(', ')}</code></div>
            <div>Esperado: <code style="color: #34d399;">${JSON.stringify(expected)}</code></div>
            <div>Obtido: <code style="color: ${isPassed ? '#34d399' : '#fb7185'};">${JSON.stringify(actual)}</code></div>
          </div>
        </div>
      `;
    }).join('');

    const summaryHtml = `
      <div style="padding: 0.75rem 1rem; border-radius: 8px; background: ${allPassed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)'}; border: 1px solid ${allPassed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'};">
        <h3 style="font-size: 1rem; color: ${allPassed ? '#34d399' : '#fb7185'}; margin-bottom: 0.25rem;">
          ${allPassed ? '🎉 Incrível! Todos os testes passaram!' : `⚠️ ${passedCount} de ${testCases.length} testes passaram.`}
        </h3>
        <p style="font-size: 0.8rem; color: var(--text-muted);">
          ${allPassed ? 'Sua solução está correta e passou em todos os casos de teste do LeetCode.' : 'Revise a lógica para cobrir todos os cenários de borda.'}
        </p>
      </div>
    `;

    modalTestsBody.innerHTML = summaryHtml + resultsHtml;

    if (allPassed) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  }, 100);
}

// Event Listeners
tabInteractive.addEventListener('click', () => switchViewMode('interactive'));
tabSnapshots.addEventListener('click', () => switchViewMode('snapshots'));

btnExpandAllSnapshots.addEventListener('click', () => {
  if (snapshotsScrollArea) {
    snapshotsScrollArea.querySelectorAll('.snapshot-card').forEach(card => card.classList.remove('collapsed'));
  }
});

btnCollapseAllSnapshots.addEventListener('click', () => {
  if (snapshotsScrollArea) {
    snapshotsScrollArea.querySelectorAll('.snapshot-card').forEach(card => card.classList.add('collapsed'));
  }
});

btnToggleAutoRun.addEventListener('click', () => {
  autoRunEnabled = !autoRunEnabled;
  if (autoRunEnabled) {
    btnToggleAutoRun.classList.add('active');
    btnToggleAutoRun.querySelector('span:last-child').textContent = 'Tempo Real';
    executeCurrentCode();
  } else {
    btnToggleAutoRun.classList.remove('active');
    btnToggleAutoRun.querySelector('span:last-child').textContent = 'Manual';
  }
});

btnRunManual.addEventListener('click', () => {
  executeCurrentCode();
});

btnRunTests.addEventListener('click', () => {
  runAllTestCases();
});

btnCloseTests.addEventListener('click', () => {
  modalTests.style.display = 'none';
});

btnHelp.addEventListener('click', () => {
  modalHelp.style.display = 'flex';
});

btnCloseHelp.addEventListener('click', () => {
  modalHelp.style.display = 'none';
});

// Close modals on clicking backdrop
[modalTests, modalHelp].forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
});

btnResetCode.addEventListener('click', () => {
  if (confirm('Deseja restaurar o código original deste problema?')) {
    editor.setCode(currentProblem.defaultCode);
    executeCurrentCode();
  }
});

let isDescCollapsed = false;
btnToggleDesc.addEventListener('click', () => {
  isDescCollapsed = !isDescCollapsed;
  problemDescCard.style.display = isDescCollapsed ? 'none' : 'block';
  btnToggleDesc.querySelector('svg').style.transform = isDescCollapsed ? 'rotate(180deg)' : 'none';
});

// Stepper controls
btnFirstStep.addEventListener('click', () => {
  stopPlayback();
  goToStep(0);
});

btnPrevStep.addEventListener('click', () => {
  stopPlayback();
  goToStep(currentStepIndex - 1);
});

btnPlayPause.addEventListener('click', () => {
  togglePlayPause();
});

btnNextStep.addEventListener('click', () => {
  stopPlayback();
  goToStep(currentStepIndex + 1);
});

btnLastStep.addEventListener('click', () => {
  stopPlayback();
  if (executionResult && executionResult.steps) {
    goToStep(executionResult.steps.length - 1);
  }
});

stepSlider.addEventListener('input', (e) => {
  stopPlayback();
  goToStep(parseInt(e.target.value, 10));
});

speedSelect.addEventListener('change', (e) => {
  playbackSpeed = parseInt(e.target.value, 10);
  if (isPlaying) {
    clearInterval(playInterval);
    playInterval = setInterval(() => {
      if (currentStepIndex < executionResult.steps.length - 1) {
        goToStep(currentStepIndex + 1);
      } else {
        stopPlayback();
      }
    }, playbackSpeed);
  }
});

// Global Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
  // If user is focused on CodeMirror, don't hijack editing keys
  const isEditing = document.activeElement && document.activeElement.closest('.cm-editor');
  if (isEditing) return;

  if (e.code === 'Space') {
    e.preventDefault();
    togglePlayPause();
  } else if (e.code === 'ArrowRight') {
    e.preventDefault();
    stopPlayback();
    goToStep(currentStepIndex + 1);
  } else if (e.code === 'ArrowLeft') {
    e.preventDefault();
    stopPlayback();
    goToStep(currentStepIndex - 1);
  } else if (e.code === 'Home') {
    e.preventDefault();
    stopPlayback();
    goToStep(0);
  } else if (e.code === 'End') {
    e.preventDefault();
    stopPlayback();
    if (executionResult && executionResult.steps) {
      goToStep(executionResult.steps.length - 1);
    }
  }
});

// Boot the application
setupProblemSelector();
selectProblem(0);
