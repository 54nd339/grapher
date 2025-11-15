import { LabeledInput } from './LabeledInput';
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
    <LabeledInput
      label="Equation"
      value={input}
      onChange={onInputChange}
      placeholder="e.g., x^2 - 4 = 0"
      inputClassName="font-mono"
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
