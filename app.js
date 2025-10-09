import { lex } from "./lexer.js";

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

analyzeBtn.addEventListener("click", () => {
  const tokens = lex(sourceEl.value);
  const errores = tokens.filter(t => t.type === "ERROR");

  if (errores.length > 0) {
    errorBox.textContent = `Error léxico en línea ${errores[0].line}, columna ${errores[0].col}: ${errores[0].lexeme}`;
    errorBox.style.display = "block";
    tbody.innerHTML = "";
    return;
  }

  errorBox.style.display = "none";
  renderTokens(tokens);
});

clearBtn.addEventListener("click", () => {
  sourceEl.value = "";
  tbody.innerHTML = "";
  errorBox.style.display = "none";
});
