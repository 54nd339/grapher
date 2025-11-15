import { LabeledInput } from './LabeledInput';
import { LatexExpressionInput } from './LatexExpressionInput';
import { expressionToEditableLatex } from '@/lib/latex';
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
    <LatexExpressionInput
      label={`Function f(${variable})`}
      expression={input}
      onExpressionChange={onInputChange}
      placeholder="e.g., x^2 + 2*x + 1"
      previewLatex={
        input ? `f(${variable}) = ${expressionToEditableLatex(input)}` : undefined
      }
      previewPlaceholder="Enter a function to preview f(x)"
      themeStyles={themeStyles}
    />
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
