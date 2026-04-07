# 💰 Precificador Contábil

Calculadora interativa de composição de preço de venda para empresas do comércio, desenvolvida para uso real em atendimento contábil.

## 🔗 Acesso

> **[Abrir calculadora →](https://seuusuario.github.io/precificador-contabil)**

---

## 📋 Sobre o projeto

Ferramenta desenvolvida para auxiliar contadores e empresários do comércio na precificação correta de produtos, considerando todos os encargos envolvidos em uma operação interestadual.

O projeto nasceu de uma demanda real: clientes do setor comercial que compravam mercadorias em outros estados e precificavam sem considerar o DIFAL, o Simples Nacional com redutor estadual e a taxa da maquineta — gerando margens incorretas e prejuízos não percebidos.

---

## ⚙️ Funcionalidades

- **Seletor de estados** — calcula automaticamente a alíquota interestadual e o DIFAL para qualquer rota entre os 27 estados brasileiros
- **DIFAL "por dentro"** — cálculo conforme Nota de Esclarecimento SEFAZ/PB (Lei nº 11.470/19 e Decreto nº 40.006/20)
- **Simples Nacional com redutor ICMS/PB** — alíquota efetiva real considerando o benefício estadual da Paraíba
- **Preço sugerido por margem alvo** — slider interativo que calcula o preço mínimo para atingir a margem desejada
- **Custo fixo rateado** — campo opcional para incluir despesas fixas no cálculo
- **Histórico da sessão** — salva e compara múltiplas simulações
- **Imprimir / Salvar PDF** — relatório formatado para entrega ao cliente
- **Glossário** — explicação dos conceitos para educação financeira do cliente

---

## 🧮 Lógica de cálculo

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

### Resultado bruto

```
Resultado = Preço de venda − Custo − DIFAL − Simples − Maquineta
Margem    = Resultado ÷ Preço de venda
```

---

## 🛠️ Tecnologias

- **HTML5** — estrutura e semântica
- **CSS3** — layout responsivo, variáveis CSS, dark mode ready
- **JavaScript (Vanilla)** — toda a lógica de cálculo sem dependências externas
- **Single file** — sem frameworks, sem build, sem dependências — funciona offline

---

## 📁 Estrutura

```
precificador-contabil/
│
├── index.html     # Aplicação completa (HTML + CSS + JS em arquivo único)
└── README.md      # Documentação
```

---

## 🚀 Como usar localmente

```bash
git clone https://github.com/seuusuario/precificador-contabil.git
cd precificador-contabil
# Abra o index.html no navegador
open index.html
```

---

## 📌 Contexto tributário

| Encargo | Base | Observação |
|---|---|---|
| DIFAL | Custo de entrada | Cálculo "por dentro" — SEFAZ/PB |
| Simples Nacional | Preço de venda | Redutor ICMS/PB aplicado |
| Maquineta (SafraPay) | Preço de venda | Taxa configurável |

Alíquotas interestaduais conforme tabela ICMS 2025. Alíquotas internas por estado atualizadas (PB: 20%, ES: 17%, SP: 18%...).

---

## 👨‍💻 Autor

Desenvolvido por **[Seu Nome]**  
Estudante de Análise e Desenvolvimento de Sistemas  
Em parceria com **Êxito Contábil**

[![GitHub](https://img.shields.io/badge/GitHub-seuusuario-181717?style=flat&logo=github)](https://github.com/seuusuario)

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).
