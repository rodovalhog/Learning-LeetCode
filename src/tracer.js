import * as parser from '@babel/parser';
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';
import * as t from '@babel/types';

const traverse = _traverse.default || _traverse;
const generate = _generate.default || _generate;

const MAX_STEPS = 1500;

/**
 * Safely deep clones values, converting Sets and Maps to inspectable formats
 */
export function cloneValue(val, depth = 0, seen = new WeakSet()) {
  if (depth > 6) return '[Profundidade Máxima]';
  if (val === null || val === undefined) return val;
  if (typeof val === 'number' || typeof val === 'string' || typeof val === 'boolean') return val;
  if (typeof val === 'symbol') return val.toString();
  if (typeof val === 'function') return `[Function: ${val.name || 'anônima'}]`;
  if (typeof val === 'bigint') return `${val}n`;

  if (typeof val === 'object') {
    if (seen.has(val)) return '[Circular]';
    seen.add(val);

    if (val instanceof Map) {
      return {
        __isMap: true,
        entries: Array.from(val.entries()).map(([k, v]) => [
          cloneValue(k, depth + 1, seen),
          cloneValue(v, depth + 1, seen)
        ])
      };
    }

    if (val instanceof Set) {
      return {
        __isSet: true,
        values: Array.from(val.values()).map(v => cloneValue(v, depth + 1, seen))
      };
    }

    if (Array.isArray(val)) {
      return val.map(item => cloneValue(item, depth + 1, seen));
    }

    const copy = {};
    for (const key of Object.keys(val)) {
      try {
        copy[key] = cloneValue(val[key], depth + 1, seen);
      } catch (e) {
        copy[key] = '[Inacessível]';
      }
    }
    return copy;
  }

  return String(val);
}

/**
 * Scans AST scope upward to collect identifiers that have been declared prior to the given statement
 */
function getSafeScopeVars(path) {
  const vars = new Set();
  let curr = path;

  while (curr) {
    if (curr.isFunction()) {
      curr.node.params.forEach(p => {
        if (t.isIdentifier(p)) vars.add(p.name);
        else if (t.isAssignmentPattern(p) && t.isIdentifier(p.left)) vars.add(p.left.name);
      });
    }

    if (curr.isBlockStatement() || curr.isProgram()) {
      const body = curr.node.body;
      const targetIndex = body.findIndex(stmt => stmt === path.node || (path.findParent(p => p.node === stmt)));
      const limit = targetIndex >= 0 ? targetIndex : body.length;

      for (let i = 0; i < limit; i++) {
        const stmt = body[i];
        if (t.isVariableDeclaration(stmt)) {
          stmt.declarations.forEach(d => {
            if (t.isIdentifier(d.id)) vars.add(d.id.name);
          });
        }
      }
    }

    if (curr.isForStatement()) {
      if (t.isVariableDeclaration(curr.node.init)) {
        curr.node.init.declarations.forEach(d => {
          if (t.isIdentifier(d.id)) vars.add(d.id.name);
        });
      }
    }

    if (curr.isForOfStatement() || curr.isForInStatement()) {
      if (t.isVariableDeclaration(curr.node.left)) {
        curr.node.left.declarations.forEach(d => {
          if (t.isIdentifier(d.id)) vars.add(d.id.name);
        });
      }
    }

    curr = curr.parentPath;
  }

  return Array.from(vars);
}

function makeTraceStatement(line, col, type, desc, varNames) {
  const props = varNames.map(name => t.objectProperty(t.identifier(name), t.identifier(name), false, true));
  return t.expressionStatement(
    t.callExpression(t.memberExpression(t.identifier('__tracer'), t.identifier('record')), [
      t.numericLiteral(line),
      t.numericLiteral(col),
      t.stringLiteral(type),
      t.stringLiteral(desc),
      t.objectExpression(props)
    ])
  );
}

/**
 * Instruments user code to inject tracer hooks
 */
