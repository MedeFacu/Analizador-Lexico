import { ERROR_MESSAGES } from "./grammar.js";
import { TokenType } from "./tokenTypes.js";
import { RELATIONAL_OPS, MULTI_OPS, SINGLE_OPS } from "./grammar.js";
class Parser {
  constructor(tokens) {
    this.tokens = tokens.filter(t => t.type !== TokenType.COMMENT);
    this.index = 0; 
    this.lookahead = this.tokens[this.index] || null; 
  }

  nextToken() {
    this.index++; 
    if (this.index < this.tokens.length) { 
      this.lookahead = this.tokens[this.index];
    } else {
      this.lookahead = null;
    }
  }

  match(expected, isType = false) {
    if (!this.lookahead) {
      throw new SyntaxError(`Se esperaba ${expected} pero se alcanzó el final del archivo`);
    }
    
    const matched = isType 
      ? this.lookahead.type === expected 
      : this.lookahead.lexeme === expected;
    
    if (matched) {
      const token = this.lookahead;
      this.nextToken();
      return token;
    } else {
      let errorMsg;
      if (isType) {
        errorMsg = `Se esperaba ${expected} pero se encontró ${this.lookahead.type}`;
      } else {
        errorMsg = `Se esperaba '${expected}' pero se encontró '${this.lookahead.lexeme}'`;
      }
      throw new SyntaxError(`${errorMsg} en línea ${this.lookahead.line}, columna ${this.lookahead.col}`);
    }
  }

  parse() {
    const ast = this.program();
    if (this.lookahead && this.lookahead.type !== TokenType.EOF) {
      throw new SyntaxError(`Tokens sobrantes después de EOF en línea ${this.lookahead.line}`);
    }
    return ast; 
  }

  program() {
    return { type: 'Program', body: this.declFunList() };
  }

  declFunList() {
    const list = [];
    while (this.lookahead && this.lookahead.type === TokenType.TYPE) {
      list.push(this.declFun());
    }
    return list; 
  }

  declFun() {
    const typeToken = this.type();
    const idToken = this.match(TokenType.ID, true);
    if (this.lookahead && this.lookahead.lexeme === '(') {
      this.match('(');
      const params = this.paramListOpt();
      this.match(')');
      const body = this.block();
      return { type: 'FunctionDef', returnType: typeToken.lexeme, name: idToken.lexeme, params, body };
    } else {
      const arr = this.arrOpt();
      const tail = this.declTail();
      return { type: 'Declaration', varType: typeToken.lexeme, name: idToken.lexeme, arrayDims: arr, init: tail };
    }
  }

  type() {
    return this.match(TokenType.TYPE, true);
  }

  arrOpt() {
    const dims = [];
    while (this.lookahead && this.lookahead.lexeme === '[') {
      this.match('[');
      const size = this.match(TokenType.NUM, true).lexeme;
      this.match(']');
      dims.push(size);
    }
    return dims; 
  }

  declTail() {
    if (this.lookahead && this.lookahead.lexeme === '=') {
      this.match('=');
      const expr = this.expr();
      this.match(';');
      return expr;
    } else {
      this.match(';');
      return null; 
    }
  }

  paramListOpt() {
    if (this.lookahead && this.lookahead.type === TokenType.TYPE) {
      return this.paramList();
    }
    return []; 
  }

  paramList() {
    const params = [this.param()];
    while (this.lookahead && this.lookahead.lexeme === ',') {
      this.match(',');
      params.push(this.param());
    }
    return params;
  }

  param() {
    const typeToken = this.type();
    const idToken = this.match(TokenType.ID, true);
    const arr = this.arrOpt();
    return { type: typeToken.lexeme, name: idToken.lexeme, arrayDims: arr };
  }

  block() {
    this.match('{');
    const stmts = this.stmtList();
    this.match('}');
    return { type: 'Block', statements: stmts };
  }

  stmtList() {
    const list = [];
    while (this.lookahead && this.lookahead.type !== TokenType.EOF && this.lookahead.lexeme !== '}') {
      list.push(this.stmt());
    }
    return list;
  }

  stmt() {
    if (!this.lookahead) throw new SyntaxError('Statement inesperado: EOF prematuro');
    switch (this.lookahead.lexeme) {
      case '{': return this.block();
      case 'if': return this.ifStmt();
      case 'while': return this.whileStmt();
      case 'for': return this.forStmt();
      case 'return': return this.returnStmt();
      case 'break': return this.breakStmt();
      case 'continue': return this.continueStmt();
      default:
        if (this.lookahead.type === TokenType.TYPE) {
          return this.declFun(); 
        } else {
          return this.exprStmt();
        }
    }
  }

