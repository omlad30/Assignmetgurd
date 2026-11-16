/**
 * Code Tokenizer & AST Normalizer for AssignGuard
 * Inspired by Stanford MOSS (Measure of Software Similarity).
 * Detects programming code, strips comments, and normalizes identifiers
 * to expose structural plagiarism even when students rename all variables.
 */

const RESERVED_KEYWORDS = new Set([
  // Python
  'def', 'class', 'import', 'from', 'as', 'if', 'elif', 'else', 'for', 'while', 'in', 'return',
  'yield', 'try', 'except', 'finally', 'raise', 'with', 'lambda', 'pass', 'break', 'continue',
  'and', 'or', 'not', 'is', 'None', 'True', 'False', 'self',
  // C / C++ / Java
  'int', 'float', 'double', 'char', 'void', 'long', 'short', 'bool', 'boolean', 'unsigned', 'signed',
  'public', 'private', 'protected', 'static', 'final', 'const', 'virtual', 'override', 'struct', 'enum',
  'new', 'delete', 'sizeof', 'typedef', 'include', 'main', 'printf', 'scanf', 'cout', 'cin', 'endl',
  'switch', 'case', 'default', 'do', 'goto',
  // JavaScript / TypeScript
  'function', 'var', 'let', 'const', 'async', 'await', 'export', 'require', 'typeof', 'instanceof',
  'null', 'undefined', 'this', 'throw', 'catch'
]);

/**
 * Checks if a file or text is source code
 */
const isCodeContent = (text, mimetype = '', filename = '') => {
  if (filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (['py', 'java', 'c', 'cpp', 'cc', 'h', 'hpp', 'js', 'jsx', 'ts', 'tsx'].includes(ext)) {
      return true;
    }
  }

  if (mimetype && (mimetype.includes('javascript') || mimetype.includes('x-python') || mimetype.includes('x-c'))) {
    return true;
  }

  // Heuristic density check for programming syntax
  const codeIndicators = (text.match(/(\bdef\b|\bclass\b|\bfunction\b|#include|\bimport\b|\bpublic\s+class\b|console\.log|System\.out|;\s*$)/gm) || []).length;
  return codeIndicators >= 3;
};

/**
 * Normalizes code: strips comments, literals, and normalizes variable/function identifiers
 */
const normalizeCode = (rawCode) => {
  if (!rawCode || typeof rawCode !== 'string') return '';

  let code = rawCode;

  // 1. Strip multi-line comments: /* ... */ and """ ... """
  code = code.replace(/\/\*[\s\S]*?\*\//g, ' ');
  code = code.replace(/'''[\s\S]*?'''/g, ' ');
  code = code.replace(/"""[\s\S]*?"""/g, ' ');

  // 2. Strip single-line comments: // and #
  code = code.replace(/\/\/.*$/gm, ' ');
  code = code.replace(/#.*$/gm, ' ');

  // 3. Normalize string and char literals
  code = code.replace(/"([^"\\]|\\.)*"/g, ' "STR" ');
  code = code.replace(/'([^'\\]|\\.)*'/g, ' "STR" ');

  // 4. Normalize numeric constants
  code = code.replace(/\b\d+(\.\d+)?\b/g, ' NUM ');

  // 5. Tokenize identifiers and keywords
  const identifierMap = new Map();
  let idCounter = 0;

  // Match words / identifiers
  const tokenized = code.replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g, (token) => {
    // If it's a known language keyword or built-in, keep it intact
    if (RESERVED_KEYWORDS.has(token) || token === 'STR' || token === 'NUM') {
      return token;
    }

    // Map custom variable/function name to generic sequence (v0, v1, v2...)
    if (!identifierMap.has(token)) {
      identifierMap.set(token, `v${idCounter++}`);
    }
    return identifierMap.get(token);
  });

  // 6. Clean whitespace and operators
  return tokenized.replace(/\s+/g, ' ').trim();
};

module.exports = {
  isCodeContent,
  normalizeCode
};
