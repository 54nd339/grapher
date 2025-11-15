import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import { LabeledInput } from './LabeledInput';
import type { CalculatorThemeStyles } from '@/types';

export type DerivativeFormProps = {
  input: string;
  variable: string;
  point: string;
  onInputChange: (value: string) => void;
  onVariableChange: (value: string) => void;
  onPointChange: (value: string) => void;
  themeStyles: CalculatorThemeStyles;
};

export const DerivativeForm = ({
  input,
  variable,
  point,
  onInputChange,
  onVariableChange,
  onPointChange,
  themeStyles,
}: DerivativeFormProps) => (
  <div className="space-y-3">
    <div>
      <label className="block text-sm font-medium mb-1" style={themeStyles.muted}>
        Function f({variable})
      </label>
      <input
        type="text"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder="e.g., x^2 + 2*x + 1"
        className="w-full px-3 py-2 border rounded-lg font-mono"
        style={themeStyles.input}
      />
      {input && (
        <div className="mt-2 p-2 rounded border" style={themeStyles.preview}>
          <InlineMath math={`f(${variable}) = ${input.replace(/\*/g, '').replace(/\^/g, '^')}`} />
        </div>
      )}
    </div>
    <div className="grid grid-cols-2 gap-3">
      <LabeledInput
        label="Variable"
        value={variable}
        onChange={onVariableChange}
        themeStyles={themeStyles}
      />
      <LabeledInput
        label="Point (optional)"
        value={point}
        onChange={onPointChange}
        placeholder="e.g., 2"
        themeStyles={themeStyles}
      />
    </div>
  </div>
);
