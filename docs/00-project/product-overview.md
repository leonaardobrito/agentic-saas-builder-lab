# Product Overview — StyleFlow SaaS

**Status:** APPROVED TARGET
**Version:** 1.0
**Updated:** 2026-09-02
**Scope:** MVP — Beauty / Salões e Centros Estéticos
**Authority:** Visão unificada dos módulos e funcionalidades do produto

---

## 0. Como Agentes Devem Usar Este Documento

Este documento descreve **o que o produto faz, quais módulos o compõem e como eles se conectam** para resolver os problemas do mercado de beleza.

É a fonte da verdade para:
- Entender o escopo completo do produto (além do MVP).
- Comunicar o valor do produto para stakeholders e clientes.
- Orientar a priorização de features no `mvp.md` e no roadmap.

### Regras de Autoridade

- `product-overview.md` define **o que o produto oferece**.
- `mvp.md` define **o que é entregue agora**.
- `domain-model.md` define **as entidades que suportam cada módulo**.
- `business-model.md` define **como os módulos geram receita**.
- `problem.md` define **quais dores cada módulo resolve**.
- `architecture.md` define **como os módulos são implementados tecnicamente**.

---

## 1. Visão Geral do Produto

StyleFlow é uma **plataforma SaaS operacional para negócios de serviços presenciais**, começando com salões de beleza, clínicas de estética e barbearias.

O produto unifica **agenda, CRM, estoque, financeiro, comunicação (WhatsApp) e inteligência artificial** em um único painel, substituindo o uso de ferramentas fragmentadas (papel, WhatsApp, Excel, sistemas legados).

### Proposta de Valor Central

> **"Por menos de R$ 7 por dia, o salão recupera até R$ 14.000 por mês."**

StyleFlow transforma dados operacionais em **decisões financeiras e estratégicas**, aumentando o lucro, reduzindo faltas e fidelizando clientes.

---

## 2. Estrutura Modular (Arquitetura de Produto)

A plataforma é organizada em **três camadas**:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         SAAS CORE                                      │
│  • Identity / Auth • Organizations / Tenants • Users / Members        │
│  • Roles & Permissions (RBAC) • Audit Logs • Billing / Subscriptions  │
│  • Notifications • Files / Storage • Integrations (MCPs)              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      DOMAIN PLATFORM                                   │
│  • Customers (CRM) • Professionals • Services (Catalog)               │
│  • Scheduling (Appointments) • Transactions (Financial) • Inventory   │
│  • Communication (Messages, Templates)                                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      BEAUTY VERTICAL                                   │
│  • Beauty Customer Profile • Anamnesis (alergias, saúde, química)     │
│  • Hair History / Color Formula • Product Consumption (atendimento)   │
│  • Commission Rules • WhatsApp Workflows (com IA)                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Módulos Funcionais (Detalhados)

### 3.1. Auth & Multi‑Tenancy

**Funcionalidades:**
- Autenticação por email/senha (Supabase Auth).
- Isolamento total por `tenant_id` (RLS + validação em camadas).
- Onboarding guiado para novos usuários.
- Perfil e preferências do usuário.
- Modo demonstração sem cadastro (opcional).

**Entidades:** `Tenant`, `Membership`, `User` (gerenciado pelo Supabase Auth)

**Resolve:** Problema #4 (desconexão de dados e ferramentas).

---

### 3.2. Agenda & Agendamentos (core)

**Funcionalidades:**
- Calendário interativo (visualização diária/semanal).
- Agendamento de múltiplos serviços sequenciais.
- Bloqueio de horários (almoço, eventos, etc.).
- Detecção de conflitos (constraint GiST no banco).
- Status: `scheduled`, `confirmed`, `completed`, `cancelled`, `no_show`.
- Cancelamento e remarcação.

**Entidades:** `Professional`, `Service`, `Appointment`, `AppointmentItem`

**Resolve:** Problema #2 (faltas) e #4 (desconexão).

---

### 3.3. Clientes (CRM)

**Funcionalidades:**
- Cadastro: nome, telefone, email, CPF (obrigatório), endereço.
- Histórico de atendimentos e compras.
- Anamnese (alergias, química capilar, restrições de saúde) — com classificação de privacidade.
- Fidelidade (pontos) e tags (futuro).
- Segmentação para marketing (futuro).

**Entidades:** `Customer`, `CustomerNote`, `Anamnesis`, `ColorFormula`

**Resolve:** Problema #3 (baixa fidelização) e #4 (desconexão).

---

### 3.4. Profissionais

**Funcionalidades:**
- Entidade independente com ou sem login (`user_id` opcional).
- Comissão (% ou fixa) por serviço (definida em `CommissionRule`).
- Agenda individual com horários de trabalho (futuro).
- Performance (faturamento, ticket médio).

**Entidades:** `Professional`, `CommissionRule`

**Resolve:** Problema #1 (lucro invisível).

---

### 3.5. Serviços (Catálogo)

