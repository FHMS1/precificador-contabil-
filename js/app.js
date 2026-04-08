// ===== CONSTANTES E ESTADO =====
// Alíquota interna padrão por UF de destino
const ALIQ_INTERNA = {
  AC: 0.19, AL: 0.20, AM: 0.20, AP: 0.18, BA: 0.205, CE: 0.20, DF: 0.20, ES: 0.17,
  GO: 0.19, MA: 0.23, MT: 0.17, MS: 0.17, MG: 0.18, PA: 0.19, PB: 0.20, PR: 0.195,
  PE: 0.205, PI: 0.225, RN: 0.20, RS: 0.17, RJ: 0.22, RO: 0.195, RR: 0.20,
  SC: 0.17, SP: 0.18, SE: 0.20, TO: 0.20
};

// Regra usada para identificar operação interestadual 7% ou 12%
const SUL_SUDESTE = ["MG", "SP", "RJ", "PR", "RS", "SC"];
const NORTE_NE_CO_ES = ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "PA", "PB", "PE", "PI", "RN", "RO", "RR", "SE", "TO"];

// Estado geral da aplicação
let cfAtivo = false;   // controla se o custo fixo está ligado
let historico = [];    // armazena simulações salvas
let regime = "sn";     // regime inicial: sn = Simples Nacional

// ===== FORMATAÇÃO =====
// Formatador de moeda em padrão BRL
const fmtMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

// Formata valor monetário
function fmt(v) {
  return fmtMoeda.format(v);
}

// Formata percentual (recebe número decimal, ex.: 0.2 => 20,00%)
function fmtP(v) {
  return (v * 100).toFixed(2).replace(".", ",") + "%";
}

// ===== CÁLCULOS =====
// Retorna a alíquota interestadual entre origem e destino
function getInterestadual(origem, destino) {
  if (origem === destino) return 0;

  // Regra de 7% para Sul/Sudeste -> Norte/Nordeste/Centro-Oeste/ES
  if (SUL_SUDESTE.includes(origem) && NORTE_NE_CO_ES.includes(destino)) {
    return 0.07;
  }

  // Demais operações interestaduais
  return 0.12;
}

// Calcula o DIFAL com base no custo, alíquota interestadual e alíquota interna
function calcDIFAL(custo, aliqInter, aliqInterna) {
  if (aliqInter === 0) return 0;

  const valorSemAliqInter = custo * (1 - aliqInter);
  const baseCalculo = valorSemAliqInter / (1 - aliqInterna);

  return baseCalculo * (aliqInterna - aliqInter);
}

// Lê todos os campos da tela e monta um objeto com os parâmetros da simulação
function getParams() {
  const orig = document.getElementById("uf-origem").value;
  const dest = document.getElementById("uf-destino").value;

  const ai = getInterestadual(orig, dest);
  const ap = ALIQ_INTERNA[dest] || 0.20;

  const maqTaxa = parseFloat(document.getElementById("maq-taxa").value) / 100 || 0;

  const maqSel = document.getElementById("maq-sel");
  const maqNome = maqSel.options[maqSel.selectedIndex].text;

  const cf = cfAtivo ? (parseFloat(document.getElementById("custo-fixo").value) || 0) : 0;

  const base = {
    orig,
    dest,
    ai,
    ap,
    maqTaxa,
    maqNome,
    cf,
    custo: Math.max(0, parseFloat(document.getElementById("custo").value) || 0),
    venda: Math.max(0, parseFloat(document.getElementById("venda").value) || 0)
  };

  // Parâmetros específicos conforme o regime
  if (regime === "sn") {
    base.simPct = parseFloat(document.getElementById("simples").value) / 100 || 0;
  } else {
    base.pisCofins = parseFloat(document.getElementById("lp-piscofins").value) / 100 || 0;
    base.irpj = parseFloat(document.getElementById("lp-irpj").value) / 100 || 0;
    base.csll = parseFloat(document.getElementById("lp-csll").value) / 100 || 0;
  }

  return base;
}