  exprStmt() {
    if (this.lookahead.lexeme === ';') {
      this.match(';');
      return { type: 'EmptyStmt' };
    } else {
      const expr = this.expr();
      this.match(';');
      return { type: 'ExprStmt', expr };
    }
  }

  ifStmt() {
  this.match('if');
  this.match('(');
  const condStart = this.lookahead;
  const cond = this.boolExpr();

  if (cond.exprType && cond.exprType !== 'boolean') {
    const line = condStart ? condStart.line : this.lookahead?.line;
    const col  = condStart ? condStart.col  : this.lookahead?.col;

    throw new SyntaxError(
      `Se esperaba una expresion booleana` + `en línea ${line}, columna ${col}`
    );
  }

  this.match(')');
  const thenStmt = this.stmt();
  let elseStmt = null;
  if (this.lookahead && this.lookahead.lexeme === 'else') {
    this.match('else');
    elseStmt = this.stmt();
  }
  return { type: 'IfStmt', condition: cond, then: thenStmt, else: elseStmt };
}



  whileStmt() {
  this.match('while');
  this.match('(');

  const condStart = this.lookahead;  
  const cond = this.boolExpr();

  if (cond.exprType && cond.exprType !== 'boolean') {
    const line = condStart ? condStart.line : this.lookahead?.line;
    const col  = condStart ? condStart.col  : this.lookahead?.col;

    throw new SyntaxError(
      `Se esperaba una expresion booleana` + `en línea ${line}, columna ${col}`
    );
  }

  this.match(')');
  const body = this.stmt();
  return { type: 'WhileStmt', condition: cond, body };
}


  forStmt() {
    this.match('for');
    this.match('(');
    const init = this.forInit();
    this.match(';');
    const cond = this.forCond();
    this.match(';');
    const iter = this.forIter();
    this.match(')');
    const body = this.stmt();
    return { type: 'ForStmt', init, cond, iter, body };
  }

  forInit() {
    if (this.lookahead.lexeme === ';') return null;
    return this.expr();
  }

  forCond() {
  if (this.lookahead.lexeme === ';') return null;

  const condStart = this.lookahead;
  const cond = this.boolExpr();

  if (cond.exprType && cond.exprType !== 'boolean') {
    const line = condStart ? condStart.line : this.lookahead?.line;
    const col  = condStart ? condStart.col  : this.lookahead?.col;

    throw new SyntaxError(
    `Se esperaba una expresion booleana` + `en línea ${line}, columna ${col}`  
    );
  }

  return cond;
}



  forIter() {
    if (this.lookahead.lexeme === ')') return null;
    return this.expr();
  }

  returnStmt() {
    this.match('return');
    let expr = null;
    if (this.lookahead.lexeme !== ';') {
      expr = this.expr();
    }
    this.match(';');
    return { type: 'ReturnStmt', value: expr };
  }

  breakStmt() {
    this.match('break');
    this.match(';');
    return { type: 'BreakStmt' };
  }

  continueStmt() {
    this.match('continue');
    this.match(';');
    return { type: 'ContinueStmt' };
  }

  boolExpr() {
    let expr = this.logOr();
    return expr;
  }

  expr() {
    return this.assign();
  }

