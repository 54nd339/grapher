'use client';

import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';
import { type ReactNode, useState } from 'react';
import { expressionToLatex, resultValueToLatex } from '@/lib/latex';
import { mathEngine } from '@/lib/mathEngine';
import { useAppStore } from '@/lib/store';
import { parseMatrix, parseVector } from '@/lib/utils';
import { calculatorStyles } from '@/theme/styles';
import type {
  CalculationMode,
  MatrixOperation,
  VectorOperation,
  DerivativeOptions,
  IntegralOptions,
  IntegralVariant,
} from '@/types';
import { DerivativeForm, IntegralForm, MatrixForm, SolveForm, VectorForm } from './calculatorForms';

type LatexValueProps = {
  value: string;
  inline?: boolean;
};

const LatexValue = ({ value, inline = false }: LatexValueProps) => {
  if (!value) {
    return <span className="font-mono">—</span>;
  }

  const Component = inline ? InlineMath : BlockMath;

  return (
    <Component
      math={value}
      errorColor="#DC2626"
      renderError={() => <span className="font-mono">{value}</span>}
    />
  );
};

export default function Calculator() {
  const { calculationMode, setCalculationMode, addResult, results, clearResults } = useAppStore();
  const [input, setInput] = useState('');
  const [variable, setVariable] = useState('x');
  const [point, setPoint] = useState('');
  const [lowerBound, setLowerBound] = useState('0');
  const [upperBound, setUpperBound] = useState('1');
  const [integralVariant, setIntegralVariant] = useState<IntegralVariant>('definite');
  const [matrixA, setMatrixA] = useState('[[1,2],[3,4]]');
  const [matrixB, setMatrixB] = useState('[[5,6],[7,8]]');
  const [matrixOp, setMatrixOp] = useState<MatrixOperation['type']>('multiply');
  const [vectorA, setVectorA] = useState('[1,2,3]');
  const [vectorB, setVectorB] = useState('[4,5,6]');
  const [vectorOp, setVectorOp] = useState<VectorOperation['type']>('dot');
  const [error, setError] = useState('');

  const themeStyles = calculatorStyles;

  const handleCalculate = () => {
    setError('');
    try {
      if (calculationMode === 'derivative') {
        const options: DerivativeOptions = {
          order: 1,
          point: point ? parseFloat(point) : undefined,
          symbolic: true,
        };
        const result = mathEngine.derivative(input, variable, options);
        addResult(result);
      } else if (calculationMode === 'integral') {
        const options: IntegralOptions = {
          variant: integralVariant,
          method: 'simpson',
        };
        if (integralVariant === 'definite') {
          options.bounds = [parseFloat(lowerBound), parseFloat(upperBound)];
        }
        const result = mathEngine.integral(input, variable, options);
        addResult(result);
      } else if (calculationMode === 'matrix') {
        const operation: MatrixOperation = {
          type: matrixOp,
          matrices: matrixOp === 'inverse' || matrixOp === 'determinant' || matrixOp === 'transpose' || matrixOp === 'eigenvalues'
            ? [parseMatrix(matrixA)]
            : [parseMatrix(matrixA), parseMatrix(matrixB)],
        };
        const result = mathEngine.matrixOperation(operation);
        addResult(result);
      } else if (calculationMode === 'vector') {
        const operation: VectorOperation = {
          type: vectorOp,
          vectors: vectorOp === 'magnitude' || vectorOp === 'normalize'
            ? [parseVector(vectorA)]
            : [parseVector(vectorA), parseVector(vectorB)],
        };
        const result = mathEngine.vectorOperation(operation);
        addResult(result);
      } else if (calculationMode === 'solve') {
        const result = mathEngine.solve(input, variable);
        addResult(result);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const modeForms: Partial<Record<CalculationMode, ReactNode>> = {
    derivative: (
      <DerivativeForm
        input={input}
        variable={variable}
        point={point}
        onInputChange={setInput}
        onVariableChange={setVariable}
        onPointChange={setPoint}
        themeStyles={themeStyles}
      />
    ),
    integral: (
      <IntegralForm
        input={input}
        variable={variable}
        lowerBound={lowerBound}
        upperBound={upperBound}
        variant={integralVariant}
        onInputChange={setInput}
        onVariableChange={setVariable}
        onLowerBoundChange={setLowerBound}
        onUpperBoundChange={setUpperBound}
        onVariantChange={setIntegralVariant}
        themeStyles={themeStyles}
      />
    ),
    matrix: (
      <MatrixForm
        matrixOp={matrixOp}
        matrixA={matrixA}
        matrixB={matrixB}
        onMatrixOpChange={setMatrixOp}
        onMatrixAChange={setMatrixA}
        onMatrixBChange={setMatrixB}
        themeStyles={themeStyles}
      />
    ),
    vector: (
      <VectorForm
        vectorOp={vectorOp}
        vectorA={vectorA}
        vectorB={vectorB}
        onVectorOpChange={setVectorOp}
        onVectorAChange={setVectorA}
        onVectorBChange={setVectorB}
        themeStyles={themeStyles}
      />
    ),
    solve: (
      <SolveForm
        input={input}
        variable={variable}
        onInputChange={setInput}
        onVariableChange={setVariable}
        themeStyles={themeStyles}
      />
    ),
  };

  const activeForm = calculationMode ? modeForms[calculationMode] ?? null : null;

  const modes: { value: CalculationMode; label: string; icon: string }[] = [
    { value: 'derivative', label: 'Derivative', icon: 'd/dx' },
    { value: 'integral', label: 'Integral', icon: '∫' },
    { value: 'solve', label: 'Solve', icon: '=' },
    { value: 'matrix', label: 'Matrix', icon: '[ ]' },
    { value: 'vector', label: 'Vector', icon: '→' },
  ];

  return (
    <div className="rounded-lg shadow-lg p-6 space-y-4 h-full flex flex-col border" style={themeStyles.panel}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={themeStyles.heading}>Calculator</h2>
        {results.length > 0 && (
          <button
            onClick={clearResults}
            className="text-sm transition-colors"
            style={themeStyles.clearButton}
          >
            Clear History
          </button>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => setCalculationMode(mode.value)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              calculationMode === mode.value ? 'shadow-sm' : 'hover:opacity-80'
            }`}
            style={
              calculationMode === mode.value
                ? themeStyles.modeButton.active
                : themeStyles.modeButton.inactive
            }
          >
            <div className="text-lg mb-1">{mode.icon}</div>
            <div className="text-xs">{mode.label}</div>
          </button>
        ))}
      </div>

      {calculationMode && (
        <>
          {activeForm}

          {error && (
            <div className="p-3 border rounded-lg" style={themeStyles.errorBox}>
              <p className="text-sm" style={themeStyles.errorText}>
                {error}
              </p>
            </div>
          )}

          <button
            onClick={handleCalculate}
            className="w-full px-4 py-2 rounded-lg font-medium transition-transform hover:scale-[1.01]"
            style={themeStyles.actionButton}
          >
            Calculate
          </button>
        </>
      )}

      {results.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-2">
          <h3 className="text-sm font-semibold sticky top-0 py-2" style={themeStyles.resultHeader}>
            Results
          </h3>
          {results.map((result, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg space-y-2"
              style={themeStyles.resultCard}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase" style={themeStyles.resultMuted}>
                  {result.mode}
                </span>
              </div>
              
              <div className="text-sm" style={themeStyles.heading}>
                <span className="font-semibold mr-2">Input:</span>
                <span className="inline-flex items-center">
                  <LatexValue value={expressionToLatex(result.input)} inline />
                </span>
              </div>

              <div className="text-sm" style={themeStyles.heading}>
                <span className="font-semibold block">Result:</span>
                <div className="mt-1 p-2 rounded border" style={themeStyles.preview}>
                  <LatexValue value={resultValueToLatex(result.result)} />
                </div>
              </div>

              {result.error && (
                <div className="text-sm" style={themeStyles.errorText}>
                  Error: {result.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
