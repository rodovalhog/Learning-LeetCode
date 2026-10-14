import * as parser from '@babel/parser';
import _traverse from '@babel/traverse';

const traverse = _traverse.default || _traverse;

/**
 * Categorias de complexidade para estilização e avaliação
 */
export const COMPLEXITY_RATINGS = {
  'O(1)': { level: 'great', label: 'Excelente', color: '#10b981', rank: 1 },
  'O(log n)': { level: 'great', label: 'Excelente', color: '#10b981', rank: 2 },
  'O(n)': { level: 'good', label: 'Ótimo', color: '#3b82f6', rank: 3 },
  'O(n log n)': { level: 'fair', label: 'Bom / Aceitável', color: '#f59e0b', rank: 4 },
  'O(n²)': { level: 'poor', label: 'Moderado / Ruim', color: '#f97316', rank: 5 },
  'O(n³)': { level: 'bad', label: 'Crítico', color: '#ef4444', rank: 6 },
  'O(2ⁿ)': { level: 'bad', label: 'Exponencial', color: '#ef4444', rank: 7 },
  'O(n!)': { level: 'bad', label: 'Inviável', color: '#dc2626', rank: 8 }
};

/**
 * Normaliza notação Big-O para comparação
 */
function normalizeBigO(str) {
  if (!str) return '';
  return str.replace(/\s+/g, '').replace('^2', '²').replace('^3', '³');
}

/**
 * Analisa o código JavaScript para estimar a complexidade de Tempo e Espaço.
 * 
 * @param {string} code Código JavaScript no editor
 * @param {object} [problemMeta] Metadados opcionais do problema atual
 * @returns {object} Resultado completo da análise
 */