// Executa a simulação principal
// Pode usar o preço de venda atual (p.venda) ou um preço informado manualmente
function run(p, venda) {
  const v = venda || p.venda;

  const d = calcDIFAL(p.custo, p.ai, p.ap);
  const maq = v * p.maqTaxa;

  let impostos = 0;
  let icmsLiq = 0;
  let pisCofinsV = 0;
  let irpjCsllV = 0;
  let simplesV = 0;

  if (regime === "sn") {
    // No Simples: imposto direto sobre a venda
    simplesV = v * (p.simPct || 0);
    impostos = simplesV;
  } else {
    // No Lucro Presumido: calcula ICMS líquido + PIS/COFINS + IRPJ/CSLL
    const icmsCredito = p.custo * p.ai + d;

    icmsLiq = Math.max(v * p.ap - icmsCredito, 0);
    pisCofinsV = v * (p.pisCofins || 0);
    irpjCsllV = v * ((p.irpj || 0) + (p.csll || 0));

    impostos = icmsLiq + pisCofinsV + irpjCsllV;
  }

  const enc = d + impostos + maq; // encargos totais variáveis
  const res = v - p.custo - enc;  // resultado bruto
  const liq = res - p.cf;         // resultado líquido após custo fixo

  return {
    d,
    maq,
    simplesV,
    icmsLiq,
    pisCofinsV,
    irpjCsllV,
    impostos,
    enc,
    res,
    liq,
    margem: v > 0 ? res / v : 0,
    margemLiq: v > 0 ? liq / v : 0,
    markup: p.custo > 0 ? v / p.custo : 0,
    custoTotal: p.custo + d,
    bc: p.ai > 0 ? p.custo * (1 - p.ai) / (1 - p.ap) : 0
  };
}

// Busca o menor preço de venda para atingir uma margem alvo
function pMin(p, alvo) {
  let v = p.custo * 1.001;

  // Faz busca incremental de centavo em centavo
  for (let i = 0; i < 300000; i++) {
    const r = run(p, v);

    if (r.margem >= alvo) return v;

    v += 0.01;
  }

  return null;
}

// ===== CONTROLE DE REGIME =====
// Alterna entre Simples Nacional e Lucro Presumido
function setRegime(r) {
  regime = r;

  // Atualiza abas visuais
  document.getElementById("tab-sn").classList.toggle("active", r === "sn");
  document.getElementById("tab-lp").classList.toggle("active", r === "lp");

  // Mostra bloco de inputs do regime ativo
  document.getElementById("bloco-sn").classList.toggle("show", r === "sn");
  document.getElementById("bloco-lp").classList.toggle("show", r === "lp");

  // Mostra/esconde linhas de resumo conforme regime
  document.getElementById("row-sn").style.display = r === "sn" ? "flex" : "none";
  document.getElementById("row-icms-lp").style.display = r === "lp" ? "flex" : "none";
  document.getElementById("row-piscofins").style.display = r === "lp" ? "flex" : "none";
  document.getElementById("row-irpj").style.display = r === "lp" ? "flex" : "none";

  // Mostra/esconde linhas de detalhamento
  document.getElementById("r-row-sn").style.display = r === "sn" ? "flex" : "none";
  document.getElementById("r-row-lp").style.display = r === "lp" ? "flex" : "none";
  document.getElementById("r-row-irpj").style.display = r === "lp" ? "flex" : "none";

  recalc();
}

// Quando troca o select da maquineta, preenche a taxa automaticamente
function onMaqChange() {
  const sel = document.getElementById("maq-sel");
  const val = sel.value;

  if (val !== "custom") {
    document.getElementById("maq-taxa").value = val;
  }

  recalc();
}

// Liga/desliga custo fixo
function toggleCF() {
  cfAtivo = !cfAtivo;

  document.getElementById("tog-cf").classList.toggle("on", cfAtivo);
  document.getElementById("cf-row").classList.toggle("v", cfAtivo);
  document.getElementById("row-cf").style.display = cfAtivo ? "flex" : "none";
  document.getElementById("row-liq").style.display = cfAtivo ? "flex" : "none";

  recalc();
}

