# Simulador de Precificação — Êxito Contábil

Simulador interativo de composição de preço de venda para empresas do comércio, desenvolvido para uso real em atendimento contábil.

## Acesso

> **[Abrir simulador](https://fhms1.github.io/precificador-contabil-/)**

---

## Sobre o projeto

Ferramenta desenvolvida para auxiliar contadores e empresários do comércio na precificação correta de produtos, considerando todos os encargos envolvidos em uma operação interestadual.

O projeto nasceu de uma demanda real: clientes do setor comercial que compravam mercadorias em outros estados e precificavam sem considerar o DIFAL, o Simples Nacional com redutor estadual e a taxa da maquineta — gerando margens incorretas e prejuízos não percebidos.

---

## Funcionalidades

- **Seletor de regime tributário** — Simples Nacional e Lucro Presumido, com lógica de cálculo adaptada para cada regime
- **Seletor de estados** — calcula automaticamente a alíquota interestadual e o DIFAL para qualquer rota entre os 27 estados brasileiros
- **DIFAL "por dentro"** — cálculo conforme Nota de Esclarecimento SEFAZ/PB (Lei nº 11.470/19 e Decreto nº 40.006/20)
- **Simples Nacional com redutor ICMS/PB** — alíquota efetiva real considerando o benefício estadual da Paraíba (3,14% na 1ª faixa)
- **Lucro Presumido** — ICMS líquido com crédito de entrada, PIS/COFINS cumulativo, IRPJ e CSLL sobre base de presunção
- **Seletor de maquineta** — SafraPay, Cielo, Stone, PagSeguro com taxas pré-configuradas e campo editável
- **Preço sugerido por margem alvo** — slider interativo que calcula o preço mínimo para atingir a margem desejada
- **Custo fixo rateado** — campo opcional para incluir despesas fixas no cálculo
- **Histórico da sessão** — salva e compara múltiplas simulações
- **Imprimir / Salvar PDF** — relatório formatado para entrega ao cliente
- **Glossário** — explicação dos conceitos para educação financeira do cliente

---

## Lógica de cálculo

### DIFAL — Diferencial de Alíquota (por dentro)

```
Valor sem ICMS origem  = Custo × (1 − alíq. interestadual)
Base de Cálculo        = Valor sem origem ÷ (1 − alíq. interna destino)
DIFAL                  = BC × (alíq. interna − alíq. interestadual)
```

### Simples Nacional — 1ª faixa com redutor PB

```
Alíquota nominal       = 4,00%
Parcela ICMS no DAS    = 34,00% × 4,00% = 1,36%
Redutor ICMS/PB        = 63,23% × 1,36% = 0,86%
Alíquota efetiva       = 4,00% − 0,86% = 3,14%
```

### Lucro Presumido — ICMS líquido

```
ICMS débito   = Preço de venda × alíq. interna destino
ICMS crédito  = (Custo × alíq. interestadual) + DIFAL recolhido
ICMS líquido  = ICMS débito − ICMS crédito
```

### Resultado bruto

```
Resultado = Preço de venda − Custo − DIFAL − Impostos − Maquineta
Margem    = Resultado ÷ Preço de venda
```

---

## Tecnologias

- **HTML5** — estrutura e semântica
- **CSS3** — layout responsivo, variáveis CSS, mobile first
- **JavaScript (Vanilla)** — toda a lógica de cálculo sem dependências externas
- **Single file** — sem frameworks, sem build, sem dependências — funciona offline e em qualquer navegador

---

## Estrutura

```
precificador-contabil/
│
├── index.html     # Aplicação completa (HTML + CSS + JS em arquivo único)
└── README.md      # Documentação
```

---

## Como usar localmente

```bash
git clone https://github.com/FHMS1/precificador-contabil-.git
cd precificador-contabil-
open index.html
```

---

## Contexto tributário

| Encargo | Base | Observação |
|---|---|---|
| DIFAL | Custo de entrada | Cálculo "por dentro" — SEFAZ/PB |
| Simples Nacional | Preço de venda | Redutor ICMS/PB aplicado (1ª faixa: 3,14%) |
| PIS + COFINS (LP) | Preço de venda | Regime cumulativo — 3,65% |
| IRPJ + CSLL (LP) | Preço de venda | Presunção comércio — 2,28% |
| Maquineta | Preço de venda | Taxa configurável por operadora |

Alíquotas interestaduais conforme tabela ICMS 2025. Alíquotas internas por estado atualizadas.

---

## Autor

Desenvolvido por **Fabio Henrique de Moura Silva**

Cientista Contábil · Estudante de Análise e Desenvolvimento de Sistemas · CEO da Êxito Contábil

[![GitHub](https://img.shields.io/badge/GitHub-FHMS1-181717?style=flat&logo=github)](https://github.com/FHMS1)

---

## Aviso

Esta ferramenta é de apoio à decisão. Os valores são estimativas baseadas nas informações inseridas. Consulte sempre seu contador para decisões fiscais e tributárias.

---

## Licença

Este projeto está sob a licença [MIT](LICENSE).