export function instrumentCode(code) {
  const ast = parser.parse(code, {
    sourceType: 'module',
    allowReturnOutsideFunction: true,
    plugins: ['jsx']
  });

  traverse(ast, {
    // Normaliza corpos de loops e condicionais para BlockStatement
    'ForStatement|WhileStatement|DoWhileStatement|ForOfStatement|ForInStatement'(path) {
      if (!t.isBlockStatement(path.node.body)) {
        path.node.body = t.blockStatement([path.node.body]);
      }
      const line = path.node.loc ? path.node.loc.start.line : 1;
      const col = path.node.loc ? path.node.loc.start.column : 0;
      const vars = getSafeScopeVars(path);
      path.get('body').unshiftContainer('body', makeTraceStatement(line, col, 'loop', 'Iteração de loop', vars));
    },

    FunctionDeclaration(path) {
      if (!t.isBlockStatement(path.node.body)) {
        path.node.body = t.blockStatement([path.node.body]);
      }
      const line = path.node.loc ? path.node.loc.start.line : 1;
      const col = path.node.loc ? path.node.loc.start.column : 0;
      const fnName = path.node.id ? path.node.id.name : 'função';
      const vars = getSafeScopeVars(path);
      path.get('body').unshiftContainer(
        'body',
        makeTraceStatement(line, col, 'func_enter', `Entrou na função ${fnName}()`, vars)
      );
    },

    VariableDeclaration(path) {
      if (path.node._synthetic || path.node.declarations.some(d => d.id?.name?.startsWith('_ret'))) return;
      if (path.parentPath.isForStatement() || path.parentPath.isForOfStatement() || path.parentPath.isForInStatement()) return;
      const line = path.node.loc ? path.node.loc.start.line : 1;
      const col = path.node.loc ? path.node.loc.start.column : 0;
      const names = [];
      path.node.declarations.forEach(d => {
        if (t.isIdentifier(d.id)) names.push(d.id.name);
      });
      const vars = Array.from(new Set(getSafeScopeVars(path).concat(names)));
      path.insertAfter(makeTraceStatement(line, col, 'decl', `Declarou ${names.join(', ')}`, vars));
    },

    ExpressionStatement(path) {
      if (path.node._synthetic) return;
      if (
        t.isCallExpression(path.node.expression) &&
        t.isMemberExpression(path.node.expression.callee) &&
        path.node.expression.callee.object.name === '__tracer'
      ) {
        return;
      }
      // Se for uma chamada de função no escopo raiz do programa (driver test call), não grava passo vazio que apaga as variáveis
      if (path.parentPath.isProgram() && t.isCallExpression(path.node.expression)) {
        return;
      }
      const line = path.node.loc ? path.node.loc.start.line : 1;
      const col = path.node.loc ? path.node.loc.start.column : 0;
      let desc = 'Executou instrução';

      if (t.isAssignmentExpression(path.node.expression)) {
        const leftCode = generate(path.node.expression.left).code;
        desc = `Atribuiu valor a ${leftCode}`;
      } else if (t.isUpdateExpression(path.node.expression)) {
        const argCode = generate(path.node.expression.argument).code;
        desc = `Atualizou ${argCode} (${path.node.expression.operator})`;
      } else if (t.isCallExpression(path.node.expression)) {
        const calleeCode = generate(path.node.expression.callee).code;
        desc = `Chamou ${calleeCode}()`;
      }

      const vars = getSafeScopeVars(path);
      path.insertAfter(makeTraceStatement(line, col, 'expr', desc, vars));
    },

    ReturnStatement(path) {
      if (path.node._synthetic) return;
      const line = path.node.loc ? path.node.loc.start.line : 1;
      const col = path.node.loc ? path.node.loc.start.column : 0;
      const vars = getSafeScopeVars(path);

      if (path.node.argument) {
        const tempId = path.scope.generateUidIdentifier('ret');
        const decl = t.variableDeclaration('const', [
          t.variableDeclarator(tempId, path.node.argument)
        ]);
        decl._synthetic = true;
        const trace = t.expressionStatement(
          t.callExpression(t.memberExpression(t.identifier('__tracer'), t.identifier('recordReturn')), [
            t.numericLiteral(line),
            t.numericLiteral(col),
            tempId,
            t.objectExpression(vars.map(name => t.objectProperty(t.identifier(name), t.identifier(name), false, true)))
          ])
        );
        trace._synthetic = true;
        path.node.argument = tempId;
        path.insertBefore([decl, trace]);
      } else {
        const trace = makeTraceStatement(line, col, 'return', 'Retornou da função', vars);
        trace._synthetic = true;
        path.insertBefore(trace);
      }
    }
  });

  return generate(ast, { retainLines: false }).code;
}

/**
 * Runs the code and traces all execution steps
 */
