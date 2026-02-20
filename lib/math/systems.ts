import { ceCompile } from "./ce-compile";

/**
 * Solve a system of linear equations.
 * Input format: "x + 2y = 5, 3x - y = 1"
 * Uses Cramer's rule for 2x2 and Gaussian elimination for larger systems.
 */
export function solveLinearSystem(
  input: string,
): { solution: Record<string, number>; steps: string[] } | null {
  try {
    const equations = input.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
    if (equations.length < 2) return null;

    // Extract variables from the equations
    const vars = new Set<string>();
    for (const eq of equations) {
      const matches = eq.match(/[a-z]/gi);
      if (matches) matches.forEach((v) => vars.add(v.toLowerCase()));
    }
    // Remove common function names
    vars.delete("s"); vars.delete("i"); vars.delete("n");
    const varList = Array.from(vars).sort();

    if (varList.length > 4) return null;
    if (equations.length !== varList.length) return null;

    // Parse into Ax = b by evaluating g(x) = lhs - rhs.
    // For linear equations: a_j = g(e_j) - g(0), and b = -g(0).
    const n = varList.length;
    const A: number[][] = [];
    const b: number[] = [];
    const steps: string[] = [`System of ${equations.length} equations in ${n} unknowns: ${varList.join(", ")}`];

    for (const eq of equations) {
      const [lhsStr, rhsStr] = eq.split("=").map((s) => s.trim());
      if (!rhsStr) return null;

      const compiled = ceCompile(`(${lhsStr}) - (${rhsStr})`);
      if (!compiled) return null;

      const zeroScope: Record<string, number> = {};
      for (const v of varList) zeroScope[v] = 0;

      const base = compiled(zeroScope);
      if (!isFinite(base)) return null;

      const row: number[] = [];
      for (let j = 0; j < n; j++) {
        const scope: Record<string, number> = { ...zeroScope, [varList[j]]: 1 };
        const sample = compiled(scope);
        if (!isFinite(sample)) return null;
        row.push(sample - base);
      }

      A.push(row);
      b.push(-base);
    }

    // Gaussian elimination
    const augmented = A.map((row, i) => [...row, b[i]]);
    for (let col = 0; col < n; col++) {
      // Partial pivoting
      let maxRow = col;
      for (let row = col + 1; row < augmented.length; row++) {
        if (Math.abs(augmented[row][col]) > Math.abs(augmented[maxRow][col])) {
          maxRow = row;
        }
      }
      [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]];

      const pivot = augmented[col][col];
      if (Math.abs(pivot) < 1e-12) continue;

      for (let row = 0; row < augmented.length; row++) {
        if (row === col) continue;
        const factor = augmented[row][col] / pivot;
        for (let j = col; j <= n; j++) {
          augmented[row][j] -= factor * augmented[col][j];
        }
      }
    }

    // Extract solution
    const solution: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      const pivot = augmented[i][i];
      if (Math.abs(pivot) < 1e-12) return null;
      const val = augmented[i][n] / pivot;
      solution[varList[i]] = Math.round(val * 1e8) / 1e8;
      steps.push(`${varList[i]} = ${solution[varList[i]]}`);
    }

    return { solution, steps };
  } catch {
    return null;
  }
}
