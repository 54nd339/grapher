'use client';

import { useMemo, useState } from 'react';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import { useLatexInput } from '@/hooks';
import { expressionToEditableLatex } from '@/lib/latex';
import type { CalculatorThemeStyles } from '@/types';

type InputMode = 'expression' | 'latex';

type LatexExpressionInputProps = {
  label: string;
  expression: string;
  onExpressionChange: (value: string) => void;
  placeholder?: string;
  previewLatex?: string;
  previewPlaceholder?: string;
  themeStyles: CalculatorThemeStyles;
};

export function LatexExpressionInput({
  label,
  expression,
  onExpressionChange,
  placeholder,
  previewLatex,
  previewPlaceholder = 'Start typing to see a preview',
  themeStyles,
}: LatexExpressionInputProps) {
  const [inputMode, setInputMode] = useState<InputMode>('expression');
  
  const {
    latexInput,
    setLatexInput,
    latexSyntaxError,
    latexConversionError,
    handleLatexChange,
  } = useLatexInput();

  const resolvedPreviewLatex = useMemo(() => {
    if (previewLatex) return previewLatex;
    if (!expression) return '';
    return expressionToEditableLatex(expression);
  }, [expression, previewLatex]);

  const handleModeChange = (mode: InputMode) => {
    setInputMode(mode);
    if (mode === 'latex') {
      const nextValue = expression ? expressionToEditableLatex(expression) : '';
      setLatexInput(nextValue);
    }
  };

  const handleLatexInput = (value: string) => {
    const parsedExpression = handleLatexChange(value);
    if (!latexConversionError) {
      onExpressionChange(parsedExpression);
    }
  };

  const previewMath = inputMode === 'latex' && latexInput ? latexInput : resolvedPreviewLatex;
  const hasErrors = Boolean(latexSyntaxError || latexConversionError);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium" style={themeStyles.muted}>
          {label}
        </label>
        <div className="flex rounded-lg border overflow-hidden text-xs" style={themeStyles.preview}>
          <button
            type="button"
            onClick={() => handleModeChange('expression')}
            className={`px-2 py-1 font-semibold transition-colors ${
              inputMode === 'expression' ? 'shadow-sm' : ''
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
            onClick={() => handleModeChange('latex')}
            className={`px-2 py-1 font-semibold transition-colors ${inputMode === 'latex' ? 'shadow-sm' : ''}`}
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
        <input
          type="text"
          value={expression}
          onChange={(e) => onExpressionChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border rounded-lg font-mono"
          style={themeStyles.input}
        />
      ) : (
        <textarea
          value={latexInput}
          onChange={(e) => handleLatexInput(e.target.value)}
          placeholder={placeholder ? placeholder.replace(/\^/g, '^{ }').replace(/\*/g, '\\cdot ') : 'Type LaTeX here'}
          className={`w-full px-3 py-2 border rounded-lg font-mono text-sm min-h-[96px] ${
            hasErrors ? 'border-red-500 focus-visible:outline-red-500' : ''
          }`}
          style={themeStyles.input}
        />
      )}

      <div className="rounded-lg border p-3 bg-black/5" style={themeStyles.preview}>
        {previewMath ? (
          <BlockMath
            math={previewMath}
            errorColor="#DC2626"
            renderError={(err) => <span className="text-sm text-red-500 font-mono">{err.message}</span>}
          />
        ) : (
          <p className="text-sm" style={themeStyles.muted}>
            {previewPlaceholder}
          </p>
        )}
      </div>

      {hasErrors && (
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
        </div>
      )}
    </div>
  );
}
