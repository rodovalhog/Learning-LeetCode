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

/**
 * Generates an educational, contextual explanation for what happened in a given step
 */
export function generateStepExplanation(step, prevStep, stepIndex, totalSteps) {
  const { type, desc, line, variables, changedVars, arrays, maps, pointers, returnValue, isReturn } = step;

  // 1. Retorno / Solução Encontrada
  if (isReturn || type === 'return' || returnValue !== undefined) {
    if (typeof returnValue === 'number') {
      return {
        title: `🎯 Solução encontrada! Retornou o valor ${returnValue}`,
        detail: `Na <strong>Linha ${line}</strong>, o algoritmo concluiu a busca com sucesso. O valor encontrado foi <strong>${returnValue}</strong>.`
      };
    }
    if (Array.isArray(returnValue)) {
      return {
        title: `🎯 Par / Índices encontrados! Retornou [${returnValue.join(', ')}]`,
        detail: `Na <strong>Linha ${line}</strong>, a condição de busca foi satisfeita. Os índices encontrados <strong>[${returnValue.join(', ')}]</strong> foram retornados como a resposta final.`
      };
    }
    return {
      title: `🎯 Finalizou a execução e retornou ${formatValue(returnValue)}`,
      detail: `Na <strong>Linha ${line}</strong>, a instrução de retorno foi alcançada e produziu o resultado <strong>${formatValue(returnValue)}</strong>.`
    };
  }

  // 2. Invocação da Função
  if (type === 'func_enter') {
    const paramKeys = Object.keys(variables || {});
    return {
      title: `Início da execução: Função invocada`,
      detail: `A função foi chamada com os parâmetros: ${paramKeys.map(k => `<code>${k} = ${formatValue(variables[k])}</code>`).join(', ')}. Os dados foram inicializados na memória.`
    };
  }

  // 3. Operação no Map / Set
  if (desc && desc.includes('map.set')) {
    const mapObj = maps?.find(m => m.name === 'map') || maps?.[0];
    const entries = mapObj?.data?.entries || [];
    const lastEntry = entries[entries.length - 1];
    if (lastEntry) {
      return {
        title: `Guardou no Map: chave ${formatValue(lastEntry[0])} ➔ índice ${formatValue(lastEntry[1])}`,
        detail: `Na <strong>Linha ${line}</strong>, como o complemento ainda não havia sido registrado, o número <strong>${formatValue(lastEntry[0])}</strong> foi salvo no Map com seu índice <strong>${formatValue(lastEntry[1])}</strong> para permitir buscas instantâneas O(1).`
      };
    }
    return {
      title: `Armazenou par chave/índice no Map`,
      detail: `Na <strong>Linha ${line}</strong>, executou <code>map.set()</code> para registrar o valor e seu índice na tabela hash.`
    };
  }

  // 4. Declaração ou cálculo de diff
  if (changedVars && changedVars.includes('diff') && variables?.diff !== undefined) {
    const currentI = variables.i ?? 0;
    const currentVal = arrays?.[0]?.data?.[currentI];
    return {
      title: `Calculou a diferença necessária: diff = ${variables.diff}`,
      detail: `Na <strong>Linha ${line}</strong>, calculou o complemento necessário para o alvo: <code>target (${variables.target}) - atual (${currentVal !== undefined ? currentVal : 'nums[' + currentI + ']'}) = diff (${variables.diff})</code>. Em seguida, verificará se <strong>${variables.diff}</strong> já está salvo no Map.`
    };
  }

  // 5. Cálculo de mid (Busca Binária)
  if (changedVars && changedVars.includes('mid') && variables?.mid !== undefined) {
    const midVal = arrays?.[0]?.data?.[variables.mid];
    return {
      title: `Calculou o ponto médio: mid = ${variables.mid}`,
      detail: `Na <strong>Linha ${line}</strong>, dividiu o espaço de busca: <code>mid = Math.floor((${variables.low} + ${variables.high}) / 2) = ${variables.mid}</code>. O valor na posição central é <strong>${midVal !== undefined ? midVal : ''}</strong>.`
    };
  }

  // 6. Atualização de ponteiros de busca binária
  if (changedVars && changedVars.includes('low') && prevStep) {
    return {
      title: `Avançou o ponteiro low para ${variables.low}`,
      detail: `Na <strong>Linha ${line}</strong>, como o valor central era menor que o alvo, a metade esquerda foi descartada e o novo início de busca é o índice <strong>${variables.low}</strong>.`
    };
  }
  if (changedVars && changedVars.includes('high') && prevStep) {
    return {
      title: `Recuou o ponteiro high para ${variables.high}`,
      detail: `Na <strong>Linha ${line}</strong>, como o valor central era maior que o alvo, a metade direita foi descartada e o novo fim de busca é o índice <strong>${variables.high}</strong>.`
    };
  }

  // 7. Ponteiros de dois ponteiros (left e right)
  if (changedVars && (changedVars.includes('left') || changedVars.includes('right'))) {
    return {
      title: `Moveu ponteiros: left = ${variables.left}, right = ${variables.right}`,
      detail: `Na <strong>Linha ${line}</strong>, os ponteiros foram atualizados para aproximar a análise dos elementos em direção ao centro.`
    };
  }

  // 8. Iteração de Loop
  if (type === 'loop') {
    if (variables?.i !== undefined) {
      const currVal = arrays?.[0]?.data?.[variables.i];
      return {
        title: `Iteração do loop: índice i = ${variables.i}`,
        detail: `Na <strong>Linha ${line}</strong>, iniciou a iteração no índice <strong>${variables.i}</strong>${currVal !== undefined ? ` (elemento atual: <code>${formatValue(currVal)}</code>)` : ''}.`
      };
    }
    if (variables?.low !== undefined && variables?.high !== undefined) {
      return {
        title: `Iteração do loop: intervalo [${variables.low} ... ${variables.high}]`,
        detail: `Na <strong>Linha ${line}</strong>, verificou a condição <code>low (${variables.low}) <= high (${variables.high})</code> e continuou a busca.`
      };
    }
    return {
      title: `Iteração de laço de repetição`,
      detail: `Na <strong>Linha ${line}</strong>, iniciou uma nova repetição do loop.`
    };
  }

  // 9. Declaração de Coleção Map / Set
  if (type === 'decl' && (changedVars.includes('map') || changedVars.includes('set'))) {
    return {
      title: `Criou a coleção hash (${changedVars.includes('map') ? 'Map' : 'Set'})`,
      detail: `Na <strong>Linha ${line}</strong>, inicializou a estrutura de dados vazia para armazenar e consultar valores em complexidade O(1).`
    };
  }

  // 10. Declaração genérica
  if (type === 'decl') {
    const varsDesc = (changedVars || []).map(v => `<code>${v} = ${formatValue(variables[v])}</code>`).join(', ');
    return {
      title: `Declarou variável(is): ${(changedVars || []).join(', ')}`,
      detail: `Na <strong>Linha ${line}</strong>, alocou e inicializou as variáveis: ${varsDesc || desc}.`
    };
  }

  // 11. Expressão genérica
  return {
    title: desc || `Executou instrução`,
    detail: `Na <strong>Linha ${line}</strong>: ${desc}.`
  };
}