**Funcionalidades:**
- Cadastro com nome, categoria, preço, duração (minutos).
- Comissão customizável por profissional (via `CommissionRule`).
- Serviços compostos (pacotes) — futuro.
- Preço e duração snapshot (histórico) — preservado em `AppointmentItem`.

**Entidades:** `Service`, `ServiceProductDefault`

**Resolve:** Problema #1 (lucro invisível).

---

### 3.6. Estoque & Produtos

**Funcionalidades:**
- Produtos com unidade, SKU, fornecedor, validade, preço de custo/venda.
- Movimentações: entrada, saída, ajuste, perda, consumo, venda, devolução.
- Consumo registrado no atendimento (vinculado ao serviço/profissional) — `AppointmentConsumption`.
- Alertas de estoque mínimo e vencimento (futuro: `ActivityFeed`).

**Entidades:** `Product`, `StockMovement`, `AppointmentConsumption`

**Resolve:** Problema #1 (lucro invisível) e #4 (desconexão).

---

### 3.7. Financeiro (DRE, Contas)

**Funcionalidades:**
- Contas a pagar e receber.
- Receitas e despesas categorizadas (via `FinancialEvent` e `Expense`).
- Cálculo automático de comissão.
- DRE por mês/período.
- Fluxo de caixa projetado (futuro).

**Entidades:** `FinancialEvent`, `Expense`

**Resolve:** Problema #1 (lucro invisível) e #4 (desconexão).

---

### 3.8. Caixa (PDV)

**Funcionalidades:**
- Abertura e fechamento de caixa.
- Registro de vendas (serviços + produtos).
- Sangrias (retiradas) e suprimentos (reforços).
- Histórico de movimentos.

**Entidades:** `CashRegister`, `CashMovement` (futuro)

**Resolve:** Problema #4 (desconexão) — centraliza o registro de vendas.

---

### 3.9. WhatsApp & IA

**Funcionalidades:**
- Lembretes automáticos (24h e 2h antes).
- Confirmação de presença via resposta.
- IA (Gemini) para sugestão de reagendamento.
- Campanhas de marketing (reativação, aniversário) — futuro.
- Integração via webhook (Evolution API).

**Entidades:** `MessageTemplate`, `AutomationRule`, `OutboxMessage`

**Resolve:** Problema #2 (faltas) e #3 (baixa fidelização).

---

### 3.10. Portal do Cliente

**Funcionalidades:**
- Login seguro (email/telefone + senha).
- Visualização de agendamentos, histórico, pontos.
- Remarcação (com limite de 1 vez, 24h antes).
- Avaliações (NPS) — futuro.

**Entidades:** `Customer` (exposição limitada), `Appointment` (apenas do cliente)

**Resolve:** Problema #3 (fidelização) — engaja o cliente.

---

### 3.11. Fiscal (NFS‑e)

**Funcionalidades:**
- Emissão de NFS‑e Padrão Nacional (RFB/ADN).
- Suporte à Reforma Tributária (IBS/CBS).
- Ambiente de homologação e produção.
- Cancelamento de notas.

**Entidades:** `Invoice`, `FiscalConfiguration` (futuro)

**Resolve:** Problema #4 (desconexão) — integra emissão fiscal ao sistema.

---

### 3.12. Relatórios & Analytics

**Funcionalidades:**
- Faturamento diário/semanal/mensal.
- Ticket médio.
- Retenção de clientes.
- Top serviços e produtos.
- Performance por profissional.
- Gráficos interativos (Recharts).

**Entidades:** Agregações sobre `Appointment`, `FinancialEvent`, `StockMovement`, etc.

**Resolve:** Problema #1 (lucro invisível) e #4 (desconexão) — entrega visibilidade.

---

## 4. Decisões de Escopo (MVP vs. Pós‑MVP)

| Módulo | MVP | Pós‑MVP | Observações |
| :--- | :--- | :--- | :--- |
| **Auth & Multi‑Tenancy** | ✅ Sim | — | Essencial para qualquer SaaS. |
| **Agenda & Agendamentos** | ✅ Sim | — | Core do MVP. |
| **Clientes (CRM)** | ✅ Sim | Anamnese avançada, tags, segmentação | Básico no MVP (nome, CPF, telefone, histórico). |
| **Profissionais** | ✅ Sim | — | Essencial para agenda. |
| **Serviços** | ✅ Sim | — | Essencial para agenda. |
| **Estoque** | ⚠️ Básico (consumo) | Controle completo (entrada, saída, ajuste, validade, etc.) | MVP: apenas consumo no atendimento e alerta de mínimo. |
| **Financeiro** | ⚠️ Básico (comissão + DRE simples) | DRE completo, contas a pagar/receber, fluxo de caixa | MVP: comissão e receita/despesa por agendamento. |
| **Caixa (PDV)** | ⚠️ Básico | Completo (abertura/fechamento, sangrias, etc.) | MVP: registro de pagamento no atendimento. |
| **WhatsApp & IA** | ✅ Sim (lembretes) | Marketing, IA avançada (sugestões, análise de padrões) | MVP: lembretes 24h/2h e confirmação. |
| **Portal do Cliente** | ⚠️ Básico (histórico) | Remarcação, avaliação, fidelidade | MVP: apenas visualização de histórico (se der tempo). |
| **Fiscal (NFS‑e)** | ❌ Não | Futuro (v2) | Fora do MVP. |
| **Relatórios** | ⚠️ Básico | Analytics avançado (gráficos, preditivo) | MVP: apenas resumo de faturamento e ticket médio. |

