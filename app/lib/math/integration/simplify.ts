import { NerdamerInstance } from './types';
import { tidySymbolicString } from './utils';

// Basic trig/algebra identities replacements on a flattened string
type Replacement = { pattern: RegExp; replace: (input: string) => string };

const REPLACEMENTS: Replacement[] = [
  {
    pattern: /sin\(([^)]+)\)\^2\+cos\(([^)]+)\)\^2/g,
    replace: (s: string) => {
      const m = /sin\(([^)]+)\)\^2\+cos\(([^)]+)\)\^2/.exec(s);
      if (m && m[1] === m[2]) return '1';
      return s;
    }
  },
  {
    pattern: /cos\(([^)]+)\)\^2\+sin\(([^)]+)\)\^2/g,
    replace: (s: string) => {
      const m = /cos\(([^)]+)\)\^2\+sin\(([^)]+)\)\^2/.exec(s);
      if (m && m[1] === m[2]) return '1';
      return s;
    }
  },
  { pattern: /1\+tan\(([^)]+)\)\^2/g, replace: (s: string) => s.replace(/1\+tan\(([^)]+)\)\^2/g, 'sec($1)^2') },
  { pattern: /1\+cot\(([^)]+)\)\^2/g, replace: (s: string) => s.replace(/1\+cot\(([^)]+)\)\^2/g, 'csc($1)^2') },
  { pattern: /sec\(([^)]+)\)\^2-1/g, replace: (s: string) => s.replace(/sec\(([^)]+)\)\^2-1/g, 'tan($1)^2') },
  { pattern: /csc\(([^)]+)\)\^2-1/g, replace: (s: string) => s.replace(/csc\(([^)]+)\)\^2-1/g, 'cot($1)^2') },
  { pattern: /--/g, replace: (s: string) => s.replace(/--/g, '+') },
  { pattern: /\+-/g, replace: (s: string) => s.replace(/\+-/g, '-') },
  { pattern: /ln\(exp\(([^)]+)\)\)/g, replace: (s: string) => s.replace(/ln\(exp\(([^)]+)\)\)/g, '$1') },
  { pattern: /exp\(ln\(([^)]+)\)\)/g, replace: (s: string) => s.replace(/exp\(ln\(([^)]+)\)\)/g, '$1') },
];

export const applySimpleIdentities = (expr: string): string => {
  let out = expr;
  for (const r of REPLACEMENTS) {
    if (r.pattern.test(out)) {
      out = r.replace(out);
    }
  }
  return out;
};

export const fullSimplify = (expr: string, nerdamerInstance: NerdamerInstance): { simplified: string; latex?: string } => {
  let current = expr;
  if (nerdamerInstance) {
    try {
      let n = nerdamerInstance(expr);
      if (n.simplify) n = n.simplify();
      current = n.toString();
      // try factor then expand for canonicalization
      if (n.factor) current = n.factor().toString();
    } catch {
      // ignore
    }
  }
  current = applySimpleIdentities(current);
  current = tidySymbolicString(current);
  const latex = nerdamerInstance ? nerdamerInstance(current).toTeX?.() : undefined;
  return { simplified: current, latex };
};
