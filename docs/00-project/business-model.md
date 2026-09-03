# Business Model — StyleFlow SaaS

**Status:** APPROVED HYPOTHESIS (A ser validado com clientes)
**Version:** 1.0
**Updated:** 2026-09-02
**Scope:** MVP — Beauty / Salões e Centros Estéticos
**Authority:** Estratégia de monetização e viabilidade econômica

---

## 0. Como Agentes Devem Usar Este Documento

Este documento define a **estratégia de monetização, precificação e viabilidade econômica** do StyleFlow.

É uma fonte de verdade para decisões de negócio que impactam a arquitetura (ex: necessidade de módulo de assinaturas, limites por plano).

### Regras de Autoridade

- `business-model.md` define **como o produto gera receita**.
- `mvp.md` define **o que está incluso no MVP**.
- `domain-model.md` define **as entidades que suportam assinaturas/planos** (futuro).
- `target-customer.md` define **quem paga e qual a capacidade de pagamento**.

### Antes de implementar uma feature

O agente DEVE verificar:

1. A feature está inclusa no plano mais básico (Essential) ou é um upsell?
2. A feature gera custo variável (ex: envio de WhatsApp, uso de IA) que precisa ser medido?
3. A feature impacta a arquitetura de billing/assinaturas?

---

## 1. Modelo de Receita (Revenue Model)

### 1.1. Modelo Primário

**Assinatura SaaS recorrente (mensal ou anual)** por tenant (salão/unidade).

- **Justificativa:** Receita previsível, alinhada ao valor entregue (operações contínuas do negócio).
- **Ciclo de cobrança:** Mensal (padrão) ou anual (com desconto).

### 1.2. Modelo Secundário (Futuro)

- **Uso sob demanda:** Créditos para WhatsApp, IA, ou integrações fiscais que geram custo variável real.
- **Add-ons:** Módulos avançados (ex: NFS‑e, Portal do Cliente, IA Avançada) que não estão no MVP.

**Importante:** O MVP é 100% focado em assinatura. Nenhuma funcionalidade do MVP deve ser cobrada por uso.

---

## 2. Hipóteses de Precificação (Pricing Hypotheses)

Os valores abaixo são **âncoras para validação com clientes**. A precificação final será definida após testes de disposição a pagar (Willingness to Pay).

### 2.1. Planos (MVP)

| Plano | Preço Mensal (Hipótese) | Perfil de Cliente | Escopo (MVP) | Limites |
| :--- | :--- | :--- | :--- | :--- |
| **Essential** | **R$ 79 – R$ 99** | Salão pequeno (1–3 profissionais). Dono opera sozinho. | Agenda, clientes, serviços, lembretes manuais, 1 usuário admin + 2 profissionais. | 50 agendamentos/mês. |
| **Professional** | **R$ 199 – R$ 249** | Salão médio (4–8 profissionais). Precisa de controle financeiro e automação. | Tudo do Essential + Comissões, consumo de estoque, DRE básico, lembretes automáticos (WhatsApp), 5 usuários. | 200 agendamentos/mês. |
| **Business** | **R$ 349 – R$ 499** | Múltiplas unidades (franquias). Precisa de visão consolidada. | Tudo do Professional + Múltiplas unidades, relatórios consolidados, permissões avançadas, suporte prioritário. | Ilimitado (dentro do razoável). |

**Observações:**
- O **Plano Essential** cobre 100% do MVP definido em `mvp.md`. É o "ticket de entrada".
- O **Plano Professional** adiciona recursos de diferenciação (financeiro, estoque, automação) que geram ROI direto para o cliente.
- **Todos os planos** incluem suporte por e-mail e chat.

### 2.2. Descontos para Planos Anuais

- **12 meses:** 2 meses grátis (R$ 199 x 10 = R$ 1.990/ano vs. R$ 2.388 no mensal).
- **Justificativa:** Melhora o cash flow e reduz o churn.

---

## 3. Add-ons e Upsells (Futuro)

| Add-on | Preço Estimado (Mensal) | Descrição |
| :--- | :--- | :--- |
| **IA Marketing** | +R$ 50 | Campanhas automáticas de reativação, aniversário, recomendações. |
| **WhatsApp Créditos Adicionais** | Conforme uso | Lembretes, notificações e confirmações acima da franquia do plano. |
| **Módulo Fiscal (NFS‑e)** | +R$ 40 | Emissão de notas, homologação, suporte à Reforma Tributária. |
| **Portal do Cliente** | +R$ 30 | Cliente acessa histórico, remarca, vê pontos e avaliações. |
| **Onboarding / Treinamento Premium** | R$ 500 (one‑time) | Implantação personalizada com consultor (migração de dados, treinamento). |