**Legenda:** ✅ = incluído no MVP; ⚠️ = versão simplificada; ❌ = não incluído.

---

## 5. Roadmap de Evolução (MVP → Futuro)

| Fase | Módulos incluídos | Objetivo |
| :--- | :--- | :--- |
| **MVP** (Agora) | Auth, Tenant, RBAC, Scheduling, Customer (básico), Catalog, Inventory (consumo), Finance (comissão e DRE básico), Communication (Outbox + WhatsApp), Beauty (Anamnesis e fórmula), Caixa (básico), Relatórios (básico). | Validar o valor com 3 salões piloto. |
| **v1.1** (Pós-MVP) | Customer (portal), Communication (campanhas de marketing), Activity Feed (Painel de Comando). | Melhorar retenção e experiência do cliente. |
| **v1.2** | Finance (contas a pagar/receber), Inventory (rastreabilidade de lote), Loyalty (fidelidade). | Aprofundar controle financeiro e estoque. |
| **v2** | Fiscal (NFS‑e), Billing/Subscription (cobrança recorrente). | Expandir para cobrança fiscal e automatização de receita. |
| **v3+** | Novas verticais (Auto, Dental, Clínicas). | Reutilizar SaaS Core e Domain Platform. |

---

## 6. Integrações Externas (Adapters)

| Serviço | Propósito | Status |
| :--- | :--- | :--- |
| **Supabase** | Auth, PostgreSQL, Storage, Realtime. | Ativo (MVP). |
| **WhatsApp (Evolution API)** | Envio de lembretes, confirmações e mensagens automatizadas. | Ativo (MVP). |
| **Google Gemini (IA)** | Sugestões de reagendamento, análise de padrões. | Ativo (MVP). |
| **Stripe / Asaas** | Cobrança de assinaturas (futuro). | Futuro (v2). |
| **NFS‑e (RFB/ADN)** | Emissão de notas fiscais (futuro). | Futuro (v2). |
| **Sentry** | Monitoramento de erros (futuro). | Futuro (v1.1). |

---

## 7. Verificação de Consistência com Documentos Existentes

| Documento | Verificação | Status |
| :--- | :--- | :--- |
| `vision.md` | O product overview reflete a visão de "sistema operacional para serviços". | ✅ Consistente |
| `problem.md` | Os módulos resolvem todas as quatro dores descritas. | ✅ Consistente |
| `target-customer.md` | O escopo é adequado para salões pequenos/médios. | ✅ Consistente |
| `business-model.md` | Os módulos são agrupados em planos (Essential, Professional, Business). | ✅ Consistente |
| `mvp.md` | O MVP inclui todos os módulos essenciais. | ✅ Consistente |
| `domain-model.md` | Cada módulo tem suas entidades definidas. | ✅ Consistente |
| `architecture.md` | A estrutura de vertical slices suporta os módulos. | ✅ Consistente |
| `multi-tenancy.md` | Todos os módulos respeitam o isolamento de tenant. | ✅ Consistente |
| `security-baseline.md` | Módulos com dados sensíveis (Anamnesis) têm controles de segurança. | ✅ Consistente |
| `design-system.md` | A UI dos módulos segue o design system (shadcn/ui). | ✅ Consistente |
| `testing-strategy.md` | Cada módulo tem testes (unit/integration/E2E). | ✅ Consistente |
| `business-rules.md` | Regras como BR-APT-* (agendamento) e BR-FIN-* (financeiro) suportam os módulos. | ✅ Consistente |

---

## 8. Notas Finais para Agentes

- **O product overview é o "mapa do produto".** Use‑o para entender como as partes se conectam.
- **O MVP é um subconjunto.** Consulte `mvp.md` para saber o que implementar agora.
- **Novas features devem ser adicionadas a este documento primeiro.** Antes de codificar, verifique se o módulo já existe ou se precisa ser criado.
- **Integrações externas são adaptadores.** Não acople a lógica de domínio a provedores específicos (WhatsApp, Gemini, etc.).
- **O futuro é modular.** Cada módulo pode ser extraído ou substituído sem reescrever todo o sistema.
- **A tabela de escopo (MVP vs. futuro) é a bússola para priorização.** Se uma feature não está no MVP, **não a implemente** — documente e aguarde a próxima fase.

---

*End of product-overview.md*