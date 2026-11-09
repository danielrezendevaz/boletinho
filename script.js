// Configuração fixa do estudante (não editável pela interface)
const CONFIG_ALUNO = {
  turma: "8B",
  numeroChamada: 7,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// Dados fictícios locais padrão do 8º Ano (Array de Objetos)
const dadosBoletimLocal = [
  { disciplina: "Língua Portuguesa", tri1: 82, tri2: "7,8", tri3: 85, faltas: [2, 1, 1] },
  { disciplina: "Matemática", tri1: 52, tri2: "5,8", tri3: null, faltas: [3, 2, 1] },
  { disciplina: "Ciências", tri1: "8,1", tri2: 76, tri3: 8.0, faltas: [1, 2, 0] },
  { disciplina: "História", tri1: 7.0, tri2: 84, tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Geografia", tri1: 68, tri2: 7.3, tri3: "7,9", faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 86, tri2: "8,1", tri3: 8.7, faltas: [1, 0, 0] },
  { disciplina: "Arte", tri1: 9.0, tri2: 92, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 95, tri2: 9.0, tri3: "9,4", faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 88, tri2: 9.1, tri3: 93, faltas: [1, 0, 1] },
  { disciplina: "Educação Financeira", tri1: 74, tri2: "7,8", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Estudo Orientado", tri1: 8.0, tri2: 83, tri3: "8,5", faltas: [0, 1, 0] },
  { disciplina: "Redação e Leitura", tri1: 62, tri2: "6,8", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 48, tri2: 5.6, tri3: "6,0", faltas: [2, 2, 1] },
  { disciplina: "Literatura Arte e Movimento", tri1: "7,7", tri2: 80, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Práticas Experimentais", tri1: 58, tri2: "6,2", tri3: 6.4, faltas: [1, 1, 1] }
];

// Estado global da aplicação mantido somente em memória
let dadosAtuais = [];
let pinSessao = "";
let modoEdicao = false;

// Normalização para dados antigos/locais existentes
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }
  if (typeof valor === "string") {
    valor = valor.replace(",", ".");
  }
  let numero = Number(valor);
  if (isNaN(numero)) {
    return null;
  }
  if (numero > 10 && numero <= 100) {
    numero = numero / 10;
  }
  if (numero >= 0 && numero <= 10) {
    return numero;
  }
  return null;
}

// Formatação visual da nota
function formatarExibicao(nota) {
  if (nota === null || nota === undefined) {
    return "—";
  }
  const n = Number(nota);
  if (isNaN(n)) return "—";
  return n.toFixed(1).replace(".", ",");
}

// Validação rigorosa para edições digitadas pelo aluno
function validarNotaEditada(valorTexto) {
  if (valorTexto === null || valorTexto === undefined) return { valido: true, valor: null };
  const textoLimpo = String(valorTexto).trim();
  if (textoLimpo === "") return { valido: true, valor: null };
  
  const textoComPonto = textoLimpo.replace(",", ".");
  const num = Number(textoComPonto);
  
  if (isNaN(num) || num < 0 || num > 10) {
    return { valido: false, valor: null };
  }
  return { valido: true, valor: num };
}

function validarFaltaEditada(valorTexto) {
  const textoLimpo = String(valorTexto).trim();
  if (textoLimpo === "") return { valido: false, valor: null };
  
  const num = Number(textoLimpo);
  if (!Number.isInteger(num) || num < 0) {
    return { valido: false, valor: null };
  }
  return { valido: true, valor: num };
}

// Função para realizar o Login via API
async function fazerLogin() {
  const pinInput = document.getElementById("pin-input");
  const msgStatus = document.getElementById("mensagem-status");
  const btnEntrar = document.getElementById("btn-entrar");
  
  const pinDigitado = pinInput.value.trim();
  if (!pinDigitado) {
    msgStatus.className = "status-msg status-erro";
    msgStatus.textContent = "Por favor, digite seu PIN.";
    return;
  }

  msgStatus.className = "status-msg status-info";
  msgStatus.textContent = "Conectando...";
  btnEntrar.disabled = true;

  try {
    const response = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinDigitado
      })
    });

    if (response.status === 401) {
      msgStatus.className = "status-msg status-erro";
      msgStatus.textContent = "Turma, chamada ou PIN inválidos.";
      btnEntrar.disabled = false;
      return;
    }

    if (response.status === 429) {
      msgStatus.className = "status-msg status-erro";
      msgStatus.textContent = "Muitas tentativas. Aguarde um minuto e tente novamente.";
      btnEntrar.disabled = false;
      return;
    }

    if (!response.ok) {
      throw new Error("Erro na requisição");
    }

    const resultado = await response.json();

    // PIN mantido somente na memória da sessão
    pinSessao = pinDigitado;
    pinInput.value = ""; // Limpa a caixa de entrada

    // Processa os dados retornados
    if (resultado.dados && Array.isArray(resultado.dados.disciplinas) && resultado.dados.disciplinas.length > 0) {
      dadosAtuais = JSON.parse(JSON.stringify(resultado.dados.disciplinas));
    } else {
      dadosAtuais = JSON.parse(JSON.stringify(dadosBoletimLocal));
    }

    // Exibe a tela principal do boletim
    document.getElementById("area-login").style.display = "none";
    document.getElementById("conteudo-boletim").style.display = "block";

    renderizarBoletim();

  } catch (erro) {
    msgStatus.className = "status-msg status-erro";
    msgStatus.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
    btnEntrar.disabled = false;
  }
}