  assign() {
    const left = this.boolExpr();
    if (this.lookahead && isAssignmentOp(this.lookahead.lexeme)) {
      const op = this.lookahead.lexeme;
      this.nextToken();
      const right = this.expr();
      return { type: 'Assign', left, right, op };
    }
    return left;
  }


equality() {
  let expr = this.relational();
  while (this.lookahead && 
         this.lookahead.type === TokenType.BOOL_OP &&  
         ['==', '!='].includes(this.lookahead.lexeme)) {
    const op = this.lookahead.lexeme;
    this.nextToken();
    const right = this.relational();
    expr = { type: 'Binary', left: expr, op, right, exprType: 'boolean' };
  }
  return expr;
}

relational() {
  let expr = this.additive();
  while (this.lookahead && 
         this.lookahead.type === TokenType.BOOL_OP && 
         ['<', '>', '<=', '>='].includes(this.lookahead.lexeme)) {
    const op = this.lookahead.lexeme;
    this.nextToken();
    const right = this.additive();
    expr = { type: 'Binary', left: expr, op, right, exprType: 'boolean' };
  }
  return expr;
}

logOr() {
  let expr = this.logAnd();
  while (this.lookahead && 
         this.lookahead.type === TokenType.BOOL_OP &&  
         this.lookahead.lexeme === '||') {
    const op = this.match('||');
    const right = this.logAnd();
    expr = { type: 'Binary', left: expr, op: op.lexeme, right, exprType: 'boolean' };
  }
  return expr;
}

logAnd() {
  let expr = this.equality();
  while (this.lookahead && 
         this.lookahead.type === TokenType.BOOL_OP &&  
         this.lookahead.lexeme === '&&') {
    const op = this.match('&&');
    const right = this.equality();
    expr = { type: 'Binary', left: expr, op: op.lexeme, right, exprType: 'boolean' };
  }
  return expr;
}
  additive() {
    let expr = this.multiplicative();
    while (this.lookahead && isArithmeticOp(this.lookahead.lexeme) && ['+', '-'].includes(this.lookahead.lexeme)) {
      const op = this.lookahead.lexeme;
      this.nextToken();
      const right = this.multiplicative();
      expr = { type: 'Binary', left: expr, op, right, exprType: 'arithmetic' };
    }
    return expr;
  }

  multiplicative() {
    let expr = this.unary();
    while (this.lookahead && isArithmeticOp(this.lookahead.lexeme) && ['*', '/', '%'].includes(this.lookahead.lexeme)) {
      const op = this.lookahead.lexeme;
      this.nextToken();
      const right = this.unary();
      expr = { type: 'Binary', left: expr, op, right, exprType: 'arithmetic' };
    }
    return expr;
  }

  unary() {
    if (this.lookahead && isUnaryOp(this.lookahead.lexeme)) {
      const op = this.lookahead.lexeme;
      this.nextToken();
      const right = this.unary();
      const exprType = op === '!' ? 'boolean' : 'arithmetic';
      return { type: 'Unary', op, right, exprType };
    }
    return this.primary();
  }

  primary() {
    if (this.lookahead.type === TokenType.NUM) {
      const token = this.match(TokenType.NUM, true);
      return { type: 'Literal', value: token.lexeme, exprType: 'arithmetic' };
    } else if (this.lookahead.type === TokenType.ID) {
      const id = this.match(TokenType.ID, true).lexeme;
      const arr = this.arrAccess();
      const call = this.callOpt();
      if (call) {
        return { type: 'Call', name: id, args: call, arrayAccess: arr, exprType: 'unknown' };
      } else {
        return { type: 'Variable', name: id, arrayAccess: arr, exprType: 'unknown' };
      }
    } else if (this.lookahead.lexeme === '(') {
      this.match('(');
      const expr = this.expr();
      this.match(')');
      return expr;
    } else if (this.lookahead.lexeme === 'true' || this.lookahead.lexeme === 'false') {
      const value = this.lookahead.lexeme;
      this.nextToken();
      return { type: 'Literal', value, exprType: 'boolean' };
    } else {
      throw new SyntaxError(`Expresión primaria inesperada: ${this.lookahead.lexeme} en línea ${this.lookahead.line}`);
    }
  }

  arrAccess() {
    const accesses = [];
    while (this.lookahead && this.lookahead.lexeme === '[') {
      this.match('[');
      accesses.push(this.expr());
      this.match(']');
    }
    return accesses; 
  }

  callOpt() {
    if (this.lookahead && this.lookahead.lexeme === '(') {
      this.match('(');
      const args = this.argList();
      this.match(')');
      return args;
    }
    return null; 
  }

  argList() {
    const args = [];
    if (this.lookahead.lexeme !== ')') {
      args.push(this.expr());
      while (this.lookahead && this.lookahead.lexeme === ',') {
        this.match(',');
        args.push(this.expr());
      }
    }
    return args;
  }
}

function isRelationalOp(op) {
  return RELATIONAL_OPS.includes(op) || ['<=', '>='].includes(op);
}

function isArithmeticOp(op) {
  return ['+', '-', '*', '/', '%'].includes(op); 
}

function isAssignmentOp(op) {
  return op === '='; 
}

function isUnaryOp(op) {
  return ['!', '-'].includes(op); 
}

function isLogicalOp(op) {
  return ['&&', '||'].includes(op); 
}

export { Parser };
