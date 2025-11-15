import type { MatrixOperation, CalculatorThemeStyles } from '@/types';

export type MatrixFormProps = {
  matrixOp: MatrixOperation['type'];
  matrixA: string;
  matrixB: string;
  onMatrixOpChange: (value: MatrixOperation['type']) => void;
  onMatrixAChange: (value: string) => void;
  onMatrixBChange: (value: string) => void;
  themeStyles: CalculatorThemeStyles;
};

export const MatrixForm = ({
  matrixOp,
  matrixA,
  matrixB,
  onMatrixOpChange,
  onMatrixAChange,
  onMatrixBChange,
  themeStyles,
}: MatrixFormProps) => (
  <div className="space-y-3">
    <div>
      <label className="block text-sm font-medium mb-1" style={themeStyles.muted}>
        Operation
      </label>
      <select
        value={matrixOp}
        onChange={(e) => onMatrixOpChange(e.target.value as MatrixOperation['type'])}
        className="w-full px-3 py-2 border rounded-lg"
        style={themeStyles.input}
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
      <label className="block text-sm font-medium mb-1" style={themeStyles.muted}>
        Matrix A
      </label>
      <input
        type="text"
        value={matrixA}
        onChange={(e) => onMatrixAChange(e.target.value)}
        placeholder="[[1,2],[3,4]]"
        className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
        style={themeStyles.input}
      />
    </div>
    {!['transpose', 'inverse', 'determinant', 'eigenvalues'].includes(matrixOp) && (
      <div>
        <label className="block text-sm font-medium mb-1" style={themeStyles.muted}>
          Matrix B
        </label>
        <input
          type="text"
          value={matrixB}
          onChange={(e) => onMatrixBChange(e.target.value)}
          placeholder="[[5,6],[7,8]]"
          className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
          style={themeStyles.input}
        />
      </div>
    )}
  </div>
);
