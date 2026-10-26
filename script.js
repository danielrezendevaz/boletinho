// Dados fictícios padronizados do 8º Ano (Array de Objetos)
const dadosBoletim = [
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

// Nota: A frequência geral de 92% exibida no card é fictícia/demonstrativa nesta versão.

// Função para normalizar qualquer formato de nota para a escala 0 a 10
function normalizarNota(valor) {
  // Trata ausência de nota
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Se for texto com vírgula, troca por ponto decimal
  if (typeof valor === "string") {
    valor = valor.replace(",", ".");
  }

  let numero = Number(valor);

  // Se não for um número válido, descarta
  if (isNaN(numero)) {
    return null;
  }

  // Se a nota estiver maior que 10 e ate 100, divide por 10
  if (numero > 10 && numero <= 100) {
    numero = numero / 10;
  }

  // Garante que a nota esteja dentro da escala válida de 0 a 10
  if (numero >= 0 && numero <= 10) {
    return numero;
  }

  return null; // Caso esteja fora das regras
}

// Função para formatar a exibição da nota na tabela
function formatarExibicao(nota) {
  if (nota === null) {
    return "—";
  }
  return nota.toFixed(1).replace(".", ",");
}

// Função principal que carrega os dados no HTML (DOM)
function carregarBoletim() {
  const tabelaCorpo = document.getElementById("tabela-corpo");
  tabelaCorpo.innerHTML = ""; // Limpa a tabela

  let somaMedias = 0;
  let qtdDisciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let qtdBomDesempenho = 0;
  let qtdAtencao = 0;

  // Passa por cada disciplina da lista
  dadosBoletim.forEach(item => {
    // Normaliza as notas dos 3 trimestres
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    // Calcula a média considerando APENAS notas existentes
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

    // Soma as faltas da disciplina
    const totalFaltasDisciplina = item.faltas.reduce((acc, curr) => acc + curr, 0);
    totalFaltasGeral += totalFaltasDisciplina;

    // Cria a linha da tabela HTML
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td><strong>${item.disciplina}</strong></td>
      <td>${formatarExibicao(n1)}</td>
      <td>${formatarExibicao(n2)}</td>
      <td>${formatarExibicao(n3)}</td>
      <td><strong>${formatarExibicao(media)}</strong></td>
      <td>${totalFaltasDisciplina}</td>
      <td class="${classeSituacao}">${situacao}</td>
    `;

    tabelaCorpo.appendChild(linha);
  });

  // Atualiza os Cards de Resumo na tela
  const mediaGeralGlobal = qtdDisciplinasComMedia > 0 ? (somaMedias / qtdDisciplinasComMedia).toFixed(1).replace(".", ",") : "—";
  
  document.getElementById("card-media-geral").innerText = mediaGeralGlobal;
  document.getElementById("card-total-faltas").innerText = totalFaltasGeral;
  document.getElementById("card-bom-desempenho").innerText = qtdBomDesempenho;
  document.getElementById("card-atencao").innerText = qtdAtencao;
}

// Executa a função quando a página termina de carregar
document.addEventListener("DOMContentLoaded", carregarBoletim);