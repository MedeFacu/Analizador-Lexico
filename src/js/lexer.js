import { 
  KEYWORDS, TYPES, isLetter, isDigit, isIdChar, 
  RELATIONAL_OPS,  
  MULTI_OPS,      
  SINGLE_OPS,      
  DELIMITERS, ERROR_MESSAGES
} from "./grammar.js";
import { TokenType } from "./tokenTypes.js"; 

export function lex(input) {
  const tokens = [];
  let i = 0, line = 1, col = 1;

  const push = (type, lexeme, l, c, customMessage = null) => {
    let message = lexeme;
    if (customMessage) {
      message = customMessage;
    }
    tokens.push({ type, lexeme, line: l, col: c, message });
  };

  const advance = () => {
    const ch = input[i++];
    if (ch === "\n") { line++; col = 1; } else { col++; }
    return ch;
  };

  const peek = (k = 0) => input[i + k] ?? "";

  while (i < input.length) {
    const startLine = line, startCol = col;
    let ch = peek();

    if (/\s/.test(ch)) { advance(); continue; }

    if (ch === "/" && peek(1) === "/") {
      let lexeme = "";
      advance(); advance(); 
      lexeme = "//";
      
      while (i < input.length && peek() !== "\n") {
        lexeme += advance();
      }
      
      push(TokenType.COMMENT, lexeme, startLine, startCol);
      continue;
    }

    if (isLetter(ch)) {
      let lexeme = "";
      while (isIdChar(peek())) lexeme += advance();
      if (lexeme.length === 0) lexeme = advance();
      
      if (KEYWORDS.has(lexeme)) {
        if (TYPES.has(lexeme)) {
          push(TokenType.TYPE, lexeme, startLine, startCol);
        } else {
          push(TokenType.KEYWORD, lexeme, startLine, startCol);
        }
      } else {
        if (/^[0-9]/.test(lexeme)) {
          push(TokenType.ERROR, lexeme, startLine, startCol, ERROR_MESSAGES.INVALID_IDENTIFIER(lexeme));
        } else {
          push(TokenType.ID, lexeme, startLine, startCol);
        }
      }
      continue;
    }

    if (isDigit(ch)) {
      let lexeme = "";
      while (isDigit(peek())) lexeme += advance();
      if (lexeme.length === 0) lexeme = advance();
      
      if (isLetter(peek())) {
        let invalidNum = lexeme;
        while (isIdChar(peek())) invalidNum += advance();
        push(TokenType.ERROR, invalidNum, startLine, startCol, ERROR_MESSAGES.INVALID_NUMBER(invalidNum));
      } else {
        push(TokenType.NUM, lexeme, startLine, startCol);
      }
      continue;
    }

    const twoChar = ch + peek(1);
    
    if (MULTI_OPS.includes(twoChar)) {
      advance(); advance();
      push(TokenType.BOOL_OP, twoChar, startLine, startCol); 
      continue;
    }
    
    if (RELATIONAL_OPS.includes(ch)) {
      advance();
      push(TokenType.BOOL_OP, ch, startLine, startCol); 
      continue;
    }
    
    if (SINGLE_OPS.includes(ch)) {
      advance();
      push(TokenType.OP, ch, startLine, startCol);
      continue;
    }

    if (DELIMITERS.includes(ch)) {
      advance();
      push(TokenType.DELIM, ch, startLine, startCol);
      continue;
    }

    const invalidChar = advance();
    push(TokenType.ERROR, invalidChar, startLine, startCol, ERROR_MESSAGES.INVALID_SYMBOL(invalidChar));
  }

  push(TokenType.EOF, "EOF", line, col);

  return tokens;
}