// ===== RECÁLCULO GERAL =====
// Atualiza toda a tela com base nos valores atuais
function recalc() {
  const p = getParams();
  const r = run(p);

  // Tags do topo
  document.getElementById("tag-inter").textContent = fmtP(p.ai);
  document.getElementById("tag-interna").textContent = fmtP(p.ap);
  document.getElementById("tag-dif").textContent = fmtP(p.ap - p.ai);

  // Bloco principal
  document.getElementById("sub-custo").textContent = "Valor pago ao fornecedor (" + p.orig + ")";
  document.getElementById("b-custo").textContent = fmt(p.custo);

  document.getElementById("b-difal").textContent = fmt(r.d);
  document.getElementById("sub-difal").textContent = p.ai > 0
    ? "BC = " + fmt(r.bc) + " · " + fmt(r.d) + " (" + fmtP(p.custo > 0 ? r.d / p.custo : 0) + " s/custo)"
    : "Mesmo estado — sem DIFAL";

  // Valores específicos por regime
  if (regime === "sn") {
    document.getElementById("b-sn").textContent = fmt(r.simplesV);
    document.getElementById("sub-sn").textContent = fmtP(p.simPct) + " × venda";
  } else {
    document.getElementById("b-icms-lp").textContent = fmt(r.icmsLiq);
    document.getElementById("sub-icms-lp").textContent = "Débito " + fmtP(p.ap) + " − crédito da compra";

    document.getElementById("b-piscofins").textContent = fmt(r.pisCofinsV);
    document.getElementById("sub-piscofins").textContent = fmtP(p.pisCofins) + " × venda";

    document.getElementById("b-irpj").textContent = fmt(r.irpjCsllV);
    document.getElementById("sub-irpj").textContent = "IRPJ " + fmtP(p.irpj) + " + CSLL " + fmtP(p.csll);
  }

  // Demais linhas do painel
  document.getElementById("b-maq").textContent = fmt(r.maq);
  document.getElementById("sub-maq").textContent = fmtP(p.maqTaxa) + " × venda · " + p.maqNome;

  document.getElementById("b-enc").textContent = fmt(r.enc);
  document.getElementById("b-custo-total").textContent = fmt(r.custoTotal);
  document.getElementById("b-cf").textContent = fmt(p.cf);

  // Resultado bruto
  const resEl = document.getElementById("b-resultado");
  resEl.textContent = fmt(r.res);
  resEl.className = "val " + (r.res >= 0 ? "pos" : "neg");

  // Resultado líquido
  const liqEl = document.getElementById("b-liquido");
  liqEl.textContent = fmt(r.liq);
  liqEl.className = "val " + (r.liq >= 0 ? "pos" : "neg");

  // Métricas
  const md = cfAtivo ? r.margemLiq : r.margem;

  const mEl = document.getElementById("m-margem");
  mEl.textContent = fmtP(md);
  mEl.style.color = md >= 0.30
    ? "var(--success)"
    : md >= 0.10
      ? "var(--warning)"
      : "var(--danger)";

  document.getElementById("m-markup").textContent = r.markup.toFixed(2).replace(".", ",") + "×";
  document.getElementById("m3-lbl").textContent = cfAtivo ? "Margem líquida" : "% encargos / venda";
  document.getElementById("m-enc").textContent = cfAtivo
    ? fmtP(r.margemLiq)
    : (p.venda > 0 ? fmtP(r.enc / p.venda) : "—");

  // Quadro de detalhamento
  document.getElementById("r-rota").textContent = p.orig + " → " + p.dest;
  document.getElementById("r-inter").textContent = fmtP(p.ai);
  document.getElementById("r-dest-sub").textContent = "Alíquota modal — " + p.dest;
  document.getElementById("r-interna").textContent = fmtP(p.ap);
  document.getElementById("r-difal-pct").textContent = p.custo > 0 ? fmtP(r.d / p.custo) + " s/ custo" : "—";
  document.getElementById("r-maq-nome").textContent = p.maqNome;
  document.getElementById("r-maq-taxa").textContent = fmtP(p.maqTaxa) + " s/ venda";
  document.getElementById("r-enc-total").textContent = p.venda > 0 ? fmtP(r.enc / p.venda) + " s/ venda" : "—";

  if (regime === "sn") {
    document.getElementById("r-simples").textContent = fmtP(p.simPct) + " s/ venda";
  } else {
    document.getElementById("r-piscofins").textContent = fmtP(p.pisCofins) + " s/ venda";
    document.getElementById("r-irpjcsll").textContent = "IRPJ " + fmtP(p.irpj) + " + CSLL " + fmtP(p.csll);
  }

  // Atualizações secundárias
  buildBarra(p, r);
  buildAlerta(md, cfAtivo ? r.liq : r.res);
  buildTabela(p);
  calcSugerido();
}

