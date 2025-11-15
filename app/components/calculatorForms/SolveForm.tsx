import { LabeledInput } from './LabeledInput';
import { LatexExpressionInput } from './LatexExpressionInput';
import { expressionToEditableLatex } from '@/lib/latex';
import type { CalculatorThemeStyles } from '@/types';

export type SolveFormProps = {
  input: string;
  variable: string;
  onInputChange: (value: string) => void;
  onVariableChange: (value: string) => void;
  themeStyles: CalculatorThemeStyles;
};

export const SolveForm = ({
  input,
  variable,
  onInputChange,
  onVariableChange,
  themeStyles,
}: SolveFormProps) => (
  <div className="space-y-3">
    <LatexExpressionInput
      label="Equation"
      expression={input}
      onExpressionChange={onInputChange}
      placeholder="e.g., x^2 - 4 = 0"
      previewLatex={input ? expressionToEditableLatex(input) : undefined}
      previewPlaceholder="Enter an equation to preview"
      themeStyles={themeStyles}
    />
    <LabeledInput
      label="Variable"
      value={variable}
      onChange={onVariableChange}
      themeStyles={themeStyles}
    />
  </div>
);
