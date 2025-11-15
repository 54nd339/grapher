import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import { LabeledInput } from './LabeledInput';
import type { CalculatorThemeStyles, IntegralVariant } from '@/types';

export type IntegralFormProps = {
  input: string;
  variable: string;
  lowerBound: string;
  upperBound: string;
  variant: IntegralVariant;
  onInputChange: (value: string) => void;
  onVariableChange: (value: string) => void;
  onLowerBoundChange: (value: string) => void;
  onUpperBoundChange: (value: string) => void;
  onVariantChange: (value: IntegralVariant) => void;
  themeStyles: CalculatorThemeStyles;
};

export const IntegralForm = ({
  input,
  variable,
  lowerBound,
  upperBound,
  variant,
  onInputChange,
  onVariableChange,
  onLowerBoundChange,
  onUpperBoundChange,
  onVariantChange,
  themeStyles,
}: IntegralFormProps) => {
  const previewMath =
    variant === 'definite'
      ? `\\int_{${lowerBound}}^{${upperBound}} ${input
          .replace(/\*/g, '')
          .replace(/\^/g, '^')} \\, d${variable}`
      : `\\int ${input.replace(/\*/g, '').replace(/\^/g, '^')} \\, d${variable}`;

  const typeOptions: { label: string; value: IntegralVariant }[] = [
    { label: 'Definite', value: 'definite' },
    { label: 'Indefinite', value: 'indefinite' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {typeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onVariantChange(option.value)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              variant === option.value ? 'shadow-sm' : 'hover:opacity-80'
            }`}
            style={
              variant === option.value
                ? themeStyles.modeButton.active
                : themeStyles.modeButton.inactive
            }
          >
            {option.label}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={themeStyles.muted}>
          Function f({variable})
        </label>
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="e.g., x^2"
          className="w-full px-3 py-2 border rounded-lg font-mono"
          style={themeStyles.input}
        />
        {input && (
          <div className="mt-2 p-2 rounded border" style={themeStyles.preview}>
            <BlockMath math={previewMath} />
          </div>
        )}
      </div>
      <div className={`grid gap-3 ${variant === 'definite' ? 'grid-cols-3' : 'grid-cols-1'}`}>
        <LabeledInput
          label="Variable"
          value={variable}
          onChange={onVariableChange}
          themeStyles={themeStyles}
        />
        {variant === 'definite' && (
          <>
            <LabeledInput
              label="Lower Bound"
              value={lowerBound}
              onChange={onLowerBoundChange}
              themeStyles={themeStyles}
            />
            <LabeledInput
              label="Upper Bound"
              value={upperBound}
              onChange={onUpperBoundChange}
              themeStyles={themeStyles}
            />
          </>
        )}
      </div>
    </div>
  );
};