// ===== BLOCO VISUAL DE COMPOSIÇÃO =====
// Monta a barra visual de composição do preço
function buildBarra(p, r) {
  if (p.venda <= 0) return;

  const segs = [
    { l: "Custo", v: p.custo, c: "#1b4657" },
    { l: "DIFAL", v: r.d, c: "#D85A30" }
  ];

  if (regime === "sn") {
    segs.push({ l: "Simples", v: r.simplesV, c: "#BA7517" });
  } else {
    segs.push({ l: "ICMS líq.", v: r.icmsLiq, c: "#BA7517" });
    segs.push({ l: "PIS/COF", v: r.pisCofinsV, c: "#7F77DD" });
    segs.push({ l: "IRPJ/CSLL", v: r.irpjCsllV, c: "#993556" });
  }

  segs.push({ l: "Maquineta", v: r.maq, c: "#378ADD" });

  if (cfAtivo && p.cf > 0) {
    segs.push({ l: "Custo fixo", v: p.cf, c: "#888780" });
  }

  segs.push({
    l: "Resultado",
    v: Math.max(cfAtivo ? r.res - p.cf : r.res, 0),
    c: "#3B6D11"
  });

  document.getElementById("barra").innerHTML = segs.map(s =>
    `<div style="width:${(s.v / p.venda * 100).toFixed(2)}%;background:${s.c}" title="${s.l}: ${fmt(s.v)}"></div>`
  ).join("");

  document.getElementById("bleg").innerHTML = segs.map(s =>
    `<span><i style="background:${s.c}"></i>${s.l} ${(s.v / p.venda * 100).toFixed(1)}%</span>`
  ).join("");
}

// Mostra alerta se houver prejuízo ou margem baixa
function buildAlerta(margem, res) {
  const el = document.getElementById("alerta");

  if (res < 0) {
    el.style.cssText = "display:block;background:var(--danger-bg);color:var(--danger);border-radius:var(--rs);padding:12px 16px;font-size:12.5px;margin-bottom:16px;border-left:3px solid var(--danger)";
    el.innerHTML = "<strong>Atenção:</strong> Prejuízo de <strong>" + fmt(Math.abs(res)) + "</strong> neste preço de venda.";
  } else if (margem < 0.10) {
    el.style.cssText = "display:block;background:var(--warning-bg);color:var(--warning);border-radius:var(--rs);padding:12px 16px;font-size:12.5px;margin-bottom:16px;border-left:3px solid var(--warning)";
    el.innerHTML = "<strong>Atenção:</strong> Margem de <strong>" + fmtP(margem) + "</strong> é baixa — pode não cobrir despesas fixas operacionais.";
  } else {
    el.style.display = "none";
  }
}

// ===== TABELA DE PREÇO MÍNIMO =====
// Monta a tabela de preço mínimo por faixa de margem
function buildTabela(p) {
  const ms = [0, 0.10, 0.20, 0.30, 0.40, 0.50];
  let h = "";

  ms.forEach(m => {
    const v = pMin(p, m);
    const r = v ? run(p, v) : null;
    const c = m >= 0.3 ? "bg" : m >= 0.1 ? "ba" : "bi";

    h += `<tr>
      <td><span class="badge ${c}">${(m * 100).toFixed(0)}%</span></td>
      <td style="font-weight:700">${v ? fmt(v) : "—"}</td>
      <td style="color:var(--text-sec)">${r ? r.markup.toFixed(2).replace(".", ",") + "×" : "—"}</td>
      <td style="color:var(--success);font-weight:600">${r ? fmt(r.res) : "—"}</td>
    </tr>`;
  });

  document.getElementById("ptbody").innerHTML = h;
}

// ===== PREÇO SUGERIDO =====
// Calcula o preço sugerido de acordo com a margem alvo escolhida
function calcSugerido() {
  const p = getParams();
  const alvo = (parseFloat(document.getElementById("margem-alvo-num").value) || 30) / 100;
  const v = pMin(p, alvo);

  if (!v) {
    document.getElementById("preco-sugerido").textContent = "—";
    document.getElementById("sug-markup").textContent = "—";
    document.getElementById("sug-resultado").textContent = "—";
    document.getElementById("sug-detalhe").textContent = "";
    return;
  }

  const r = run(p, v);

  document.getElementById("preco-sugerido").textContent = fmt(v);
  document.getElementById("sug-markup").textContent = r.markup.toFixed(2).replace(".", ",") + "×";
  document.getElementById("sug-resultado").textContent = fmt(r.res);
  document.getElementById("sug-detalhe").textContent =
    "Custo " + fmt(p.custo) +
    " · DIFAL " + fmt(r.d) +
    " · Impostos " + fmt(r.impostos) +
    " · Maquineta " + fmt(r.maq) +
    " · Encargos " + fmt(r.enc);

  // Guarda o valor para permitir aplicar depois com um clique
  window._precoSugerido = v;
}

