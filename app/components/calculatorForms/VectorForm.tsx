import type { VectorOperation, CalculatorThemeStyles } from '@/types';

export type VectorFormProps = {
  vectorOp: VectorOperation['type'];
  vectorA: string;
  vectorB: string;
  onVectorOpChange: (value: VectorOperation['type']) => void;
  onVectorAChange: (value: string) => void;
  onVectorBChange: (value: string) => void;
  themeStyles: CalculatorThemeStyles;
};

export const VectorForm = ({
  vectorOp,
  vectorA,
  vectorB,
  onVectorOpChange,
  onVectorAChange,
  onVectorBChange,
  themeStyles,
}: VectorFormProps) => (
  <div className="space-y-3">
    <div>
      <label className="block text-sm font-medium mb-1" style={themeStyles.muted}>
        Operation
      </label>
      <select
        value={vectorOp}
        onChange={(e) => onVectorOpChange(e.target.value as VectorOperation['type'])}
        className="w-full px-3 py-2 border rounded-lg"
        style={themeStyles.input}
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
      <label className="block text-sm font-medium mb-1" style={themeStyles.muted}>
        Vector A
      </label>
      <input
        type="text"
        value={vectorA}
        onChange={(e) => onVectorAChange(e.target.value)}
        placeholder="[1,2,3]"
        className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
        style={themeStyles.input}
      />
    </div>
    {!['magnitude', 'normalize'].includes(vectorOp) && (
      <div>
        <label className="block text-sm font-medium mb-1" style={themeStyles.muted}>
          Vector B
        </label>
        <input
          type="text"
          value={vectorB}
          onChange={(e) => onVectorBChange(e.target.value)}
          placeholder="[4,5,6]"
          className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
          style={themeStyles.input}
        />
      </div>
    )}
  </div>
);