**Regra:** Nenhum add-on é obrigatório para o MVP. Todos são opcionais e devem ser implementados apenas após validação da demanda.

---

## 4. Estratégia de Precificação (Pricing Psychology)

### 4.1. Preço Âncora

- O Plano Professional (R$ 249) é o "produto principal".
- O Plano Essential (R$ 99) serve como "isca" para atrair pequenos negócios e fazer upgrade.
- O Plano Business (R$ 499) é o "produto premium" que justifica o valor do Professional.

### 4.2. Valor Percebido

O preço é justificado pelo **ROI estimado**:

| Problema Resolvido | Economia / Ganho Mensal (salão médio) |
| :--- | :--- |
| Faltas / Cancelamentos | R$ 4.500 |
| Lucro invisível por serviço | R$ 4.500 |
| Baixa fidelização | R$ 3.000 |
| **Total** | **R$ 12.000/mês** |
| **Custo do SaaS (Professional)** | **R$ 249/mês** |
| **ROI** | **48x** |

Comunicação de marketing: *"Por menos de R$ 8 por dia, você recupera R$ 12.000 por mês."*

---

## 5. Economia Unitária (Unit Economics)

| Métrica | Hipótese (Valor) | Fonte / Justificativa |
| :--- | :--- | :--- |
| **CAC (Custo de Aquisição)** | R$ 150 – R$ 300 | Founder‑led, indicações e parcerias (baixo custo inicial). |
| **Ticket Médio Mensal (ARPU)** | R$ 150 | Mix de planos Essential (R$ 99) e Professional (R$ 199). |
| **LTV (Tempo de Vida Médio)** | 18 meses | Baseado em médias de SaaS B2B no Brasil. |
| **LTV Total** | R$ 2.700 | ARPU * LTV (R$ 150 * 18). |
| **CAC / LTV** | 1:9 | Excelente (saudável > 1:3). |
| **Margem Bruta** | ~85% | Infraestrutura (Vercel, Supabase) + suporte. |
| **Churn Mensal (Alvo)** | < 3% | Necessário para sustentar o modelo. |
| **Churn Anual (Alvo)** | < 30% | — |
| **Payback (Tempo de Retorno do CAC)** | < 3 meses | (CAC / MRR) = R$ 200 / R$ 150 = 1,3 meses. |

### 5.1. Custo Variável (Por Cliente)

| Item | Custo Mensal Estimado | Notas |
| :--- | :--- | :--- |
| Infraestrutura (Vercel + Supabase) | R$ 5 – R$ 10 | Compartilhado entre tenants. |
| WhatsApp (créditos) | R$ 5 – R$ 15 | Depende do volume de mensagens (incluído na assinatura). |
| IA (Gemini) | R$ 2 – R$ 5 | Apenas para lembretes e sugestões (baixo custo). |
| Suporte | R$ 10 – R$ 20 | Founder‑led no início. |
| **Custo Total** | **R$ 22 – R$ 50** | — |

**Margem de Contribuição:** ~70% – 85% (saudável para SaaS).

---

## 6. Estratégia de Aquisição (Go‑to‑Market)

### 6.1. Canais Iniciais (MVP)

