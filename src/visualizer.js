/**
 * Visualizer module for rendering real-time execution states
 */

// Distinct color assignments for common pointer names in LeetCode
const POINTER_COLORS = {
  i: { bg: '#3b82f6', text: '#ffffff', glow: 'rgba(59, 130, 246, 0.4)' },
  j: { bg: '#06b6d4', text: '#ffffff', glow: 'rgba(6, 182, 212, 0.4)' },
  left: { bg: '#10b981', text: '#ffffff', glow: 'rgba(16, 185, 129, 0.4)' },
  right: { bg: '#f43f5e', text: '#ffffff', glow: 'rgba(244, 63, 94, 0.4)' },
  mid: { bg: '#f59e0b', text: '#ffffff', glow: 'rgba(245, 158, 11, 0.4)' },
  low: { bg: '#8b5cf6', text: '#ffffff', glow: 'rgba(139, 92, 246, 0.4)' },
  high: { bg: '#ec4899', text: '#ffffff', glow: 'rgba(236, 72, 153, 0.4)' },
  start: { bg: '#10b981', text: '#ffffff', glow: 'rgba(16, 185, 129, 0.4)' },
  end: { bg: '#f43f5e', text: '#ffffff', glow: 'rgba(244, 63, 94, 0.4)' },
  k: { bg: '#a855f7', text: '#ffffff', glow: 'rgba(168, 85, 247, 0.4)' },
  insertPos: { bg: '#14b8a6', text: '#ffffff', glow: 'rgba(20, 184, 166, 0.4)' },
  p: { bg: '#6366f1', text: '#ffffff', glow: 'rgba(99, 102, 241, 0.4)' },
  p1: { bg: '#3b82f6', text: '#ffffff', glow: 'rgba(59, 130, 246, 0.4)' },
  p2: { bg: '#f43f5e', text: '#ffffff', glow: 'rgba(244, 63, 94, 0.4)' },
  slow: { bg: '#10b981', text: '#ffffff', glow: 'rgba(16, 185, 129, 0.4)' },
  fast: { bg: '#f59e0b', text: '#ffffff', glow: 'rgba(245, 158, 11, 0.4)' }
};

function getPointerStyle(name) {
  return (
    POINTER_COLORS[name] || {
      bg: '#64748b',
      text: '#ffffff',
      glow: 'rgba(100, 116, 139, 0.4)'
    }
  );
}