// Renderização da Interface (Tabela e Cards)
function renderizarBoletim() {
  const tabelaCorpo = document.getElementById("tabela-corpo");
  tabelaCorpo.innerHTML = ""; // Limpeza antes da reconstrução

  let somaMedias = 0;
  let qtdDisciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let qtdBomDesempenho = 0;
  let qtdAtencao = 0;

  dadosAtuais.forEach((item, index) => {
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    const notasValidas = [n1, n2, n3].filter(n => n !== null);
    let media = null;
    let situacao = "Nota ainda não disponível";
    let classeSituacao = "situacao-indisponivel";

    if (notasValidas.length > 0) {
      const soma = notasValidas.reduce((acc, curr) => acc + curr, 0);
      media = soma / notasValidas.length;
      somaMedias += media;
      qtdDisciplinasComMedia++;

      if (media >= 6.0) {
        situacao = "Bom desempenho";
        classeSituacao = "situacao-bom";
        qtdBomDesempenho++;
      } else {
        situacao = "Atenção";
        classeSituacao = "situacao-atencao";
        qtdAtencao++;
      }
    }

    const arrFaltas = Array.isArray(item.faltas) ? item.faltas : [0, 0, 0];
    const totalFaltasDisciplina = arrFaltas.reduce((acc, curr) => acc + Number(curr || 0), 0);
    totalFaltasGeral += totalFaltasDisciplina;

    const linha = document.createElement("tr");

    if (!modoEdicao) {
      // Modo de Leitura
      const cellNome = document.createElement("td");
      const strongNome = document.createElement("strong");
      strongNome.textContent = item.disciplina;
      cellNome.appendChild(strongNome);

      const cellTri1 = document.createElement("td");
      cellTri1.textContent = formatarExibicao(n1);

      const cellTri2 = document.createElement("td");
      cellTri2.textContent = formatarExibicao(n2);

      const cellTri3 = document.createElement("td");
      cellTri3.textContent = formatarExibicao(n3);

      const cellMedia = document.createElement("td");
      const strongMedia = document.createElement("strong");
      strongMedia.textContent = formatarExibicao(media);
      cellMedia.appendChild(strongMedia);

      const cellFaltas = document.createElement("td");
      cellFaltas.textContent = totalFaltasDisciplina;

      const cellSit = document.createElement("td");
      cellSit.className = classeSituacao;
      cellSit.textContent = situacao;

      linha.appendChild(cellNome);
      linha.appendChild(cellTri1);
      linha.appendChild(cellTri2);
      linha.appendChild(cellTri3);
      linha.appendChild(cellMedia);
      linha.appendChild(cellFaltas);
      linha.appendChild(cellSit);
    } else {
      // Modo de Edição
      const cellNome = document.createElement("td");
      const strongNome = document.createElement("strong");
      strongNome.textContent = item.disciplina;
      cellNome.appendChild(strongNome);

      const v1 = n1 !== null ? String(n1).replace(".", ",") : "";
      const v2 = n2 !== null ? String(n2).replace(".", ",") : "";
      const v3 = n3 !== null ? String(n3).replace(".", ",") : "";

      const cellTri1 = document.createElement("td");
      cellTri1.innerHTML = `<input type="text" class="input-edicao" id="edit-tri1-${index}" value="${v1}">`;

      const cellTri2 = document.createElement("td");
      cellTri2.innerHTML = `<input type="text" class="input-edicao" id="edit-tri2-${index}" value="${v2}">`;

      const cellTri3 = document.createElement("td");
      cellTri3.innerHTML = `<input type="text" class="input-edicao" id="edit-tri3-${index}" value="${v3}">`;

      const cellMedia = document.createElement("td");
      cellMedia.innerHTML = `<strong>${formatarExibicao(media)}</strong>`;

      const f1 = arrFaltas[0] !== undefined ? arrFaltas[0] : 0;
      const f2 = arrFaltas[1] !== undefined ? arrFaltas[1] : 0;
      const f3 = arrFaltas[2] !== undefined ? arrFaltas[2] : 0;

      const cellFaltas = document.createElement("td");
      cellFaltas.innerHTML = `
        <div class="painel-faltas-edicao">
          <input type="text" class="input-edicao" id="edit-f1-${index}" value="${f1}" title="Faltas 1º Tri">
          <input type="text" class="input-edicao" id="edit-f2-${index}" value="${f2}" title="Faltas 2º Tri">
          <input type="text" class="input-edicao" id="edit-f3-${index}" value="${f3}" title="Faltas 3º Tri">
        </div>
      `;

      const cellSit = document.createElement("td");
      cellSit.className = classeSituacao;
      cellSit.textContent = situacao;

      linha.appendChild(cellNome);
      linha.appendChild(cellTri1);
      linha.appendChild(cellTri2);
      linha.appendChild(cellTri3);
      linha.appendChild(cellMedia);
      linha.appendChild(cellFaltas);
      linha.appendChild(cellSit);
    }

    tabelaCorpo.appendChild(linha);
  });

  // Atualiza os Cards de Resumo
  const mediaGeralGlobal = qtdDisciplinasComMedia > 0 ? (somaMedias / qtdDisciplinasComMedia).toFixed(1).replace(".", ",") : "—";
  
  document.getElementById("card-media-geral").textContent = mediaGeralGlobal;
  document.getElementById("card-total-faltas").textContent = totalFaltasGeral;
  document.getElementById("card-bom-desempenho").textContent = qtdBomDesempenho;
  document.getElementById("card-atencao").textContent = qtdAtencao;
}