export function runAndTrace(code) {
  let instrumented = '';
  try {
    instrumented = instrumentCode(code);
  } catch (err) {
    return {
      success: false,
      error: {
        type: 'SyntaxError',
        message: err.message.replace(/\s*\(\d+:\d+\)$/, ''),
        line: err.loc ? err.loc.line : 1,
        column: err.loc ? err.loc.column : 0
      },
      steps: []
    };
  }

  const steps = [];
  const consoleLogs = [];
  let limitReached = false;
  let returnValue = undefined;
  let hasReturned = false;

  const NON_POINTER_NAMES = new Set([
    'diff', 'target', 'sum', 'total', 'maxSum', 'currentSum', 'count', 'val', 'ans', 'result', 'res', 'temp',
    'k', 'windowSum', 'maxWater', 'maxLength', 'minLen', 'width', 'h', 'area', 'm', 'n',
    'minPrice', 'maxProfit', 'profit', 'price'
  ]);

  const tracer = {
    recordReturn(line, col, val, vars) {
      returnValue = cloneValue(val);
      hasReturned = true;
      this.record(
        line,
        col,
        'return',
        `Retornou da função (Resultado: ${typeof val === 'object' ? JSON.stringify(returnValue) : String(val)})`,
        vars,
        returnValue
      );
    },
    record(line, col, type, desc, vars, stepReturn = undefined) {
      if (steps.length >= MAX_STEPS) {
        if (!limitReached) {
          limitReached = true;
          throw new Error(`Limite de segurança de ${MAX_STEPS} passos atingido. Possível loop infinito evitado.`);
        }
        return;
      }

      const clonedVars = {};
      const arrays = [];
      const maps = [];
      const primitivePointers = {};

      for (const [key, val] of Object.entries(vars)) {
        const cloned = cloneValue(val);
        clonedVars[key] = cloned;

        if (Array.isArray(val)) {
          arrays.push({
            name: key,
            data: cloned
          });
        } else if (typeof val === 'string' && val.length >= 1 && val.length <= 50 && ['s', 'str', 'clean', 't', 'word', 'chars'].includes(key)) {
          arrays.push({
            name: key,
            data: Array.from(val),
            isString: true
          });
        } else if (cloned && (cloned.__isMap || cloned.__isSet)) {
          maps.push({
            name: key,
            type: cloned.__isMap ? 'Map' : 'Set',
            data: cloned
          });
        } else if (typeof val === 'number' && Number.isInteger(val)) {
          if (!NON_POINTER_NAMES.has(key)) {
            primitivePointers[key] = val;
          }
        }
      }

      // Garante que estruturas de dados (arrays e maps) não desapareçam se um passo posterior não as listar
      if (arrays.length === 0 && steps.length > 0 && steps[steps.length - 1].arrays.length > 0) {
        arrays.push(...steps[steps.length - 1].arrays);
      }
      if (maps.length === 0 && steps.length > 0 && steps[steps.length - 1].maps.length > 0) {
        maps.push(...steps[steps.length - 1].maps);
      }

      // Se as variáveis estiverem vazias mas passos anteriores tinham variáveis (ex: fim de execução), mantém as do passo anterior
      if (Object.keys(clonedVars).length === 0 && steps.length > 0 && Object.keys(steps[steps.length - 1].variables).length > 0) {
        Object.assign(clonedVars, steps[steps.length - 1].variables);
      }

      // Detect pointers that point into existing arrays
      const pointerMatches = [];
      for (const [pName, pVal] of Object.entries(primitivePointers)) {
        for (const arr of arrays) {
          if (pVal >= 0 && pVal < arr.data.length) {
            pointerMatches.push({
              varName: pName,
              index: pVal,
              arrayName: arr.name
            });
          }
        }
      }

      // Detect changed variables compared to previous step
      const changedVars = [];
      if (steps.length > 0) {
        const prevVars = steps[steps.length - 1].variables;
        for (const [k, v] of Object.entries(clonedVars)) {
          const prevVal = prevVars[k];
          if (JSON.stringify(prevVal) !== JSON.stringify(v)) {
            changedVars.push(k);
          }
        }
      }

      steps.push({
        stepIndex: steps.length,
        line,
        col,
        type,
        desc,
        variables: clonedVars,
        changedVars,
        arrays,
        maps,
        pointers: pointerMatches,
        consoleLogsSnapshot: [...consoleLogs],
        returnValue: stepReturn !== undefined ? stepReturn : (hasReturned ? returnValue : undefined),
        isReturn: type === 'return'
      });
    }
  };

  // Custom sandbox console
  const customConsole = {
    log(...args) {
      const formatted = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      consoleLogs.push({ type: 'log', message: formatted, step: steps.length });
    },
    warn(...args) {
      const formatted = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      consoleLogs.push({ type: 'warn', message: formatted, step: steps.length });
    },
    error(...args) {
      const formatted = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      consoleLogs.push({ type: 'error', message: formatted, step: steps.length });
    },
    info(...args) {
      const formatted = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      consoleLogs.push({ type: 'info', message: formatted, step: steps.length });
    }
  };

  try {
    const wrappedFn = new Function('__tracer', 'console', instrumented);
    const result = wrappedFn(tracer, customConsole);
    if (result !== undefined) {
      returnValue = cloneValue(result);
      hasReturned = true;
    }
  } catch (err) {
    const isLimit = limitReached || err.message.includes('Limite de segurança');
    return {
      success: !isLimit,
      error: {
        type: isLimit ? 'LoopLimit' : 'RuntimeError',
        message: err.message,
        line: steps.length > 0 ? steps[steps.length - 1].line : 1
      },
      steps,
      consoleLogs,
      returnValue: undefined
    };
  }

  // Se nenhum passo foi capturado (ex: só definições de funções sem chamadas)
  if (steps.length === 0) {
    steps.push({
      stepIndex: 0,
      line: 1,
      col: 0,
      type: 'idle',
      desc: 'Código carregado com sucesso. Execute ou chame sua função para ver os passos.',
      variables: {},
      changedVars: [],
      arrays: [],
      maps: [],
      pointers: [],
      consoleLogsSnapshot: [...consoleLogs]
    });
  }

  return {
    success: true,
    steps,
    consoleLogs,
    returnValue: hasReturned ? returnValue : undefined
  };
}
