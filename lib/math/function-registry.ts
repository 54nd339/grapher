import { getCE, normalizeLatexInput } from "@/lib/latex";

/**
 * Registry for user-defined named functions like f(x) = x^2 + 2x.
 *
 * CE parses f(x) as InvisibleOperator("f","x") — i.e. f*x.
 * Working at the MathJSON level lets us reliably detect and expand
 * function definitions/references without fragile regex on LaTeX strings.
 */

interface FunctionDef {
  name: string;
  param: string;
  bodyJson: unknown;
}

const FUNC_NAME_RE = /^[a-hj-wA-HJ-W]$/;

const registry = new Map<string, FunctionDef>();
let version = 0;

function unwrapDelimiter(node: unknown): unknown {
  if (Array.isArray(node) && node[0] === "Delimiter" && node.length >= 2) {
    return node[1];
  }
  return node;
}

/**
 * Extract {name, param} from a MathJSON LHS that represents a function call.
 * CE produces different shapes depending on the letter:
 *   f(x) → ["InvisibleOperator", "f", "x"]   (most letters)
 *   g(x) → ["g", "x"]                         (direct call head)
 *   g(x) → ["Apply", "g", "x"]                (Apply wrapper)
 */
function extractFuncCall(lhs: unknown): { name: string; param: string } | null {
  if (!Array.isArray(lhs) || lhs.length < 2) return null;
  const head = lhs[0];
  if (typeof head !== "string") return null;

  let name: unknown;
  let param: unknown;

  if ((head === "InvisibleOperator" || head === "Multiply") && lhs.length === 3) {
    name = lhs[1];
    param = lhs[2];
  } else if (head === "Apply" && lhs.length >= 3) {
    name = lhs[1];
    param = lhs[2];
  } else if (FUNC_NAME_RE.test(head) && lhs.length === 2) {
    name = head;
    param = lhs[1];
  } else {
    return null;
  }

  if (typeof name !== "string" || !FUNC_NAME_RE.test(name)) return null;
  const normalizedParam = unwrapDelimiter(param);
  if (typeof normalizedParam !== "string" || normalizedParam.length !== 1) return null;
  return { name, param: normalizedParam };
}

/**
 * Detect a function definition from LaTeX via CE's MathJSON.
 */
export function parseFuncDef(latex: string): FunctionDef | null {
  try {
    const normalizedLatex = normalizeLatexInput(latex);
    const json = getCE().parse(normalizedLatex).json;
    if (!Array.isArray(json) || json[0] !== "Equal") return null;

    const call = extractFuncCall(json[1]);
    if (!call) return null;

    return { name: call.name, param: call.param, bodyJson: json[2] };
  } catch {
    return null;
  }
}

export function rebuildRegistry(expressions: { latex: string }[]): void {
  registry.clear();
  for (const expr of expressions) {
    if (!expr.latex) continue;
    const def = parseFuncDef(expr.latex);
    if (def) registry.set(def.name, def);
  }
  version++;
}

export function getRegistryVersion(): number {
  return version;
}

/**
 * Expand function references in a MathJSON expression tree.
 * Replaces InvisibleOperator("f", arg) with the body of f,
 * substituting the formal parameter with the actual argument.
 */
export function expandFunctionRefs(json: unknown): unknown {
  if (registry.size === 0) return json;
  return expand(json, new Set<string>());
}

function expand(json: unknown, resolving: Set<string>): unknown {
  if (typeof json !== "object" || json === null || !Array.isArray(json)) return json;
  if (json.length === 0) return json;

  const [head, ...args] = json;
  if (typeof head !== "string") return json;

  // Pattern 1: ["InvisibleOperator"/"Multiply", "f", arg]
  if (
    (head === "InvisibleOperator" || head === "Multiply") &&
    args.length === 2 &&
    typeof args[0] === "string" &&
    registry.has(args[0])
  ) {
    const fnName = args[0];
    if (resolving.has(fnName)) return [head, ...args];
    const def = registry.get(fnName)!;
    const expandedArg = unwrapDelimiter(expand(args[1], resolving));
    const nextResolving = new Set(resolving);
    nextResolving.add(fnName);
    return expand(substituteVar(def.bodyJson, def.param, expandedArg), nextResolving);
  }

  // Pattern 2: ["Apply", "g", arg]
  if (head === "Apply" && args.length >= 2 && typeof args[0] === "string" && registry.has(args[0])) {
    const fnName = args[0];
    if (resolving.has(fnName)) return [head, ...args];
    const def = registry.get(fnName)!;
    const expandedArg = unwrapDelimiter(expand(args[1], resolving));
    const nextResolving = new Set(resolving);
    nextResolving.add(fnName);
    return expand(substituteVar(def.bodyJson, def.param, expandedArg), nextResolving);
  }

  // Pattern 3: ["g", arg] — direct call where head IS the function name
  if (registry.has(head) && args.length === 1) {
    if (resolving.has(head)) return [head, ...args];
    const def = registry.get(head)!;
    const expandedArg = unwrapDelimiter(expand(args[0], resolving));
    const nextResolving = new Set(resolving);
    nextResolving.add(head);
    return expand(substituteVar(def.bodyJson, def.param, expandedArg), nextResolving);
  }

  return [head, ...args.map((a) => expand(a, resolving))];
}

function substituteVar(
  json: unknown,
  varName: string,
  replacement: unknown,
): unknown {
  if (typeof json === "number") return json;
  if (typeof json === "string") return json === varName ? replacement : json;

  if (typeof json === "object" && json !== null) {
    if (!Array.isArray(json)) {
      if ("sym" in json && (json as Record<string, unknown>).sym === varName)
        return replacement;
      return json;
    }
    if (json.length === 0) return json;
    return [json[0], ...json.slice(1).map((a) => substituteVar(a, varName, replacement))];
  }

  return json;
}
