# Problem — StyleFlow SaaS

**Status:** APPROVED TARGET
**Version:** 1.0
**Updated:** 2026-09-02
**Scope:** MVP — Beauty / Salões e Centros Estéticos
**Authority:** Definição do problema econômico que o produto resolve

---

## 0. Como Agentes Devem Usar Este Documento

Este documento define o **problema econômico e operacional** que o StyleFlow resolve para o mercado de beleza.

É a fonte da verdade para:
- Justificar a existência do produto (por que estamos construindo isso?).
- Priorizar funcionalidades no `mvp.md` (quais dores são mais agudas?).
- Comunicar valor para clientes e investidores.
- Validar hipóteses com o ICP (`target-customer.md`).

### Regras de Autoridade

- `problem.md` define **o problema que resolvemos**.
- `mvp.md` define **como resolvemos o problema no MVP**.
- `domain-model.md` define **as entidades que resolvem cada problema**.
- `business-model.md` define **o valor econômico capturado**.
- `target-customer.md` define **quem sente o problema**.
- `business-rules.md` define **as regras que garantem a solução**.

---

## 1. Declaração do Problema (Problem Statement)

Salões de beleza, clínicas de estética e barbearias no Brasil operam com ferramentas fragmentadas e manuais: **papel, WhatsApp, Excel, agendas físicas, planilhas financeiras e sistemas legados que não conversam entre si**.

O resultado é uma **operação instável, com baixa visibilidade financeira, retenção de clientes insatisfatória e alto desgaste do gestor**.

O dono do salão gasta mais tempo **apagando incêndios** do que **gerenciando e crescendo** o negócio.

---

## 2. Os Quatro Problemas Centrais

### Problema #1 — Lucro Invisível por Serviço

#### Descrição
O gestor **não sabe** quanto realmente lucra em cada atendimento específico.

#### Causa
- Consumo de produtos (shampoo, tintura, cremes) não é registrado no atendimento.
- Comissão de profissionais é calculada manualmente ou de forma arbitrária.
- Custo de aquisição de cliente e taxa de cartão são ignorados.
- Despesas fixas não são alocadas por serviço.

#### Consequência
- Preço é definido por concorrência ou intuição, **não por margem real**.
- Serviços populares podem estar **dando prejuízo** sem que o dono saiba.
- Dono não sabe onde cortar custos nem onde aumentar preço.
- Dificuldade para contratar novos profissionais (não sabe o ROI de cada um).

#### Valor Econômico (Salão Médio: 5 prof., R$ 30.000/mês)
- **Perda estimada:** 15% de margem → **R$ 4.500/mês** → **R$ 54.000/ano**.

---

### Problema #2 — Faltas e Cancelamentos de Última Hora

#### Descrição
O salão perde faturamento porque clientes **faltam ou cancelam em cima da hora**, e a agenda **não é preenchida automaticamente**.

#### Causa
- Ausência de lembretes automáticos eficientes (WhatsApp).
- Não há política de confirmação ou garantia (pré‑pagamento).
- Agenda não é inteligente para chamar clientes da lista de espera.

#### Consequência
- Profissionais ficam ociosos, mas são pagos (ou recebem comissão sobre o que não fizeram).
- Faturamento mensal é **instável e imprevisível**.
- Dono precisa ligar para clientes manualmente (perde tempo).

#### Valor Econômico (Salão Médio)
- **Média do setor:** 15% de faltas → **R$ 4.500/mês** → **R$ 54.000/ano**.

---

### Problema #3 — Baixa Fidelização (Clientes Não Voltam)

#### Descrição
O cliente vai uma vez, gosta, mas **não volta**. O salão não tem dados para entender por quê.

#### Causa
- Ausência de CRM (histórico, preferências, aniversário, status).
- Não sabe quais clientes não voltaram há 30/60/90 dias.
- Não há campanhas automáticas de reativação (ex: "está na hora do retoque").

#### Consequência
- CAC (Custo de Aquisição de Cliente) é alto porque o salão precisa viver captando novos.
- Equipe opera por **volume**, não por **relacionamento**.
- LTV (Valor do Tempo de Vida) é baixo.

#### Valor Econômico (Salão Médio)
- **Perda de faturamento recorrente:** R$ 3.000/mês → **R$ 36.000/ano**.

---

### Problema #4 — Dados e Ferramentas Desconectados

#### Descrição
O dono usa **4+ ferramentas isoladas** (papel, WhatsApp, Excel, contador, agenda física, etc.) que não se comunicam.

#### Causa
- Sistemas legados são fechados e não integram com WhatsApp, maquininha de cartão ou emissão fiscal.
- Processos manuais de conciliação financeira (agenda → caixa → contador).

#### Consequência
- **Perda de tempo administrativo:** >10h/semana.
- **Erros de conciliação e divergências fiscais.**
- **Falta de confiabilidade nos números:** decisões tomadas com dados incompletos.

#### Valor Econômico (Salão Médio)
- **Custo de oportunidade:** R$ 2.000/mês em horas desperdiçadas → **R$ 24.000/ano**.

