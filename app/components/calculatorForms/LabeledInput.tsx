import type { CalculatorThemeStyles } from '@/types';

export type LabeledInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  inputClassName?: string;
  themeStyles: CalculatorThemeStyles;
};

export const LabeledInput = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputClassName = '',
  themeStyles,
}: LabeledInputProps) => (
  <div>
    <label className="block text-sm font-medium mb-1" style={themeStyles.muted}>
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border rounded-lg ${inputClassName}`.trim()}
      style={themeStyles.input}
    />
  </div>
);