export function analyzeComplexity(code, problemMeta = null) {
  if (!code || typeof code !== 'string' || code.trim() === '') {
    return {
      success: false,
      time: 'O(1)',
      space: 'O(1)',
      timeRating: COMPLEXITY_RATINGS['O(1)'],
      spaceRating: COMPLEXITY_RATINGS['O(1)'],
      summary: 'Aguardando código...',
      details: [],
      isOptimal: null
    };
  }

  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx']
    });

    let maxLoopNesting = 0;
    let currentLoopNesting = 0;
    let totalLoopsCount = 0;
    const detectedLoops = [];

    let hasLogarithmicLoop = false;
    let hasSortCall = false;
    let hasLinearMethodInsideLoop = false;
    let linearMethodName = '';

    // Rastreamento de funções e recursão
    const functionsMap = new Map();
    let currentFunctionNode = null;

    // Rastreamento de alocação de espaço
    let hasMapOrSet = false;
    let hasDynamicArray = false;
    let dynamicAllocReason = '';
    const allocReasons = [];

    traverse(ast, {
      // Identifica funções para verificar chamadas recursivas
      Function(path) {
        const fnName = path.node.id ? path.node.id.name : null;
        if (fnName) {
          functionsMap.set(fnName, {
            name: fnName,
            recursiveCalls: 0,
            hasMemoization: false
          });
        }
      },

      FunctionDeclaration: {
        enter(path) {
          if (path.node.id) {
            currentFunctionNode = path.node.id.name;
          }
        },
        exit(path) {
          if (currentFunctionNode === (path.node.id ? path.node.id.name : null)) {
            currentFunctionNode = null;
          }
        }
      },

      // Detecta chamadas de métodos e recursão
      CallExpression(path) {
        const callee = path.node.callee;

        // Chamada direta de função (ex: recursão fn(n-1))
        if (callee.type === 'Identifier') {
          const calledName = callee.name;
          if (currentFunctionNode && calledName === currentFunctionNode) {
            const fnData = functionsMap.get(currentFunctionNode);
            if (fnData) {
              fnData.recursiveCalls++;
            }
          }
        }

        // Chamada de métodos de array: arr.sort(), arr.includes(), etc.
        if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
          const methodName = callee.property.name;

          if (methodName === 'sort') {
            hasSortCall = true;
          }

          // Métodos que têm custo O(n) por si só
          if (['includes', 'indexOf', 'lastIndexOf', 'filter', 'map', 'reduce', 'some', 'every', 'find', 'findIndex'].includes(methodName)) {
            if (currentLoopNesting > 0) {
              hasLinearMethodInsideLoop = true;
              linearMethodName = methodName;
            }
          }

          // Métodos que alocam novo array
          if (['map', 'filter', 'slice', 'concat', 'split'].includes(methodName)) {
            hasDynamicArray = true;
            if (!allocReasons.includes(`.${methodName}()`)) {
              allocReasons.push(`.${methodName}()`);
            }
          }
        }
      },

      // Detecta estruturas de repetição (loops)
      'ForStatement|WhileStatement|DoWhileStatement|ForOfStatement|ForInStatement': {
        enter(path) {
          currentLoopNesting++;
          totalLoopsCount++;

          if (currentLoopNesting > maxLoopNesting) {
            maxLoopNesting = currentLoopNesting;
          }

          const loopType = path.node.type.replace('Statement', '');
          const startLine = path.node.loc ? path.node.loc.start.line : 1;

          // Inspeciona se o loop divide o espaço pela metade (busca binária)
          const loopSnippet = code.slice(path.node.start, path.node.end);
          if (
            loopSnippet.includes('/ 2') ||
            loopSnippet.includes('>> 1') ||
            loopSnippet.includes('mid') ||
            loopSnippet.includes('Math.floor') ||
            loopSnippet.includes('/= 2') ||
            loopSnippet.includes('*= 2')
          ) {
            hasLogarithmicLoop = true;
          }

          detectedLoops.push({
            type: loopType,
            line: startLine,
            nesting: currentLoopNesting
          });
        },
        exit() {
          currentLoopNesting--;
        }
      },

      // Detecta alocações de memória: new Set, new Map, new Array
      NewExpression(path) {
        if (path.node.callee.type === 'Identifier') {
          const name = path.node.callee.name;
          if (name === 'Set' || name === 'Map') {
            hasMapOrSet = true;
            if (!allocReasons.includes(`new ${name}()`)) {
              allocReasons.push(`new ${name}()`);
            }
          } else if (name === 'Array') {
            hasDynamicArray = true;
            if (!allocReasons.includes('new Array()')) {
              allocReasons.push('new Array()');
            }
          }
        }
      },

      // Detecta spread operator em arrays: [...arr]
      ArrayExpression(path) {
        const hasSpread = path.node.elements.some(el => el && el.type === 'SpreadElement');
        if (hasSpread) {
          hasDynamicArray = true;
          if (!allocReasons.includes('Spread [...arr]')) {
            allocReasons.push('Spread [...arr]');
          }
        }
      }
    });

    // ----------------------------------------------------
    // Avaliação de Recursão
    // ----------------------------------------------------
    let hasBinaryRecursion = false;
    let hasLinearRecursion = false;
    for (const [_, data] of functionsMap.entries()) {
      if (data.recursiveCalls >= 2) {
        hasBinaryRecursion = true;
      } else if (data.recursiveCalls === 1) {
        hasLinearRecursion = true;
      }
    }

    // ----------------------------------------------------
    // Cálculo da Complexidade de TEMPO
    // ----------------------------------------------------
    let timeKey = 'O(1)';
    let timeDesc = 'Execução em tempo constante.';
    const details = [];

    if (hasBinaryRecursion && maxLoopNesting === 0) {
      timeKey = 'O(2ⁿ)';
      timeDesc = 'Recursão múltipla sem memorização detectada (árvore binária de chamadas).';
      details.push('Função se chama múltiplas vezes por nível de profundidade.');
    } else if (hasSortCall && maxLoopNesting === 0) {
      timeKey = 'O(n log n)';
      timeDesc = 'Utiliza ordenação nativa (.sort()), que opera em tempo linearítmico.';
      details.push('Chamada de Array.prototype.sort() no algoritmo.');
    } else if (hasSortCall && maxLoopNesting >= 1) {
      timeKey = 'O(n² log n)';
      timeDesc = 'Ordenação executada dentro de um loop de repetição.';
      details.push('Chamada a .sort() aninhada em loop.');
    } else if (maxLoopNesting === 0) {
      if (hasLinearRecursion) {
        timeKey = 'O(n)';
        timeDesc = 'Recursão linear (cada chamada resolve 1 elemento até a base).';
        details.push('Pilha recursiva simples de 1 chamada por passo.');
      } else {
        timeKey = 'O(1)';
        timeDesc = 'Nenhum loop ou recursão proporcional à entrada encontrado.';
        details.push('Apenas operações aritméticas, atribuições e acessos diretos.');
      }
    } else if (maxLoopNesting === 1) {
      if (hasLogarithmicLoop) {
        timeKey = 'O(log n)';
        timeDesc = 'O loop divide o espaço de busca pela metade a cada passo (estilo Busca Binária).';
        details.push('Atualização de índices centrais (mid) detectada no loop.');
      } else if (hasLinearMethodInsideLoop) {
        timeKey = 'O(n²)';
        timeDesc = `Loop linear combinado com método auxiliar .${linearMethodName}() que também percorre a coleção.`;
        details.push(`Método .${linearMethodName}() dentro de loop for/while gera complexidade quadrática.`);
      } else {
        timeKey = 'O(n)';
        timeDesc = `Possui 1 loop iterando linearmente sobre os elementos.`;
        details.push(`${totalLoopsCount} loop(s) linear(es) sequenciais detectado(s).`);
      }
    } else if (maxLoopNesting === 2) {
      if (hasLogarithmicLoop) {
        timeKey = 'O(n log n)';
        timeDesc = 'Loop externo linear combinado com divisão logarítmica interna.';
      } else {
        timeKey = 'O(n²)';
        timeDesc = 'Possui 2 loops aninhados (loop dentro de loop).';
        details.push('Dois níveis de aninhamento percorrendo pares de elementos.');
      }
    } else if (maxLoopNesting === 3) {
      timeKey = 'O(n³)';
      timeDesc = 'Possui 3 níveis de loops aninhados (complexidade cúbica).';
      details.push('Três níveis de aninhamento de repetição.');
    } else {
      timeKey = `O(n^${maxLoopNesting})`;
      timeDesc = `${maxLoopNesting} loops profundamente aninhados.`;
    }

    // ----------------------------------------------------
    // Cálculo da Complexidade de ESPAÇO
    // ----------------------------------------------------
    let spaceKey = 'O(1)';
    let spaceDesc = 'Uso de memória constante (in-place).';

    if (hasMapOrSet || hasDynamicArray) {
      spaceKey = 'O(n)';
      const reasonsStr = allocReasons.join(', ');
      spaceDesc = `Aloca coleções dinâmicas auxiliares (${reasonsStr}).`;
      details.push(`Alocação de memória proporcional à entrada: ${reasonsStr}.`);
    } else if (hasBinaryRecursion || hasLinearRecursion) {
      spaceKey = 'O(n)';
      spaceDesc = 'Pilha de execução (Call Stack) acumula chamadas proporcionais a N.';
      details.push('Memória alocada na pilha de recursão.');
    } else {
      spaceKey = 'O(1)';
      spaceDesc = 'Apenas variáveis locais primitivas e ponteiros (in-place).';
      details.push('Nenhuma estrutura de dados auxiliar de tamanho variável criada.');
    }

    // ----------------------------------------------------
    // Comparação com o Ótimo do Problema (se disponível)
    // ----------------------------------------------------
    let isOptimal = null;
    let comparisonNote = '';

    if (problemMeta && (problemMeta.expectedTime || problemMeta.timeComplexity)) {
      const optimalTime = normalizeBigO(problemMeta.expectedTime || problemMeta.timeComplexity);
      const currentTimeNorm = normalizeBigO(timeKey);
      const currentRank = (COMPLEXITY_RATINGS[timeKey] || { rank: 99 }).rank;
      const targetRank = (COMPLEXITY_RATINGS[optimalTime] || { rank: 3 }).rank;

      if (currentRank <= targetRank) {
        isOptimal = true;
        comparisonNote = `Solução atingiu a complexidade de tempo ótima (${optimalTime})!`;
      } else {
        isOptimal = false;
        comparisonNote = `Pode ser otimizado para ${optimalTime}.`;
      }
    }

    const timeRating = COMPLEXITY_RATINGS[timeKey] || { level: 'fair', label: 'Estimado', color: '#38bdf8' };
    const spaceRating = COMPLEXITY_RATINGS[spaceKey] || { level: 'good', label: 'Estimado', color: '#10b981' };

    return {
      success: true,
      time: timeKey,
      space: spaceKey,
      timeRating,
      spaceRating,
      timeDesc,
      spaceDesc,
      details,
      isOptimal,
      comparisonNote,
      maxLoopNesting,
      totalLoopsCount
    };

  } catch (err) {
    return {
      success: false,
      time: '—',
      space: '—',
      timeRating: { level: 'slate', label: 'Em edição', color: '#64748b' },
      spaceRating: { level: 'slate', label: 'Em edição', color: '#64748b' },
      timeDesc: 'Aguardando sintaxe válida...',
      spaceDesc: '',
      details: [],
      isOptimal: null
    };
  }
}