| Canal | Custo Estimado (Lead) | Estratégia |
| :--- | :--- | :--- |
| **Indicação (Referral)** | Baixo (~R$ 0) | Incentive clientes a indicarem outros salões (desconto ou créditos). |
| **Google Ads (Palavras‑chave)** | R$ 20 – R$ 40 | "Sistema para salão", "agenda para salão", "software para estética". |
| **Instagram / Facebook** | R$ 10 – R$ 30 | Segmentação geográfica (cidades com > 50 mil hab.) e interesse (beleza, estética). |
| **Parcerias com Distribuidores** | Comissão sobre venda | Distribuidores de cosméticos (ex: L'Oréal, Wella) indicam para seus clientes. |
| **Cold Outreach (WhatsApp/DM)** | Baixo (~R$ 0) | Abordagem manual para salões específicos (ICP). |
| **Conteúdo (Blog / YouTube)** | Baixo (tempo) | Conteúdo sobre gestão de salões, ROI, redução de faltas. |

### 6.2. Funil de Vendas (Pipeline)

```text
LEADS
   │
   ▼
DEMO / TESTE GRATUITO (7 dias)
   │
   ▼
ATIVAÇÃO (primeiro agendamento)
   │
   ▼
USO CONTÍNUO (7+ dias)
   │
   ▼
PAGO (primeira assinatura)
   │
   ▼
RETENÇÃO (uso contínuo + expansão)
```

### 6.3. Trial e Ativação

- **Trial gratuito:** 7 dias (sem cartão de crédito para reduzir barreira).
- **Ativação:** Primeiro agendamento criado no sistema.
- **Triggers de conversão:** E‑mails de onboarding, lembretes de "seu salão está pronto", dicas de uso.

---

## 7. Riscos e Mitigações (Business Risks)

| Risco | Probabilidade | Impacto | Mitigação |
| :--- | :--- | :--- | :--- |
| **Churn elevado (>5%/mês)** | Média | Alto | Onboarding guiado, suporte proativo, coleta de feedback contínuo. |
| **CAC elevado (>R$ 500)** | Média | Médio | Foco em canais orgânicos (indicação, conteúdo) antes de escalar anúncios. |
| **Ticket médio baixo (<R$ 100)** | Média | Médio | Foco em upsell para Professional; justificar valor com ROI claro. |
| **Subestimação do custo de suporte** | Alta | Médio | Founder‑led no início; automação de FAQ e chatbots (futuro). |
| **Feature creep (excesso de funcionalidades)** | Alta | Alto | Disciplina do `mvp.md`; validar cada nova feature com clientes pagantes. |
| **Concorrência com players grandes** | Média | Médio | Foco em diferenciais: IA, WhatsApp, Painel de Comando, experiência mobile. |
| **Expansão prematura para outras verticais** | Alta | Muito Alto | Foco em Beauty por 12‑18 meses antes de pensar em Auto/Dental. |

---

## 8. Métricas de Sucesso (KPIs)

### 8.1. Métricas de Negócio (Acompanhamento Semanal)

| Métrica | Definição | Meta (Mensal) |
| :--- | :--- | :--- |
| **MRR (Monthly Recurring Revenue)** | Receita recorrente mensal. | Crescimento de 10% mês a mês. |
| **Trial → Paid Conversion** | % de usuários que se tornam pagantes. | > 20% |
| **Churn (Logo)** | % de clientes que cancelam a assinatura. | < 3% |
| **Churn (Revenue)** | % de receita perdida por cancelamentos. | < 4% |
| **ARPU (Average Revenue Per User)** | Receita média por cliente pagante. | R$ 150 – R$ 200 |
| **CAC Payback** | Meses para recuperar o custo de aquisição. | < 6 meses |
| **NPS (Net Promoter Score)** | Satisfação do cliente. | > 50 |

### 8.2. Métricas de Produto (Ativação)

| Métrica | Definição |
| :--- | :--- |
| **Ativação (Activation)** | Primeiro agendamento criado (< 3 dias). |
| **Retenção de Dia 7** | Usuário ainda ativo após 7 dias. |
| **Retenção de Dia 30** | Usuário ainda ativo após 30 dias. |
| **Feature Adoption** | % de usuários que usam estoque, financeiro, WhatsApp. |

---

## 9. Decisões Estratégicas (Fechamento)

| Decisão | Decisão | Impacto |
| :--- | :--- | :--- |
| **Modelo de cobrança** | Assinatura mensal/anual. | Não há modelo "pay‑per‑use" no MVP. |
| **Plano gratuito (Free)** | **Não.** Apenas trial de 7 dias. | Evita usuários que não geram receita e custam suporte. |
| **Cobrança por usuário** | **Não.** Cobrança fixa por salão/unidade. | Simplifica a precificação e incentiva adoção pela equipe. |
| **Cobrança por WhatsApp** | **Não no MVP.** Será add‑on futuro. | Reduz complexidade de billing no início. |
| **Cobrança internacional** | **Não no MVP.** Apenas BRL. | Foco no mercado brasileiro. |
| **Gateways de pagamento** | Stripe (internacional), Asaas (Brasil). | A definir conforme estratégia de cobrança. |

---

## 10. Rastreabilidade (Traceability)

| Documento | Relação |
| :--- | :--- |
| `mvp.md` | Define escopo incluso em cada plano. |
| `target-customer.md` | Define ICP e capacidade de pagamento. |
| `vision.md` | Define a visão de longo prazo (SaaS modular). |
| `problem.md` | Justifica o valor econômico do produto. |
| `domain-model.md` | Entidades que suportam billing (futuro). |

---

## 11. Notas Finais (Para Agentes e Fundadores)

- **Precificação é uma hipótese.** Os valores acima são para validação. Após 10 clientes pagantes, ajuste a precificação com base em feedback e disposição a pagar.
- **O MVP não cobra por funcionalidade.** Tudo no `mvp.md` está incluso no plano Essential. Isso simplifica a entrega e evita "vendas de features" antes de provar valor.
- **Upsell é o caminho.** O plano Professional deve ser apresentado como o "próximo passo natural" para salões que crescem.
- **Churn é o assassino silencioso.** Invista em onboarding, suporte e métricas de satisfação desde o dia 1.

---