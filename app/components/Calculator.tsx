'use client';

/**
 * Advanced calculator for derivatives, integrals, matrices, and vectors
 */

import { useState } from 'react';
import { useAppStore } from '../lib/store';
import { mathEngine } from '../lib/mathEngine';
import { formatNumber, formatMatrix, formatVector, parseMatrix, parseVector } from '../lib/utils';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import type { CalculationMode, MatrixOperation, VectorOperation, DerivativeOptions, IntegralOptions } from '../types';

export default function Calculator() {
  const { calculationMode, setCalculationMode, addResult, results, clearResults } = useAppStore();
  const [input, setInput] = useState('');
  const [variable, setVariable] = useState('x');
  const [point, setPoint] = useState('');
  const [lowerBound, setLowerBound] = useState('0');
  const [upperBound, setUpperBound] = useState('1');
  const [matrixA, setMatrixA] = useState('[[1,2],[3,4]]');
  const [matrixB, setMatrixB] = useState('[[5,6],[7,8]]');
  const [matrixOp, setMatrixOp] = useState<MatrixOperation['type']>('multiply');
  const [vectorA, setVectorA] = useState('[1,2,3]');
  const [vectorB, setVectorB] = useState('[4,5,6]');
  const [vectorOp, setVectorOp] = useState<VectorOperation['type']>('dot');
  const [error, setError] = useState('');

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
          bounds: [parseFloat(lowerBound), parseFloat(upperBound)],
          method: 'simpson',
        };
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

  const renderCalculatorContent = () => {
    switch (calculationMode) {
      case 'derivative':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Function f({variable})
              </label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., x^2 + 2*x + 1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
              />
              {input && (
                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <InlineMath math={`f(${variable}) = ${input.replace(/\*/g, '').replace(/\^/g, '^')}`} />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Variable
                </label>
                <input
                  type="text"
                  value={variable}
                  onChange={(e) => setVariable(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Point (optional)
                </label>
                <input
                  type="text"
                  value={point}
                  onChange={(e) => setPoint(e.target.value)}
                  placeholder="e.g., 2"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        );

      case 'integral':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Function f({variable})
              </label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., x^2"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
              />
              {input && (
                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                  <BlockMath math={`\\int_{${lowerBound}}^{${upperBound}} ${input.replace(/\*/g, '').replace(/\^/g, '^')} \\, d${variable}`} />
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Variable
                </label>
                <input
                  type="text"
                  value={variable}
                  onChange={(e) => setVariable(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lower Bound
                </label>
                <input
                  type="text"
                  value={lowerBound}
                  onChange={(e) => setLowerBound(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Upper Bound
                </label>
                <input
                  type="text"
                  value={upperBound}
                  onChange={(e) => setUpperBound(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        );

      case 'matrix':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Operation
              </label>
              <select
                value={matrixOp}
                onChange={(e) => setMatrixOp(e.target.value as MatrixOperation['type'])}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="add">Add (A + B)</option>
                <option value="subtract">Subtract (A - B)</option>
                <option value="multiply">Multiply (A × B)</option>
                <option value="transpose">Transpose (Aᵀ)</option>
                <option value="inverse">Inverse (A⁻¹)</option>
                <option value="determinant">Determinant (det(A))</option>
                <option value="eigenvalues">Eigenvalues (λ)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Matrix A
              </label>
              <input
                type="text"
                value={matrixA}
                onChange={(e) => setMatrixA(e.target.value)}
                placeholder="[[1,2],[3,4]]"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
              />
            </div>
            {!['transpose', 'inverse', 'determinant', 'eigenvalues'].includes(matrixOp) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Matrix B
                </label>
                <input
                  type="text"
                  value={matrixB}
                  onChange={(e) => setMatrixB(e.target.value)}
                  placeholder="[[5,6],[7,8]]"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                />
              </div>
            )}
          </div>
        );

      case 'vector':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Operation
              </label>
              <select
                value={vectorOp}
                onChange={(e) => setVectorOp(e.target.value as VectorOperation['type'])}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="add">Add (A + B)</option>
                <option value="subtract">Subtract (A - B)</option>
                <option value="dot">Dot Product (A · B)</option>
                <option value="cross">Cross Product (A × B)</option>
                <option value="magnitude">Magnitude (|A|)</option>
                <option value="normalize">Normalize (Â)</option>
                <option value="projection">Projection (projᵦA)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Vector A
              </label>
              <input
                type="text"
                value={vectorA}
                onChange={(e) => setVectorA(e.target.value)}
                placeholder="[1,2,3]"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
              />
            </div>
            {!['magnitude', 'normalize'].includes(vectorOp) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vector B
                </label>
                <input
                  type="text"
                  value={vectorB}
                  onChange={(e) => setVectorB(e.target.value)}
                  placeholder="[4,5,6]"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                />
              </div>
            )}
          </div>
        );

      case 'solve':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Equation
              </label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., x^2 - 4 = 0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Variable
              </label>
              <input
                type="text"
                value={variable}
                onChange={(e) => setVariable(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const modes: { value: CalculationMode; label: string; icon: string }[] = [
    { value: 'derivative', label: 'Derivative', icon: 'd/dx' },
    { value: 'integral', label: 'Integral', icon: '∫' },
    { value: 'solve', label: 'Solve', icon: '=' },
    { value: 'matrix', label: 'Matrix', icon: '[ ]' },
    { value: 'vector', label: 'Vector', icon: '→' },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Calculator</h2>
        {results.length > 0 && (
          <button
            onClick={clearResults}
            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
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
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
                     ${calculationMode === mode.value
                       ? 'bg-blue-600 text-white'
                       : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                     }`}
          >
            <div className="text-lg mb-1">{mode.icon}</div>
            <div className="text-xs">{mode.label}</div>
          </button>
        ))}
      </div>

      {calculationMode && (
        <>
          {renderCalculatorContent()}
          
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleCalculate}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg
                     font-medium transition-colors"
          >
            Calculate
          </button>
        </>
      )}

      {results.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 sticky top-0 bg-white dark:bg-gray-900 py-2">
            Results
          </h3>
          {results.map((result, idx) => (
            <div
              key={idx}
              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {result.mode}
                </span>
              </div>
              
              <div className="text-sm text-gray-900 dark:text-white">
                <span className="font-semibold">Input: </span>
                <span className="font-mono">{result.input}</span>
              </div>
              
              <div className="text-sm text-gray-900 dark:text-white">
                <span className="font-semibold">Result: </span>
                {typeof result.result === 'number' 
                  ? <span className="font-mono">{formatNumber(result.result)}</span>
                  : Array.isArray(result.result)
                  ? Array.isArray(result.result[0])
                    ? <pre className="font-mono text-xs mt-1 p-2 bg-white dark:bg-gray-900 rounded">{formatMatrix(result.result as number[][])}</pre>
                    : <span className="font-mono">{formatVector(result.result as unknown as number[])}</span>
                  : <span className="font-mono">{String(result.result)}</span>
                }
              </div>

              {result.error && (
                <div className="text-sm text-red-600 dark:text-red-400">
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