function formatValue(val) {
  if (val === null) return '<span class="val-null">null</span>';
  if (val === undefined) return '<span class="val-undef">undefined</span>';
  if (typeof val === 'number') return `<span class="val-num">${val}</span>`;
  if (typeof val === 'boolean') return `<span class="val-bool">${val}</span>`;
  if (typeof val === 'string') return `<span class="val-str">"${escapeHtml(val)}"</span>`;
  if (Array.isArray(val)) {
    if (val.length === 0) return '[]';
    if (val.length <= 4) {
      return `[${val.map(formatValue).join(', ')}]`;
    }
    return `Array(${val.length})`;
  }
  if (typeof val === 'object') {
    if (val.__isMap) return `Map(${val.entries.length})`;
    if (val.__isSet) return `Set(${val.values.length})`;
    const keys = Object.keys(val);
    if (keys.length === 0) return '{}';
    return `{ ${keys.slice(0, 3).map(k => `${k}: ${formatValue(val[k])}`).join(', ')}${keys.length > 3 ? '...' : ''} }`;
  }
  return escapeHtml(String(val));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Main Visualizer renderer
 */
export function renderExecutionState(container, step, totalSteps, error = null, finalReturn = undefined) {
  if (!container) return;

  if (error) {
    container.innerHTML = `
      <div class="visualizer-error-card">
        <div class="error-header">
          <svg class="error-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h3>${error.type === 'SyntaxError' ? 'Erro de Sintaxe (Ao Digitar)' : error.type === 'LoopLimit' ? 'Limite de Execução Atingido' : 'Erro de Execução (Runtime)'}</h3>
        </div>
        <p class="error-message">${escapeHtml(error.message)}</p>
        <div class="error-footer">
          <span>Linha indicada: <strong>${error.line || 1}</strong></span>
          ${error.type === 'SyntaxError' ? '<span class="error-hint">O código será reexecutado automaticamente assim que você terminar a instrução.</span>' : ''}
        </div>
      </div>
    `;
    return;
  }

  if (!step) {
    container.innerHTML = `
      <div class="visualizer-empty">
        <p>Aguardando execução do código...</p>
      </div>
    `;
    return;
  }

  const {
    stepIndex,
    line,
    type,
    desc,
    variables,
    changedVars,
    arrays,
    maps,
    pointers,
    consoleLogsSnapshot
  } = step;

  // Build HTML sections
  let html = '';

  const effectiveReturn = step.returnValue !== undefined ? step.returnValue : (stepIndex === totalSteps - 1 ? finalReturn : undefined);
  const isFoundStep = type === 'return' || effectiveReturn !== undefined;

  // 1. Current Step Explanation Banner
  const actionBadges = {
    func_enter: '<span class="badge badge-indigo">Função Invocada</span>',
    decl: '<span class="badge badge-emerald">Declaração</span>',
    expr: '<span class="badge badge-cyan">Operação</span>',
    loop: '<span class="badge badge-amber">Iteração</span>',
    return: '<span class="badge badge-success-glow">🎯 Solução / Retorno</span>',
    idle: '<span class="badge badge-slate">Pronto</span>'
  };

  html += `
    <div class="step-summary-banner">
      <div class="step-badge-row">
        <span class="badge badge-line">Linha ${line}</span>
        ${actionBadges[type] || '<span class="badge badge-slate">Instrução</span>'}
        <span class="step-count-pill">Passo ${stepIndex + 1} de ${totalSteps}</span>
      </div>
      <div class="step-description">
        ${escapeHtml(desc)}
      </div>
    </div>
  `;

  // 2. Data Structures (Arrays with Pointers)
  if (arrays && arrays.length > 0) {
    html += `<div class="vis-section">
      <div class="vis-section-header">
        <h4>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="3" y1="9" x2="21" y2="9"></line>
            <line x1="9" y1="21" x2="9" y2="9"></line>
          </svg>
          Arrays & Ponteiros
        </h4>
        <span class="vis-section-subtitle">${arrays.length} array(s) em memória</span>
      </div>
      <div class="arrays-container">
    `;

    arrays.forEach(arr => {
      const arrPointers = (pointers || []).filter(p => p.arrayName === arr.name);

      // Identifica células com índices ou elementos encontrados na solução
      const foundIndices = new Set();
      if (isFoundStep && effectiveReturn !== undefined) {
        if (typeof effectiveReturn === 'number' && Number.isInteger(effectiveReturn) && effectiveReturn >= 0 && effectiveReturn < arr.data.length) {
          foundIndices.add(effectiveReturn);
        } else if (Array.isArray(effectiveReturn)) {
          effectiveReturn.forEach(item => {
            if (typeof item === 'number' && Number.isInteger(item) && item >= 0 && item < arr.data.length) {
              foundIndices.add(item);
            }
          });
        }
      }

      html += `
        <div class="array-card">
          <div class="array-card-header">
            <span class="array-name">${escapeHtml(arr.name)}</span>
            <span class="array-len">length: ${arr.data.length}</span>
          </div>
          <div class="array-scroll-track">
      `;

      if (arr.data.length === 0) {
        html += `<div class="array-empty-msg">[Array Vazio]</div>`;
      } else {
        html += `<div class="array-cells-row">`;
        arr.data.forEach((val, idx) => {
          // Check pointers for this cell
          const cellPointers = arrPointers.filter(p => p.index === idx);
          const isPointed = cellPointers.length > 0;
          const isFound = foundIndices.has(idx);

          html += `
            <div class="array-cell-wrapper">
              <!-- Pointer indicators -->
              <div class="pointer-zone">
                ${isFound ? `
                  <div class="pointer-badge badge-found">
                    <span>🎯 Encontrado</span>
                    <svg class="pointer-arrow" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21l-10-10h6v-11h8v11h6z"/>
                    </svg>
                  </div>
                ` : ''}
                ${cellPointers
                  .map(p => {
                    const style = getPointerStyle(p.varName);
                    return `
                      <div class="pointer-badge" style="background: ${style.bg}; color: ${style.text}; box-shadow: 0 0 10px ${style.glow}">
                        <span>${escapeHtml(p.varName)}</span>
                        <svg class="pointer-arrow" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 21l-10-10h6v-11h8v11h6z"/>
                        </svg>
                      </div>
                    `;
                  })
                  .join('')}
              </div>

              <!-- Value Box -->
              <div class="array-cell-box ${isPointed ? 'cell-pointed' : ''} ${isFound ? 'cell-found' : ''}">
                <span class="cell-value">${formatValue(val)}</span>
              </div>

              <!-- Index Label -->
              <span class="cell-index">[${idx}]</span>
            </div>
          `;
        });
        html += `</div>`;
      }

      html += `
          </div>
        </div>
      `;
    });

    html += `</div></div>`;
  }

  // 3. Hash Maps & Sets
  if (maps && maps.length > 0) {
    html += `
      <div class="vis-section">
        <div class="vis-section-header">
          <h4>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            Coleções Hash (Map / Set)
          </h4>
        </div>
        <div class="maps-container">
      `;

    maps.forEach(m => {
      html += `
        <div class="map-card">
          <div class="map-card-header">
            <span class="map-name">${escapeHtml(m.name)}</span>
            <span class="map-type-badge">${m.type}</span>
          </div>
          <div class="map-content">
      `;

      if (m.type === 'Map') {
        const entries = m.data.entries || [];
        if (entries.length === 0) {
          html += `<div class="map-empty">Map vazio { }</div>`;
        } else {
          html += `<div class="map-entries-grid">`;
          entries.forEach(([k, v]) => {
            const isMatched = (variables?.diff !== undefined && k === variables.diff) ||
                              (variables?.target !== undefined && k === variables.target);
            html += `
              <div class="map-entry-chip ${isMatched ? 'map-entry-matched' : ''}">
                <span class="map-key">${formatValue(k)}</span>
                <span class="map-arrow">➔</span>
                <span class="map-val">${formatValue(v)}</span>
                ${isMatched ? '<span class="map-matched-tag">✓ Par encontrado</span>' : ''}
              </div>
            `;
          });
          html += `</div>`;
        }
      } else {
        const values = m.data.values || [];
        if (values.length === 0) {
          html += `<div class="map-empty">Set vazio ( )</div>`;
        } else {
          html += `<div class="set-values-row">`;
          values.forEach(v => {
            html += `<span class="set-value-pill">${formatValue(v)}</span>`;
          });
          html += `</div>`;
        }
      }

      html += `</div></div>`;
    });

    html += `</div></div>`;
  }

  // 4. Variables Scope Inspector
  const varKeys = Object.keys(variables || {});
  html += `
    <div class="vis-section">
      <div class="vis-section-header">
        <h4>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          Variáveis no Escopo
        </h4>
        <span class="vis-section-subtitle">${varKeys.length} variável(is)</span>
      </div>
      <div class="vars-grid">
  `;

  if (varKeys.length === 0) {
    html += `<div class="vars-empty">Nenhuma variável no escopo atual</div>`;
  } else {
    varKeys.forEach(k => {
      const v = variables[k];
      const isChanged = (changedVars || []).includes(k);
      const isPtr = (pointers || []).some(p => p.varName === k);

      html += `
        <div class="var-card ${isChanged ? 'var-card-changed' : ''}">
          <div class="var-card-top">
            <span class="var-name">${escapeHtml(k)}</span>
            <div class="var-tags">
              ${isPtr ? `<span class="var-tag ptr-tag">ponteiro</span>` : ''}
              <span class="var-tag type-tag">${getTypeLabel(v)}</span>
            </div>
          </div>
          <div class="var-val-display">${formatValue(v)}</div>
        </div>
      `;
    });
  }

  html += `</div></div>`;

  // 5. Console Output Snapshot
  if (consoleLogsSnapshot && consoleLogsSnapshot.length > 0) {
    html += `
      <div class="vis-section">
        <div class="vis-section-header">
          <h4>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="4 17 10 11 4 5"></polyline>
              <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
            Console (Saída em Tempo Real)
          </h4>
        </div>
        <div class="terminal-box">
          ${consoleLogsSnapshot
            .map(log => `
              <div class="terminal-line terminal-${log.type}">
                <span class="term-prompt">❯</span>
                <span class="term-text">${escapeHtml(log.message)}</span>
              </div>
            `)
            .join('')}
        </div>
      </div>
    `;
  }

  // 6. Return Value Section (Shown on return step or final step)
  if (effectiveReturn !== undefined) {
    html += `
      <div class="vis-section return-highlight-section">
        <div class="return-box">
          <div class="return-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h4>Valor Final Retornado pelo Algoritmo (Solução Encontrada):</h4>
          </div>
          <div class="return-value-display">${formatValue(effectiveReturn)}</div>
          <div class="return-hint">
            ✓ Todos os arrays, ponteiros e variáveis no escopo acima foram preservados para você poder estudar o estado passo a passo.
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
}

function getTypeLabel(val) {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (Array.isArray(val)) return `array[${val.length}]`;
  if (typeof val === 'object') {
    if (val.__isMap) return 'Map';
    if (val.__isSet) return 'Set';
    return 'object';
  }
  return typeof val;
}