// Alterna entre modo de visualização e edição / salva alterações
function alternarModoEdicao() {
  const btn = document.getElementById("btn-alternar-edicao");
  const msgSalvar = document.getElementById("mensagem-salvar");

  if (!modoEdicao) {
    modoEdicao = true;
    btn.textContent = "Salvar alterações";
    btn.className = "btn-salvar";
    msgSalvar.textContent = "";
    renderizarBoletim();
  } else {
    salvarAlteracoes();
  }
}

// Valida os dados digitados e envia para a API
async function salvarAlteracoes() {
  const msgSalvar = document.getElementById("mensagem-salvar");
  const btn = document.getElementById("btn-alternar-edicao");
  
  // Limpa classes de campos inválidos anteriores
  document.querySelectorAll(".input-edicao").forEach(el => el.classList.remove("input-invalido"));

  let possuiErros = false;
  const novasDisciplinas = [];

  for (let i = 0; i < dadosAtuais.length; i++) {
    const inputTri1 = document.getElementById(`edit-tri1-${i}`);
    const inputTri2 = document.getElementById(`edit-tri2-${i}`);
    const inputTri3 = document.getElementById(`edit-tri3-${i}`);

    const inputF1 = document.getElementById(`edit-f1-${i}`);
    const inputF2 = document.getElementById(`edit-f2-${i}`);
    const inputF3 = document.getElementById(`edit-f3-${i}`);

    const resT1 = validarNotaEditada(inputTri1.value);
    if (!resT1.valido) { inputTri1.classList.add("input-invalido"); possuiErros = true; }

    const resT2 = validarNotaEditada(inputTri2.value);
    if (!resT2.valido) { inputTri2.classList.add("input-invalido"); possuiErros = true; }

    const resT3 = validarNotaEditada(inputTri3.value);
    if (!resT3.valido) { inputTri3.classList.add("input-invalido"); possuiErros = true; }

    const resF1 = validarFaltaEditada(inputF1.value);
    if (!resF1.valido) { inputF1.classList.add("input-invalido"); possuiErros = true; }

    const resF2 = validarFaltaEditada(inputF2.value);
    if (!resF2.valido) { inputF2.classList.add("input-invalido"); possuiErros = true; }

    const resF3 = validarFaltaEditada(inputF3.value);
    if (!resF3.valido) { inputF3.classList.add("input-invalido"); possuiErros = true; }

    if (!possuiErros) {
      novasDisciplinas.push({
        disciplina: dadosAtuais[i].disciplina,
        tri1: resT1.valor,
        tri2: resT2.valor,
        tri3: resT3.valor,
        faltas: [resF1.valor, resF2.valor, resF3.valor]
      });
    }
  }

  if (possuiErros) {
    msgSalvar.className = "status-msg status-erro";
    msgSalvar.textContent = "Existem campos com valores inválidos. Corrija-os para salvar.";
    return;
  }

  msgSalvar.className = "status-msg status-info";
  msgSalvar.textContent = "Salvando...";
  btn.disabled = true;

  try {
    const response = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinSessao,
        dados: {
          disciplinas: novasDisciplinas
        }
      })
    });

    if (!response.ok) {
      throw new Error("Erro ao salvar");
    }

    dadosAtuais = novasDisciplinas;
    modoEdicao = false;
    btn.textContent = "Alterar dados";
    btn.className = "btn-acao";
    btn.disabled = false;
    
    msgSalvar.className = "status-msg status-sucesso";
    msgSalvar.textContent = "Dados salvos com sucesso.";

    renderizarBoletim();

  } catch (erro) {
    msgSalvar.className = "status-msg status-erro";
    msgSalvar.textContent = "Não foi possível salvar as alterações. Tente novamente.";
    btn.disabled = false;
  }
}