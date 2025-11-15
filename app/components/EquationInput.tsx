'use client';

import { useState } from 'react';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import { useAppStore } from '@/lib/store';
import { useLatexInput } from '@/hooks';
import { generateRandomColor, validateExpression } from '@/lib/utils';
import { equationInputStyles } from '@/theme/styles';
import type { GraphMode } from '@/types';
import { expressionToEditableLatex } from '@/lib/latex';

export default function EquationInput() {
  const { equations, addEquation, removeEquation, toggleEquationVisibility, selectedMode } = useAppStore();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [inputMode, setInputMode] = useState<'expression' | 'latex'>('expression');
  
  const {
    latexInput,
    setLatexInput,
    latexSyntaxError,
    latexConversionError,
    latexHasError,
    handleLatexChange,
    resetLatex,
  } = useLatexInput();

  const themeStyles = equationInputStyles;

  const switchInputMode = (mode: 'expression' | 'latex') => {
    setInputMode(mode);
    setError('');
    if (mode === 'latex') {
      setLatexInput(input ? expressionToEditableLatex(input) : '');
    }
  };

  const handleLatexInput = (value: string) => {
    const expression = handleLatexChange(value);
    setInput(expression);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMode === 'latex') {
      if (!latexInput.trim()) {
        setError('Enter a LaTeX expression to continue');
        return;
      }
      if (latexHasError) {
        setError('Resolve the highlighted LaTeX issues before adding the equation');
        return;
      }
    }

    const validation = validateExpression(input);
    if (!validation.valid) {
      setError(validation.error || 'Invalid expression');
      return;
    }

    addEquation({
      expression: input,
      color: generateRandomColor(),
      visible: true,
      mode: selectedMode,
    });

    setInput('');
    setError('');
    resetLatex();
  };

  const modeExamples: Record<GraphMode, string[]> = {
    '2d': ['x^2', 'sin(x)', 'log(x)', 'exp(x)', '1/x'],
    '3d': ['sin(sqrt(x^2 + y^2))', 'x^2 + y^2', 'cos(x) * sin(y)'],
    'parametric': ['x = t, y = sin(t)', 'x = cos(t), y = sin(t)'],
    'polar': ['r = cos(3*theta)', 'r = 1 + sin(theta)'],
    'implicit': ['x^2 + y^2 = 25', 'x^2 - y^2 = 1'],
  };

  const latexExamples: Record<GraphMode, string[]> = {
    '2d': ['x^{2}', '\\sin(x)', '\\frac{1}{x}', '\\sqrt{x}'],
    '3d': ['\\sin\\left(\\sqrt{x^{2}+y^{2}}\\right)', 'x^{2}+y^{2}', '\\cos(x)\\cdot\\sin(y)'],
    'parametric': ['x=t,\\,y=\\sin(t)', 'x=\\cos(t),\\,y=\\sin(t)'],
    'polar': ['r=\\cos(3\\theta)', 'r=1+\\sin(\\theta)'],
    'implicit': ['x^{2}+y^{2}=25', 'x^{2}-y^{2}=1'],
  };

  const examples = inputMode === 'latex' ? latexExamples[selectedMode] : modeExamples[selectedMode];

  const applyExample = (example: string) => {
    if (inputMode === 'latex') {
      handleLatexInput(example);
    } else {
      setInput(example);
      setError('');
    }
  };

  return (
    <div className="rounded-lg shadow-lg p-6 space-y-4 border" style={themeStyles.panel}>
      <h2 className="text-xl font-bold" style={themeStyles.heading}>Equations</h2>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide" style={themeStyles.helper}>
          <span>Input Mode:</span>
          <div className="flex rounded-lg border overflow-hidden" style={themeStyles.exampleChip}>
            <button
              type="button"
              onClick={() => switchInputMode('expression')}
              className={`px-3 py-1.5 text-xs font-semibold transition-all touch-feedback active:scale-95 ${
                inputMode === 'expression' ? 'bg-opacity-90' : 'bg-transparent'
              }`}
              style={
                inputMode === 'expression'
                  ? themeStyles.modeButton.active
                  : themeStyles.modeButton.inactive
              }
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => switchInputMode('latex')}
              className={`px-3 py-1.5 text-xs font-semibold transition-all touch-feedback active:scale-95 ${
                inputMode === 'latex' ? 'bg-opacity-90' : 'bg-transparent'
              }`}
              style={
                inputMode === 'latex'
                  ? themeStyles.modeButton.active
                  : themeStyles.modeButton.inactive
              }
            >
              LaTeX
            </button>
          </div>
        </div>

        {inputMode === 'expression' ? (
          <div>
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError('');
              }}
              placeholder={`Enter equation (e.g., ${modeExamples[selectedMode][0]})`}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-offset-2"
              style={themeStyles.input}
            />
            {error && (
              <p className="mt-1 text-sm" style={themeStyles.errorText}>{error}</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              value={latexInput}
              onChange={(e) => handleLatexInput(e.target.value)}
              placeholder="Type LaTeX here (e.g., x^{2} + \sin(x))"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-offset-2 min-h-[96px] font-mono text-sm ${
                latexHasError ? 'border-red-500 focus:ring-red-500' : ''
              }`}
              style={themeStyles.input}
            />
            <div className="rounded-lg border p-3 bg-black/5" style={themeStyles.preview}>
              {latexInput ? (
                <BlockMath
                  math={latexInput}
                  errorColor="#DC2626"
                  renderError={(err) => (
                    <span className="text-sm text-red-500 font-mono">{err.message}</span>
                  )}
                />
              ) : (
                <p className="text-sm" style={themeStyles.helper}>
                  Start typing LaTeX to see a live preview
                </p>
              )}
            </div>
            {(latexSyntaxError || latexConversionError || error) && (
              <div className="space-y-1">
                {latexSyntaxError && (
                  <p className="text-sm" style={themeStyles.errorText}>
                    {latexSyntaxError}
                  </p>
                )}
                {latexConversionError && (
                  <p className="text-sm" style={themeStyles.errorText}>
                    {latexConversionError}
                  </p>
                )}
                {error && (
                  <p className="text-sm" style={themeStyles.errorText}>{error}</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-4 py-3 rounded-lg font-medium transition-all glow-button touch-feedback hw-accelerated active:scale-98"
            style={themeStyles.addButton}
            data-active="true"
          >
            Add Equation
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-sm" style={themeStyles.helper}>Examples:</span>
          {examples.map((example, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyExample(example)}
              className="text-xs px-3 py-1.5 rounded-lg border transition-all hover:opacity-80 touch-feedback active:scale-95 hw-accelerated"
              style={themeStyles.exampleChip}
            >
              {example}
            </button>
          ))}
        </div>
      </form>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {equations.length === 0 ? (
          <p className="text-sm text-center py-4" style={themeStyles.emptyState}>
            No equations added yet
          </p>
        ) : (
          equations.map((eq) => (
            <div
              key={eq.id}
              className="flex items-center gap-3 p-3 rounded-lg border transition-colors"
              style={themeStyles.equationCard}
            >
              <button
                type="button"
                onClick={() => toggleEquationVisibility(eq.id)}
                className="flex-shrink-0 touch-feedback active:scale-90 transition-transform"
                aria-label={eq.visible ? 'Hide equation' : 'Show equation'}
              >
                <div
                  className="w-7 h-7 rounded border-2 flex items-center justify-center transition-all hw-accelerated"
                  style={{
                    borderColor: eq.color,
                    color: eq.color,
                    background: eq.visible ? eq.color : 'transparent',
                  }}
                >
                  {eq.visible && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={themeStyles.toggleIcon}>
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>

              <div className="flex-1 min-w-0">
                <code className="text-sm font-mono truncate block" style={themeStyles.heading}>
                  {eq.expression}
                </code>
                <span className="text-xs" style={themeStyles.helper}>
                  {eq.mode || '2d'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => removeEquation(eq.id)}
                className="flex-shrink-0 p-1.5 transition-all hover:opacity-80 touch-feedback active:scale-90 rounded-lg"
                style={themeStyles.removeButton}
                aria-label="Remove equation"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
