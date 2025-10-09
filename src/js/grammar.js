export const KEYWORDS = new Set([
  "int", "bool", "void", "if", "else", "while", "for", "return", "break", "continue",
]);

export const TYPES = new Set(["int", "bool", "void"]);

export const ERROR_MESSAGES = {
  INVALID_SYMBOL: (symbol) => `Símbolo no reconocido: '${symbol}'`,
  UNEXPECTED_CHARACTER: (char) => `Carácter inesperado: '${char}'`,
  INVALID_IDENTIFIER: (id) => `Identificador no válido: '${id}' - debe comenzar con letra`,
  INVALID_NUMBER: (num) => `Formato de número no válido: '${num}'`,
  UNCLOSED_COMMENT: () => 'Comentario sin cerrar',
  UNKNOWN_OPERATOR: (op) => `Operador desconocido: '${op}'`,
  UNMATCHED_DELIMITER: (delim) => `Delimitador sin coincidencia: '${delim}'`,
  INVALID_TYPE: (type) => `Tipo de dato no válido: '${type}' - use int, bool o void`,
  MISSING_SEMICOLON: () => 'Se esperaba ;',
  MISSING_PARENTHESIS: () => 'Se esperaba )',
  MISSING_BRACE: () => 'Se esperaba }',
  MISSING_BRACKET: () => 'Se esperaba ]'
};

// Gramática según el PDF
export const GRAMMAR_RULES = {
  // Programa
  Program: ['DeciFunList EOF'],
  
  // Declaraciones y funciones
  DeciFunList: ['DeciFun DeciFunList', 'ε'],
  DeciFun: ['Deci', 'FunDef'],
  Decl: ['Type ID ArrOpt DeciTail'],
  DeciTail: ['Expf', '💡'], // 💡 probablemente significa asignación
  ArrOpt: ["'[' NUM ']' ArrOpt", 'ε'],
  FunDef: ["Type ID '(' ParamListOpt ')' Block"],
  ParamListOpt: ['ParamList', 'ε'],
  ParamList: ['Param ParamListTail'],
  ParamListTail: ["',' Param ParamListTail", 'ε'],
  Param: ['Type ID ArrOpt'],
  Type: ['int', 'bool', 'void'],
  
  // Bloques y statements
  Block: ["'{' StmtList '}'"],
  StmtList: ['Stmt StmtList', 'ε'],
  Stmt: [
    'Block',
    'Decl', 
    'ExprStmt',
    'IfStmt',
    'WhileStmt',
    'ForStmt',
    'ReturnStmt',
    'BreakStmt',
    'ContinueStmt'
  ],
  
  // Statements específicos
  ExprStmt: ['Expr;', ';'], // Expr↗ probablemente significa expresión con ;
  IfStmt: ["if '(' Expr ')' Stmt ElseOpt"],
  ElseOpt: ['else Stmt', 'ε'],
  WhileStmt: ["while '(' Expr ')' Stmt"],
  ForStmt: ["for '(' ForInit ';' ForCond ';' ForIter ')' Stmt"],
  ForInit: ['Expr', 'ε'],
  ForCond: ['Expr', 'ε'],
  ForIter: ['Expr', 'ε'],
  
  // Return y control
  ReturnStmt: ["return Expr ';'", "return ';'"],
  BreakStmt: ["break ';'"],
  ContinueStmt: ["continue ';'"]
};

// Funciones de validación
export function isLetter(ch) {
  return /[A-Za-z_]/.test(ch);
}

export function isDigit(ch) {
  return /[0-9]/.test(ch);
}

export function isIdChar(ch) {
  return /[A-Za-z0-9_]/.test(ch);
}

export function isValidType(type) {
  return TYPES.has(type);
}

export function isValidKeyword(word) {
  return KEYWORDS.has(word);
}

// Operadores y delimitadores
export const MULTI_OPS = ["==", "!=", "<=", ">=", "&&", "||"];
export const SINGLE_OPS = ["=", "<", ">", "+", "-", "*", "/", "%", "!"];
export const DELIMITERS = [";", ",", "(", ")", "{", "}", "[", "]"];