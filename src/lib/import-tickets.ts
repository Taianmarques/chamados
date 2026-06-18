// Conversão de cidade/estado (como aparece nas planilhas externas) para sigla de UF.
const UF_POR_NOME: Record<string, string> = {
  "rio branco": "AC", "acre": "AC",
  "maceio": "AL", "alagoas": "AL",
  "macapa": "AP", "amapa": "AP",
  "manaus": "AM", "amazonas": "AM",
  "salvador": "BA", "bahia": "BA",
  "fortaleza": "CE", "ceara": "CE",
  "brasilia": "DF", "distrito federal": "DF",
  "vitoria": "ES", "espirito santo": "ES",
  "goiania": "GO", "goias": "GO",
  "sao luis": "MA", "maranhao": "MA",
  "cuiaba": "MT", "mato grosso": "MT",
  "campo grande": "MS", "mato grosso do sul": "MS",
  "belo horizonte": "MG", "minas gerais": "MG",
  "belem": "PA", "para": "PA",
  "joao pessoa": "PB", "paraiba": "PB",
  "curitiba": "PR", "parana": "PR",
  "recife": "PE", "pernambuco": "PE",
  "teresina": "PI", "piaui": "PI",
  "rio de janeiro": "RJ",
  "natal": "RN", "rio grande do norte": "RN",
  "porto alegre": "RS", "rio grande do sul": "RS",
  "porto velho": "RO", "rondonia": "RO",
  "boa vista": "RR", "roraima": "RR",
  "florianopolis": "SC", "santa catarina": "SC",
  "sao paulo": "SP",
  "aracaju": "SE", "sergipe": "SE",
  "palmas": "TO", "tocantins": "TO",
};

const UFS_VALIDAS = new Set(Object.values(UF_POR_NOME));

function removerAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function normalizarTexto(texto: string): string {
  return removerAcentos(String(texto ?? "")).toLowerCase().replace(/\s+/g, " ").trim();
}

export function cidadeParaUf(nomeLocal: string): string | null {
  const chave = normalizarTexto(nomeLocal);
  if (!chave) return null;
  if (UFS_VALIDAS.has(chave.toUpperCase())) return chave.toUpperCase();
  return UF_POR_NOME[chave] ?? null;
}

export function parseValor(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (!raw) return 0;
  const limpo = String(raw)
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const valor = parseFloat(limpo);
  return Number.isFinite(valor) ? valor : 0;
}

const MODALIDADE_PARA_STATUS: Record<string, string> = {
  "refrigeracao": "CHAMADO_REFRIG",
  "civil": "CHAMADO_CIVIL",
  "eletrica": "CHAMADO_CIVIL",
  "marcenaria": "CHAMADO_CIVIL",
  "bebedouro": "CHAMADO_BEBEDOURO",
  "capex": "CHAMADO_CAPEX",
};

export function modalidadeParaStatus(modalidade: string, descricao: string): string | null {
  if (/bebedouro/i.test(descricao)) return "CHAMADO_BEBEDOURO";
  const chave = normalizarTexto(modalidade);
  return MODALIDADE_PARA_STATUS[chave] ?? null;
}

// Termos que costumam aparecer no cabeçalho real de planilhas de chamados.
const TERMOS_CABECALHO = [
  "ticket", "chamado", "cliente", "unidade", "localizacao", "localização",
  "ov", "os", "valor", "modalidade", "descricao", "descrição", "uf", "estado", "etapa", "status",
];

/**
 * Algumas planilhas (relatórios exportados) têm linhas de título antes do
 * cabeçalho real (ex: linha 1 = título do relatório, linha 2 = vazia, linha 3 = cabeçalho).
 * Esta função varre as primeiras linhas em busca da que mais se parece com um cabeçalho.
 */
export function encontrarLinhaCabecalho(linhas: unknown[][]): number {
  let melhorIndice = 0;
  let melhorPontuacao = -1;
  const limite = Math.min(linhas.length, 15);
  for (let i = 0; i < limite; i++) {
    const linha = linhas[i] ?? [];
    const celulasPreenchidas = linha.filter((c) => String(c ?? "").trim() !== "").length;
    if (celulasPreenchidas < 3) continue;
    const pontuacao = linha.reduce((acc: number, celula) => {
      const texto = normalizarTexto(String(celula ?? ""));
      return acc + (TERMOS_CABECALHO.some((termo) => texto.includes(termo)) ? 1 : 0);
    }, 0);
    if (pontuacao > melhorPontuacao) {
      melhorPontuacao = pontuacao;
      melhorIndice = i;
    }
  }
  return melhorIndice;
}

/** Converte uma planilha (matriz de linhas) em objetos, detectando automaticamente a linha de cabeçalho. */
export function linhasParaObjetos(matriz: unknown[][]): { linhaCabecalho: number; registros: Record<string, string>[] } {
  const linhaCabecalho = encontrarLinhaCabecalho(matriz);
  const cabecalhos = (matriz[linhaCabecalho] ?? []).map((c) => String(c ?? "").trim());
  const registros = matriz.slice(linhaCabecalho + 1)
    .filter((linha) => (linha ?? []).some((c) => String(c ?? "").trim() !== ""))
    .map((linha) => {
      const obj: Record<string, string> = {};
      cabecalhos.forEach((cab, idx) => {
        if (cab) obj[cab] = String(linha[idx] ?? "").trim();
      });
      return obj;
    });
  return { linhaCabecalho, registros };
}