---

## 3. Resumo Econômico (Para o Cliente)

| Problema | Perda Mensal (Salão Médio) | Perda Anual |
| :--- | :--- | :--- |
| **Lucro invisível por serviço** | R$ 4.500 | R$ 54.000 |
| **Faltas e cancelamentos** | R$ 4.500 | R$ 54.000 |
| **Baixa fidelização** | R$ 3.000 | R$ 36.000 |
| **Dados e ferramentas desconectadas** | R$ 2.000 | R$ 24.000 |
| **Perda TOTAL** | **R$ 14.000/mês** | **R$ 168.000/ano** |
| **Custo do StyleFlow (Professional)** | **R$ 199/mês** | **R$ 2.388/ano** |
| **ROI Potencial** | **~70x** | **~70x** |

**Conclusão:** Por menos de **R$ 7 por dia**, um salão pode recuperar até **R$ 14.000 por mês**.

---

## 4. Mapeamento dos Problemas para o MVP

| Problema | MVP Solução (referência `mvp.md`) | Módulo do Domínio |
| :--- | :--- | :--- |
| **Lucro invisível** | Controle de consumo de produtos, comissão e DRE básico. | `Inventory` + `Finance` + `Commission` |
| **Faltas/cancelamentos** | Lembretes WhatsApp, confirmação, status de agendamento. | `Communication` + `Scheduling` |
| **Baixa fidelização** | CRM com histórico, notas, anamnese. | `Customer` + `Beauty` |
| **Ferramentas desconectadas** | Plataforma unificada: agenda, clientes, estoque, financeiro, comunicação. | Todos os módulos (SaaS Core + Domain) |

**Nota:** O MVP resolve **todas as quatro dores** de forma integrada e progressiva.

---

## 5. O Que Ainda Não Sabemos (Hipóteses a Validar com Clientes)

Estas são **hipóteses** que devem ser validadas durante a fase de Discovery (M1 e M2 do roadmap):

1. **Dor mais aguda:** Qual destes problemas é prioridade para o ICP? O dono acorda de noite por causa de faltas, ou por causa de lucro invisível?
2. **Disposição a pagar:** O cliente está disposto a pagar R$ 199/mês para resolver a dor identificada? O ROI percebido é suficiente?
3. **Alternativas atuais:** Como o cliente resolve hoje? Planilha? Papel? Outro software? O que ele já paga?
4. **Onboarding:** O cliente consegue implementar o sistema e ver valor em até 7 dias?
5. **ROI mínimo:** Qual o ROI mínimo esperado para justificar a troca? (ex: "preciso economizar pelo menos R$ 500/mês para trocar").

---

## 6. Métricas para Validar a Solução (Customer Discovery)

| Hipótese | Métrica | Mínimo Aceitável |
| :--- | :--- | :--- |
| As faltas são a maior dor | % de clientes que mencionam "faltas" como top 3 dores | > 60% |
| O salão quer mais visibilidade financeira | % que diz "não sei quanto lucro por serviço" | > 50% |
| Disposição a pagar R$ 199 | % que diz "sim" ou "talvez" após ver os benefícios | > 30% |
| Retenção no trial | % que continua usando após 7 dias | > 20% |
| Conversão trial → pago | % que assina após 7 dias | > 15% |

---

## 7. Verificação de Consistência com Documentos Existentes

| Documento | Verificação | Status |
| :--- | :--- | :--- |
| `vision.md` | O problema está alinhado com a visão de "sistema operacional para serviços". | ✅ Consistente |
| `target-customer.md` | O ICP (pequeno/médio salão) é quem sente essas dores de forma mais aguda. | ✅ Consistente |
| `business-model.md` | O ROI estimado (70x) justifica o preço dos planos. | ✅ Consistente |
| `mvp.md` | O MVP cobre todos os problemas listados. | ✅ Consistente |
| `domain-model.md` | As entidades resolvem os problemas: `Appointment` (faltas), `StockMovement` (consumo), `FinancialEvent` (lucro), `OutboxMessage` (comunicação). | ✅ Consistente |
| `business-rules.md` | As regras BR-APT-* e BR-FIN-* garantem a solução. | ✅ Consistente |
| `architecture.md` | A arquitetura suporta a integração de todos os módulos. | ✅ Consistente |
| `testing-strategy.md` | Testes de conflito e financeiro validam a solução. | ✅ Consistente |

---

## 8. Notas Finais para Agentes

- **O problema é econômico, não técnico.** Não estamos construindo um "sistema de agenda" — estamos resolvendo perda de receita e falta de controle.
- **O ROI é o argumento de venda.** O cliente não compra funcionalidades; compra o resultado: "recuperar R$ 14.000/mês".
- **O MVP é a solução mínima que entrega ROI mensurável.** Cada feature do `mvp.md` deve ser justificada por um dos problemas acima.
- **Valide com clientes.** O problema descrito aqui é uma hipótese fundamentada em dados do setor, mas deve ser validada com o ICP real durante as entrevistas de descoberta.

---

*End of problem.md*