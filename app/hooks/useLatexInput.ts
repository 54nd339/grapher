import { useCallback, useState } from 'react';
import katex from 'katex';
import { latexToExpression } from '@/lib/latex';

export function useLatexInput(initialValue = '') {
  const [latexInput, setLatexInput] = useState(initialValue);
  const [latexSyntaxError, setLatexSyntaxError] = useState('');
  const [latexConversionError, setLatexConversionError] = useState('');

  const validateLatex = useCallback((value: string) => {
    if (!value.trim()) {
      setLatexSyntaxError('');
      return;
    }
    try {
      katex.renderToString(value, { throwOnError: true });
      setLatexSyntaxError('');
    } catch (latexErr) {
      setLatexSyntaxError((latexErr as Error).message || 'Invalid LaTeX syntax');
    }
  }, []);

  const handleLatexChange = useCallback((value: string) => {
    setLatexInput(value);
    setLatexConversionError('');
    validateLatex(value);
    const { expression, error: conversionError } = latexToExpression(value);
    if (conversionError) {
      setLatexConversionError(conversionError);
    }
    return expression;
  }, [validateLatex]);

  const resetLatex = useCallback(() => {
    setLatexInput('');
    setLatexSyntaxError('');
    setLatexConversionError('');
  }, []);

  const latexHasError = Boolean(latexSyntaxError || latexConversionError);

  return {
    latexInput,
    setLatexInput,
    latexSyntaxError,
    latexConversionError,
    latexHasError,
    validateLatex,
    handleLatexChange,
    resetLatex,
  };
}
