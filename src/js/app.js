import { lex } from "./lexer.js";
import { Parser } from "./Parser.js";

const sourceEl = document.getElementById("source");
const analyzeBtn = document.getElementById("analyze");
const clearBtn = document.getElementById("clear");
const tbody = document.querySelector("#tokens tbody");
const errorBox = document.getElementById("errorBox");

function renderTokens(tokens) {
  tbody.innerHTML = "";
  tokens.forEach((t, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${t.type}</td>
      <td>${t.lexeme}</td>
      <td>${t.line}</td>
      <td>${t.col}</td>
    `;
    tbody.appendChild(tr);
  });
}

function showMessage(type, title, message) {
  const backgroundColor = type === 'success' ? '#4CAF50' : '#ff6b6b';
  
  const messageDiv = document.createElement('div');
  messageDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: ${backgroundColor};
    color: white;
    padding: 20px 30px;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    z-index: 1000;
    font-family: Arial, sans-serif;
    text-align: center;
    min-width: 300px;
  `;
  
  const icon = type === 'success' ? '✅' : '❌';
  
  messageDiv.innerHTML = `
    <h3 style="margin: 0 0 10px 0;">${icon} ${title}</h3>
    <p style="margin: 0;">${message}</p>
    <button class="closeMessage" style="
      margin-top: 15px;
      background: white;
      color: ${backgroundColor};
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    ">Cerrar</button>
  `;
  
  document.body.appendChild(messageDiv);
  
  messageDiv.querySelector('.closeMessage').addEventListener('click', function() {
    document.body.removeChild(messageDiv);
  });
  
  setTimeout(() => {
    if (document.body.contains(messageDiv)) {
      document.body.removeChild(messageDiv);
    }
  }, 3000);
}

analyzeBtn.addEventListener("click", () => {
  const tokens = lex(sourceEl.value);
  const errores = tokens.filter(t => t.type === "ERROR");

  if (errores.length > 0) {
    showMessage(
      'error', 
      'Error Léxico', 
      `Error en línea ${errores[0].line}, columna ${errores[0].col}: ${errores[0].lexeme}`
    );
    errorBox.style.display = "none";
    tbody.innerHTML = "";
    return;
  }

  try {
    const parser = new Parser(tokens);
    const ast = parser.parse();
    
    console.log("AST generado:", ast);
    errorBox.style.display = "none";
    renderTokens(tokens);
    
    showMessage('success', 'Análisis Completado', 'El código pasó ambos analizadores exitosamente');
    
  } catch (e) {
    showMessage('error', 'Error Sintáctico', e.message);
    errorBox.style.display = "none";
    tbody.innerHTML = "";
  }
});

clearBtn.addEventListener("click", () => {
  sourceEl.value = "";
  tbody.innerHTML = "";
  errorBox.style.display = "none";
});