// Aplica o preço sugerido no campo de venda
function aplicarPrecoSugerido() {
  if (!window._precoSugerido) return;

  document.getElementById("venda").value = window._precoSugerido.toFixed(2);
  recalc();

  const el = document.getElementById("venda");

  // Destaque visual temporário
  el.style.borderColor = "var(--exito)";
  el.style.boxShadow = "0 0 0 3px var(--exito-light)";

  setTimeout(function () {
    el.style.borderColor = "";
    el.style.boxShadow = "";
  }, 1400);

  // Scroll suave até o campo
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}

// ===== HISTÓRICO COM LOCALSTORAGE =====
// Carrega histórico salvo no navegador
function carregarHistoricoStorage() {
  try {
    const saved = localStorage.getItem("precificador_historico");
    if (saved) historico = JSON.parse(saved);
  } catch (e) {
    historico = [];
  }
}

// Salva histórico no navegador
function salvarHistoricoStorage() {
  try {
    localStorage.setItem("precificador_historico", JSON.stringify(historico));
  } catch (e) {
    // Se der erro de storage, apenas ignora
  }
}

// Salva a simulação atual no histórico
function salvarSim() {
  const p = getParams();
  const r = run(p);

  const hora = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const data = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  });

  historico.unshift({
    ...p,
    res: r.res,
    margem: r.margem,
    hora,
    data,
    regime
  });

  // Mantém no máximo 8 registros
  if (historico.length > 8) {
    historico.pop();
  }

  salvarHistoricoStorage();
  renderHist();

  // Feedback visual no botão clicado
  const btn = event.target;
  const orig = btn.textContent;

  btn.textContent = "✓ Salvo!";
  btn.style.color = "var(--success)";
  btn.style.borderColor = "var(--success)";

  setTimeout(() => {
    btn.textContent = orig;
    btn.style.color = "";
    btn.style.borderColor = "";
  }, 1500);
}

// Limpa o histórico inteiro
function limparHistorico() {
  if (!confirm("Limpar todo o histórico?")) return;

  historico = [];
  salvarHistoricoStorage();
  renderHist();
}

// Renderiza a lista do histórico na tela
function renderHist() {
  const el = document.getElementById("hist-list");
  const btnLimpar = document.getElementById("btn-limpar");

  document.getElementById("hist-count").textContent = historico.length > 0 ? "(" + historico.length + ")" : "";

  if (btnLimpar) {
    btnLimpar.style.display = historico.length > 0 ? "block" : "none";
  }

  if (!historico.length) {
    el.innerHTML = '<div class="hist-empty">Nenhuma simulação salva ainda.</div>';
    return;
  }

  el.innerHTML = historico.map((h, i) => `
    <div class="hist-item" onclick="carregarSim(${i})">
      <div class="hist-top">
        <span class="hist-title">${h.orig}→${h.dest} · Custo ${fmt(h.custo)} · Venda ${fmt(h.venda)} · ${h.regime === "sn" ? "Simples" : "Lucro Pres."}</span>
        <span class="hist-time">${h.data || ""} ${h.hora}</span>
      </div>
      <div class="hist-vals">
        <span>Resultado: <strong style="color:${h.res >= 0 ? "var(--success)" : "var(--danger)"}">${fmt(h.res)}</strong></span>
        <span>Margem: <strong>${fmtP(h.margem)}</strong></span>
      </div>
    </div>
  `).join("");
}

// Reaplica uma simulação salva no formulário
function carregarSim(i) {
  const h = historico[i];

  document.getElementById("uf-origem").value = h.orig;
  document.getElementById("uf-destino").value = h.dest;
  document.getElementById("custo").value = h.custo;
  document.getElementById("venda").value = h.venda;

  setRegime(h.regime);

  if (h.simPct) {
    document.getElementById("simples").value = (h.simPct * 100).toFixed(2);
  }

  if (h.cf > 0 && !cfAtivo) {
    toggleCF();
  }

  if (h.cf > 0) {
    document.getElementById("custo-fixo").value = h.cf;
  }

  recalc();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// ===== GLOSSÁRIO =====
// Abre/fecha item do glossário
function toggleGlossario(el) {
  el.classList.toggle("open");
}

// ===== PDF =====
// Aciona a impressão/salvamento em PDF
function salvarPDF() {
  const tituloOriginal = document.title;

  document.title = "Simulador_Precificacao_Exito_Contabil";
  window.print();

  setTimeout(function () {
    document.title = tituloOriginal;
  }, 1000);
}

// ===== INICIALIZAÇÃO =====
// Ao carregar a página, restaura histórico e calcula a tela inicial
carregarHistoricoStorage();
renderHist();
recalc();