function renderSnapshotArrays(arrays, pointers, foundIndices) {
  if (!arrays || arrays.length === 0) return '';

  return `
    <div class="snapshot-section">
      <div class="snapshot-section-title">
        <span>Arrays & Ponteiros</span>
      </div>
      <div class="snapshot-arrays-row">
        ${arrays.map(arr => {
          const arrPointers = (pointers || []).filter(p => p.arrayName === arr.name);
          return `
            <div class="snapshot-array-mini">
              <div class="snapshot-array-header">
                <span class="array-name">${escapeHtml(arr.name)}</span>
                <span class="array-len">[len: ${arr.data.length}]</span>
              </div>
              <div class="snapshot-array-track">
                <div class="array-cells-row">
                  ${arr.data.map((val, idx) => {
                    const cellPointers = arrPointers.filter(p => p.index === idx);
                    const isPointed = cellPointers.length > 0;
                    const isFound = foundIndices.has(idx);

                    return `
                      <div class="array-cell-wrapper">
                        <div class="pointer-zone">
                          ${isFound ? `
                            <div class="pointer-badge badge-found" style="font-size: 0.6rem; padding: 1px 4px;">
                              <span>🎯 Alvo</span>
                            </div>
                          ` : ''}
                          ${cellPointers.map(p => {
                            const style = getPointerStyle(p.varName);
                            return `
                              <div class="pointer-badge" style="background: ${style.bg}; color: ${style.text}; font-size: 0.62rem; padding: 1px 4px;">
                                <span>${escapeHtml(p.varName)}</span>
                              </div>
                            `;
                          }).join('')}
                        </div>
                        <div class="array-cell-box ${isPointed ? 'cell-pointed' : ''} ${isFound ? 'cell-found' : ''}" style="width: 44px; height: 44px; font-size: 0.85rem;">
                          <span>${formatValue(val)}</span>
                        </div>
                        <span class="cell-index">[${idx}]</span>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderSnapshotMaps(maps, variables) {
  if (!maps || maps.length === 0) return '';

  return `
    <div class="snapshot-section">
      <div class="snapshot-section-title">
        <span>Coleções Hash (${maps.map(m => m.name).join(', ')})</span>
      </div>
      <div class="snapshot-maps-grid">
        ${maps.map(m => {
          if (m.type === 'Map') {
            const entries = m.data?.entries || [];
            if (entries.length === 0) {
              return `<div class="map-card"><div class="map-card-header"><span class="map-name">${escapeHtml(m.name)}</span></div><div class="map-empty">Map vazio { }</div></div>`;
            }
            return `
              <div class="map-card">
                <div class="map-card-header">
                  <span class="map-name">${escapeHtml(m.name)}</span>
                  <span class="map-type-badge">${entries.length} entrada(s)</span>
                </div>
                <div class="map-entries-grid">
                  ${entries.map(([k, v]) => {
                    const isMatched = (variables?.diff !== undefined && k === variables.diff) ||
                                      (variables?.target !== undefined && k === variables.target);
                    return `
                      <div class="map-entry-chip ${isMatched ? 'map-entry-matched' : ''}">
                        <span class="map-key">${formatValue(k)}</span>
                        <span class="map-arrow">➔</span>
                        <span class="map-val">${formatValue(v)}</span>
                        ${isMatched ? '<span class="map-matched-tag">✓ Par achado</span>' : ''}
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          } else {
            const values = m.data?.values || [];
            return `
              <div class="map-card">
                <div class="map-card-header"><span class="map-name">${escapeHtml(m.name)}</span></div>
                <div class="set-values-row">
                  ${values.map(v => `<span class="set-value-pill">${formatValue(v)}</span>`).join('')}
                </div>
              </div>
            `;
          }
        }).join('')}
      </div>
    </div>
  `;
}

function renderSnapshotVariables(variables, changedVars, pointers) {
  const keys = Object.keys(variables || {});
  if (keys.length === 0) return '';

  return `
    <div class="snapshot-section">
      <div class="snapshot-section-title">
        <span>Variáveis no Escopo (${keys.length})</span>
      </div>
      <div class="snapshot-vars-grid">
        ${keys.map(k => {
          const v = variables[k];
          const isChanged = (changedVars || []).includes(k);
          const isPtr = (pointers || []).some(p => p.varName === k);

          return `
            <div class="var-card ${isChanged ? 'var-card-changed' : ''}" style="padding: 0.45rem 0.6rem;">
              <div class="var-card-top">
                <span class="var-name">${escapeHtml(k)}</span>
                <div class="var-tags">
                  ${isPtr ? '<span class="var-tag ptr-tag">ponteiro</span>' : ''}
                  <span class="var-tag type-tag">${getTypeLabel(v)}</span>
                </div>
              </div>
              <div class="var-val-display" style="font-size: 0.8rem;">${formatValue(v)}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
/**
 * Helper to strip HTML tags for clean plain-text suggestions
 */
function stripHtml(html) {
  return String(html)
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

/**
 * Loads user notes from localStorage for a specific problem
 */
export function getSavedNotes(problemId = 'default') {
  try {
    const raw = localStorage.getItem(`leetcode_notes_${problemId}`);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Saves a user note to localStorage for a specific problem and step index
 */
export function saveUserNote(problemId = 'default', stepIndex, text) {
  try {
    const notes = getSavedNotes(problemId);
    if (!text || text.trim() === '') {
      delete notes[stepIndex];
    } else {
      notes[stepIndex] = text.trim();
    }
    localStorage.setItem(`leetcode_notes_${problemId}`, JSON.stringify(notes));
    return notes;
  } catch (e) {
    return {};
  }
}

/**
 * Main Snapshots Accordion Renderer
 */
export function renderSnapshotsAccordion(container, steps, activeStepIndex = 0, onSelectStep = null, problemId = 'default', onHoverStep = null) {
  if (!container) return;

  if (!steps || steps.length === 0) {
    container.innerHTML = `
      <div class="visualizer-empty">
        <p>Aguardando execução do código para gerar snapshots...</p>
      </div>
    `;
    return;
  }

  const userNotes = getSavedNotes(problemId);
  let html = '<div class="snapshots-accordion-list">';

  steps.forEach((step, idx) => {
    const prevStep = idx > 0 ? steps[idx - 1] : null;
    const explanation = generateStepExplanation(step, prevStep, idx, steps.length);
    const isActive = idx === activeStepIndex;
    const isReturn = step.isReturn || step.type === 'return' || step.returnValue !== undefined;
    const userNote = userNotes[idx] || '';

    const badgeMap = {
      func_enter: { label: 'Início', cls: 'badge-indigo' },
      decl: { label: 'Declaração', cls: 'badge-emerald' },
      expr: { label: 'Operação', cls: 'badge-cyan' },
      loop: { label: 'Iteração', cls: 'badge-amber' },
      return: { label: '🎯 Solução', cls: 'badge-success-glow' },
      idle: { label: 'Pronto', cls: 'badge-slate' }
    };
    const badgeInfo = badgeMap[step.type] || { label: 'Instrução', cls: 'badge-slate' };

    const foundIndices = new Set();
    if (isReturn && step.returnValue !== undefined) {
      if (typeof step.returnValue === 'number' && Number.isInteger(step.returnValue)) {
        foundIndices.add(step.returnValue);
      } else if (Array.isArray(step.returnValue)) {
        step.returnValue.forEach(v => {
          if (typeof v === 'number' && Number.isInteger(v)) foundIndices.add(v);
        });
      }
    }

    // Por padrão, se houver até 12 passos, mantém abertos; se houver muitos, abre apenas os primeiros e o ativo/retorno
    const isInitiallyCollapsed = steps.length > 8 && !isActive && !isReturn && idx > 2;

    html += `
      <div class="snapshot-card ${isActive ? 'active-snapshot' : ''} ${isReturn ? 'snapshot-return-card' : ''} ${isInitiallyCollapsed ? 'collapsed' : ''}" data-step-index="${idx}" data-line="${step.line || 1}">
        <!-- Accordion Header -->
        <div class="snapshot-header" data-toggle-index="${idx}">
          <div class="snapshot-header-left">
            <span class="snapshot-step-pill">Etapa ${idx + 1}</span>
            <span class="badge ${badgeInfo.cls}">${badgeInfo.label}</span>
            <span class="badge-line">Linha ${step.line}</span>
            <h4 class="snapshot-title-text">${escapeHtml(stripHtml(explanation.title))}</h4>
            <div class="snapshot-user-note-badge" id="header-note-badge-${idx}" style="${userNote ? '' : 'display: none;'}" title="${escapeHtml(userNote)}">
              <span class="note-icon">💬</span>
              <span class="note-preview-text" id="header-note-text-${idx}">${escapeHtml(userNote)}</span>
            </div>
          </div>
          <div class="snapshot-header-right">
            <button class="btn-jump-step" data-jump-index="${idx}" title="Abrir esta etapa no player dinâmico">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span>Ver no Player</span>
            </button>
            <span class="snapshot-chevron-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </div>
        </div>

        <!-- Accordion Body (Colapsável) -->
        <div class="snapshot-body-wrapper">
          <div class="snapshot-body-content">
            <!-- Mini Arrays with Pointers -->
            ${renderSnapshotArrays(step.arrays, step.pointers, foundIndices)}

            <!-- Mini Maps / Sets -->
            ${renderSnapshotMaps(step.maps, step.variables)}

            <!-- Mini Scope Variables -->
            ${renderSnapshotVariables(step.variables, step.changedVars, step.pointers)}

            <!-- Pedagogical Explanation -->
            <div class="snapshot-explanation-card">
              <div class="snapshot-explanation-icon">💡</div>
              <div class="snapshot-explanation-text">${explanation.detail}</div>
            </div>

            <!-- Input para o Usuário Escrever a Explicação da Etapa -->
            <div class="snapshot-user-note-card" data-step-index="${idx}">
              <div class="snapshot-user-note-header">
                <label class="snapshot-user-note-label" for="user-step-note-${idx}">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                  <span>Sua Explicação / Anotação desta Etapa:</span>
                </label>
                <div class="snapshot-user-note-actions">
                  <button type="button" class="btn-copy-suggestion" data-step-index="${idx}" data-suggest="${escapeHtml(stripHtml(explanation.detail))}" title="Preencher com sugestão automática">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <span>Usar Sugestão</span>
                  </button>
                  <span class="note-save-status" id="save-status-${idx}">${userNote ? '✓ Salvo' : ''}</span>
                </div>
              </div>
              <div class="snapshot-user-note-input-wrapper">
                <textarea
                  id="user-step-note-${idx}"
                  class="snapshot-user-note-textarea"
                  data-step-index="${idx}"
                  placeholder="Escreva sua explicação aqui... Ex: Explicação: nesse momento foi criado um hashTable para alocar valores na memoria"
                  rows="2"
                >${escapeHtml(userNote)}</textarea>
              </div>
            </div>

            <!-- Return Highlight (se for o retorno) -->
            ${isReturn && step.returnValue !== undefined ? `
              <div class="snapshot-return-badge-card">
                <div class="return-header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span>Resultado retornado pelo algoritmo nesta etapa:</span>
                </div>
                <div class="return-value-display">${formatValue(step.returnValue)}</div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;

  // Listeners para colapsar/expandir ao clicar no cabeçalho
  container.querySelectorAll('.snapshot-header').forEach(header => {
    header.addEventListener('click', (e) => {
      if (e.target.closest('.btn-jump-step') || e.target.closest('input') || e.target.closest('textarea') || e.target.closest('button')) return;
      const card = header.closest('.snapshot-card');
      card.classList.toggle('collapsed');
    });
  });

  // Listeners para pular diretamente para a etapa no player
  container.querySelectorAll('.btn-jump-step').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const stepIdx = parseInt(btn.dataset.jumpIndex, 10);
      if (onSelectStep) {
        onSelectStep(stepIdx);
      }
    });
  });

  // Listeners para os textareas de anotação do usuário
  container.querySelectorAll('.snapshot-user-note-textarea').forEach(textarea => {
    const stepIdx = parseInt(textarea.dataset.stepIndex, 10);
    const saveStatus = container.querySelector(`#save-status-${stepIdx}`);
    const headerBadge = container.querySelector(`#header-note-badge-${stepIdx}`);
    const headerText = container.querySelector(`#header-note-text-${stepIdx}`);

    textarea.addEventListener('click', (e) => e.stopPropagation());
    textarea.addEventListener('keydown', (e) => e.stopPropagation());

    textarea.addEventListener('input', () => {
      const val = textarea.value;
      if (saveStatus) saveStatus.textContent = 'Salvando...';

      saveUserNote(problemId, stepIdx, val);

      if (saveStatus) {
        setTimeout(() => {
          saveStatus.textContent = val.trim() ? '✓ Salvo' : '';
        }, 300);
      }

      // Atualiza badge de preview no cabeçalho
      if (headerBadge && headerText) {
        if (val.trim()) {
          headerText.textContent = val.trim();
          headerBadge.title = val.trim();
          headerBadge.style.display = 'inline-flex';
        } else {
          headerBadge.style.display = 'none';
        }
      }
    });
  });

  // Listeners para o botão "Usar Sugestão"
  container.querySelectorAll('.btn-copy-suggestion').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const stepIdx = parseInt(btn.dataset.stepIndex, 10);
      const suggest = btn.dataset.suggest || '';
      const textarea = container.querySelector(`#user-step-note-${stepIdx}`);
      if (textarea) {
        textarea.value = `Explicação: ${suggest}`;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.focus();
      }
    });
  });

  // Listeners para hover nos cartões de snapshot para destacar a linha correspondente no editor
  container.querySelectorAll('.snapshot-card').forEach(card => {
    const idx = parseInt(card.dataset.stepIndex, 10);
    const line = parseInt(card.dataset.line, 10);

    const triggerHover = () => {
      if (onHoverStep && line) {
        onHoverStep(idx, line);
      }
    };

    card.addEventListener('mouseenter', triggerHover);
    card.addEventListener('pointerenter', triggerHover);
  });
}

