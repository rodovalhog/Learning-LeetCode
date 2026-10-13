import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { StateField, StateEffect } from '@codemirror/state';
import { Decoration } from '@codemirror/view';

// StateEffect to update active execution line
export const setActiveExecLine = StateEffect.define();

// Line decoration for the active executing line
const execLineDecoration = Decoration.line({
  attributes: { class: 'cm-executing-line' }
});

const execLineField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    decorations = decorations.map(tr.changes);
    for (const effect of tr.effects) {
      if (effect.is(setActiveExecLine)) {
        if (effect.value === null || effect.value <= 0) {
          return Decoration.none;
        }
        try {
          const doc = tr.state.doc;
          const lineNum = Math.min(Math.max(1, effect.value), doc.lines);
          const line = doc.line(lineNum);
          return Decoration.set([execLineDecoration.range(line.from)]);
        } catch (e) {
          return Decoration.none;
        }
      }
    }
    return decorations;
  },
  provide: f => EditorView.decorations.from(f)
});

/**
 * Creates and initializes CodeMirror 6 editor instance
 */
export function createCodeEditor({ container, initialCode, onChange }) {
  let isUpdatingInternally = false;

  const updateListener = EditorView.updateListener.of(update => {
    if (update.docChanged && !isUpdatingInternally) {
      const code = update.state.doc.toString();
      if (onChange) onChange(code);
    }
  });

  const customTheme = EditorView.theme({
    '&': {
      height: '100%',
      fontSize: '14px',
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      backgroundColor: '#0d1117'
    },
    '.cm-scroller': {
      overflow: 'auto',
      lineHeight: '1.6'
    },
    '.cm-gutters': {
      backgroundColor: '#090d14',
      color: '#475569',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)'
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(99, 102, 241, 0.15)',
      color: '#818cf8',
      fontWeight: 'bold'
    },
    '.cm-executing-line': {
      backgroundColor: 'rgba(99, 102, 241, 0.22) !important',
      boxShadow: 'inset 3px 0 0 #6366f1, 0 0 16px rgba(99, 102, 241, 0.2)',
      borderRadius: '0 4px 4px 0'
    }
  });

  const view = new EditorView({
    doc: initialCode,
    extensions: [
      basicSetup,
      javascript(),
      oneDark,
      customTheme,
      execLineField,
      updateListener
    ],
    parent: container
  });

  return {
    view,
    getCode() {
      return view.state.doc.toString();
    },
    setCode(newCode) {
      if (view.state.doc.toString() === newCode) return;
      isUpdatingInternally = true;
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: newCode
        }
      });
      isUpdatingInternally = false;
    },
    highlightLine(lineNum) {
      if (!lineNum || lineNum <= 0) {
        view.dispatch({
          effects: setActiveExecLine.of(null)
        });
        return;
      }

      view.dispatch({
        effects: setActiveExecLine.of(lineNum)
      });

      // Rolar suavemente para a linha se necessário
      try {
        const line = view.state.doc.line(Math.min(lineNum, view.state.doc.lines));
        view.dispatch({
          effects: EditorView.scrollIntoView(line.from, { y: 'nearest' })
        });
      } catch (e) {
        // Ignora erro de scroll em documentos pequenos
      }
    }
  };
}
