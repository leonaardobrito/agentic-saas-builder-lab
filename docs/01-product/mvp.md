# MVP — StyleFlow SaaS

**Status:** APPROVED TARGET
**Version:** 1.0
**Updated:** 2026-09-02
**Scope:** Beauty — Salões e Centros Estéticos
**Authority:** Escopo mínimo viável para validação de mercado

---

## 0. Como Agentes Devem Usar Este Documento

Este documento define o **escopo mínimo absoluto** que deve ser entregue para que o produto seja considerado viável para validação com clientes reais.

É a fonte da verdade para decisões de priorização de features.

### Regras de Autoridade

- `mvp.md` define **o que deve ser construído agora**.
- `domain-model.md` define **as entidades que suportam o MVP**.
- `business-rules.md` define **as regras de negócio que devem ser implementadas**.
- `business-model.md` define **o que é cobrado em cada plano** (o MVP está no plano Essential).
- `architecture.md` define **como o MVP é tecnicamente estruturado**.
- `definition-of-done.md` define **quando uma feature do MVP está pronta**.

### Antes de implementar uma feature

O agente DEVE verificar:

1. A feature está listada em **Escopo Obrigatório (In Scope)**? Se não, ela **não faz parte do MVP**.
2. A feature é uma dependência de outra feature obrigatória? Se sim, priorize-a.
3. A feature pode ser simplificada ainda mais sem perder o valor de validação?

---

## 1. Objetivo do MVP

O MVP tem um único objetivo:

> **Validar que um salão consegue operar sua rotina diária (agenda, atendimento, consumo de produtos, faturamento e comunicação com clientes) utilizando o StyleFlow, substituindo papel/Excel/WhatsApp manual, em um período de 7 dias.**

Não estamos validando:
- Escalabilidade para milhares de usuários (isso vem depois).
- Integração fiscal completa (NFS‑e vem depois).
- Portal do cliente (vem depois).
- Fidelidade / Loyalty (vem depois).
- Múltiplos profissionais por agendamento (vem depois).
- Microserviços ou arquitetura distribuída (nunca no MVP).

---

## 2. Critérios de Sucesso (Exit Criteria)

O MVP será considerado bem‑sucedido quando:

- [ ] **3 salões piloto** utilizarem o sistema por 7 dias consecutivos.
- [ ] **50 agendamentos** forem realizados via sistema (média de ~16 por salão).
- [ ] **Testes de conflito** (GiST) bloqueiam corretamente agendamentos simultâneos para o mesmo profissional.
- [ ] **Lembretes via WhatsApp** são disparados e confirmados pelos clientes (pelo menos 70% de taxa de entrega).
- [ ] **Nenhum dado de um salão vaza para outro** (teste de isolamento RLS executado e aprovado).
- [ ] **Pelo menos 1 dos pilotos** se dispõe a pagar pelo plano Professional (R$ 199/mês) após o trial.

---

## 3. Escopo Obrigatório (In Scope)

### 3.1. Autenticação e Multi‑Tenancy (Auth & Tenant)

| Feature | Descrição | Critério de Aceitação |
| :--- | :--- | :--- |
| **Cadastro de usuário** | Usuário se registra com email/senha (Supabase Auth). | O usuário recebe um e‑mail de confirmação (opcional no MVP). |
| **Criação de tenant** | Após o cadastro, o usuário cria seu salão (tenant). | O tenant é criado com `name`, `timezone` (default America/Sao_Paulo) e `currency` (default BRL). |
| **Login / Logout** | Usuário faz login e logout. | Sessão gerenciada por cookies HTTP‑only (`@supabase/ssr`). |
| **Convite de membros** | O owner pode convidar outros usuários para o tenant (por e‑mail). | O convidado recebe um link de ativação. |
| **RBAC básico** | Papéis: `owner`, `admin`, `manager`, `receptionist`, `professional`, `financial`. | Cada papel tem permissões distintas (ex: professional vê apenas seus próprios agendamentos). |

**Referência:** `multi-tenancy.md` (Seções 2, 3, 4)

---

### 3.2. Agendamento (Scheduling)

| Feature | Descrição | Critério de Aceitação |
| :--- | :--- | :--- |
| **Cadastro de profissionais** | Profissional com `name`, `active`, `user_id` (opcional). | Profissional pode existir sem login. |
| **Cadastro de serviços** | Serviço com `name`, `category`, `price`, `duration_minutes`, `active`. | Duração mínima: 15 minutos. |
| **Criação de agendamento** | Seleciona cliente, profissional, serviços, data/hora. | `Appointment` com `status = 'scheduled'`. |
| **Conflito de horário (GiST)** | Impede agendamentos sobrepostos para mesmo profissional/tenant. | Constraint de exclusão no PostgreSQL (`BR-APT-003`). |
| **Status do agendamento** | `scheduled` → `confirmed` → `completed`; ou `cancelled` / `no_show`. | Apenas `scheduled` e `confirmed` bloqueiam a agenda. |
| **Adjacência permitida** | Agendamentos consecutivos (`[10:00, 11:00)` e `[11:00, 12:00)`) são permitidos. | Intervalos half‑open (`[start, end)`). |
| **Cancelamento** | Agendamento pode ser cancelado (status `cancelled`). | Permite cancelamento a qualquer momento (regras de 2h são FUTURE). |
| **Visualização da agenda** | Calendário (diário/semanal) mostrando agendamentos. | Interface mobile‑first, com slots de 15 minutos. |

**Referência:** `domain-model.md` (Seção 3), `business-rules.md` (BR-APT-001 a BR-APT-005)

---

### 3.3. Clientes (Customers)

| Feature | Descrição | Critério de Aceitação |
| :--- | :--- | :--- |
| **Cadastro de cliente** | `full_name`, `phone`, `email` (opcional), `birth_date` (opcional). | `phone` é único por tenant (pode ser usado como identificador). |
| **Histórico de atendimentos** | Cliente vê lista de agendamentos passados (datas, serviços, profissionais). | Lista ordenada por data decrescente. |
| **Anamnese básica** | Campos: `allergies`, `sensitivity`, `hair_type`, `health_restrictions`. | `privacy_level = 'restricted'`. Apenas profissionais autorizados podem ver. |
| **Notas do cliente** | Campo de texto livre para observações. | Acesso restrito a `owner`, `admin`, `manager`, `professional` (com relação). |

**Referência:** `domain-model.md` (Seção 4), `business-rules.md` (BR-CUS-001, BR-CUS-002, BR-CUS-004)

---

### 3.4. Estoque e Consumo (Inventory & Consumption)

| Feature | Descrição | Critério de Aceitação |
| :--- | :--- | :--- |
| **Cadastro de produtos** | `name`, `sku` (opcional), `unit`, `cost_price`, `sale_price`, `stock_quantity`, `min_stock`, `expiry_date` (opcional). | Produto pertence ao tenant. |
| **Consumo esperado (ServiceProductDefault)** | Serviço pode ter produtos esperados (ex: "Tintura" consome 1 caixa de tinta X). | Consumo esperado não é automaticamente aplicado; é uma sugestão. |
| **Consumo real (AppointmentConsumption)** | No atendimento (completion), registra quais produtos foram usados, com `quantity` e `cost_price_snapshot`. | O consumo real é registrado como uma movimentação de estoque. |
| **Movimentação de estoque (StockMovement)** | Movimentações auditáveis: `entry`, `consumption`, `adjustment`, `loss`. | Append‑only. Atualização de `stock_quantity` é atômica com a inserção. |
| **Alerta de estoque baixo** | Quando `stock_quantity <= min_stock`, exibe alerta (futuro: ActivityFeed). | UI exibe um badge ou ícone de aviso na lista de produtos. |

**Referência:** `domain-model.md` (Seção 6), `business-rules.md` (BR-INV-001, BR-INV-002, BR-INV-003)

---

### 3.5. Financeiro e Comissão (Finance & Commission)

| Feature | Descrição | Critério de Aceitação |
| :--- | :--- | :--- |
| **Registro de receita (FinancialEvent)** | Ao completar um agendamento, cria `FinancialEvent` do tipo `income`. | Append‑only. Não pode ser editado ou deletado. |
| **Registro de despesas (Expense)** | Cadastro de despesas (aluguel, água, luz, etc.) com `amount`, `due_date`, `paid_at`. | Despesa pode ser marcada como paga. |
| **Cálculo de comissão (CommissionRule)** | Percentual fixo sobre o valor líquido (após descontos). Regras: `global`, `professional`, `service`. | Comissão é calculada no momento do `completion` e registrada como `FinancialEvent` do tipo `commission`. |
| **DRE básico** | Relatório de receitas - despesas = lucro líquido (mensal). | Apenas dados consolidados (sem gráficos avançados no MVP). |

**Referência:** `domain-model.md` (Seção 7), `business-rules.md` (BR-FIN-001, BR-FIN-002, BR-FIN-003)

---

### 3.6. Comunicação (Communication)

| Feature | Descrição | Critério de Aceitação |
| :--- | :--- | :--- |
| **Templates de mensagem** | Templates provider‑neutros (ex: "Lembrete 24h", "Confirmação"). | Não acoplado ao WhatsApp. |
| **Outbox Pattern** | Ao criar agendamento, cria `OutboxMessage` com `status = 'pending'`. | `OutboxMessage` contém `destination`, `template_id`, `scheduled_at`. |
| **Disparo de lembretes** | Worker (cron) verifica agendamentos do dia seguinte e dispara mensagens. | Lembrete enviado 24h antes (MVP) e 2h antes (opcional). |
| **Automação básica** | `AutomationRule` dispara template baseado em evento (ex: `appointment.created`). | Implementado com um cron job simples (sem filas complexas no MVP). |
| **Integração WhatsApp** | Adapter para Evolution API ou similar. | MVP usa um provedor real (ou mock para testes locais). |

**Referência:** `domain-model.md` (Seção 8), `business-rules.md` (BR-COM-001, BR-COM-002, BR-COM-003)

---

### 3.7. Vertical Beleza (Beauty)

| Feature | Descrição | Critério de Aceitação |
| :--- | :--- | :--- |
| **Fórmula de cor (ColorFormula)** | Registro de fórmula personalizada para cliente: `proportions`, `oxidant`, `technique`. | Vinculado ao cliente e opcionalmente a um agendamento. |

**Referência:** `domain-model.md` (Seção 9)

---

## 4. Escopo Excluído (Fora do MVP)

Os itens abaixo **não fazem parte do MVP** e não devem ser implementados:

| Feature | Motivo | Quando Implementar |
| :--- | :--- | :--- |
| **Múltiplos profissionais por agendamento** | Aumenta complexidade de conflito e UI. | Pós‑MVP, se validado com clientes. |
| **Portal do Cliente** | Cliente remarcar, ver histórico, avaliar. | Pós‑MVP (v1.1). |
| **NFS‑e / Fiscal** | Complexidade legal e integração com prefeituras. | Quando clientes exigirem (v2). |
| **Loyalty / Pontos** | Programa de fidelidade. | Pós‑MVP (v1.2). |
| **Relatórios Avançados** | Gráficos complexos, análise preditiva. | Pós‑MVP (v1.1). |
| **Painel de Comando (Activity Feed UI)** | UI do feed unificado (Agenda, Caixa, Estoque, Comunicação). | **FUTURE** (tabela pode ser criada para coleta, mas UI não). |
| **Integração com contador** | Exportação automática para contador. | Pós‑MVP (v1.2). |
| **Campanhas de marketing (WhatsApp)** | Disparo em massa, segmentação. | Pós‑MVP (v1.1). |
| **Rastreabilidade de lote** | Controle de validade / lote de produtos. | Pós‑MVP (v1.2). |
| **Pagamentos online** | Checkout para cliente pagar online. | Pós‑MVP (v2). |
| **Multi‑unidade consolidado** | Visão consolidada de várias unidades. | Pós‑MVP (v1.1). |

---

## 5. Não‑Metas Técnicas (Technical Non‑Goals)

- **Microserviços:** O MVP é um monólito modular (Next.js).
- **Filas / Mensageria:** O MVP usa cron + Outbox, sem filas dedicadas (ex: Bull, SQS).
- **Cache externo:** O MVP usa caching do Next.js (ISR) sem Redis/Memcached.
- **Kubernetes / Docker Swarm:** Deploy simplificado na Vercel.
- **Migração de dados em tempo real:** Migração de dados legados é manual (planilha CSV) no MVP.
- **Multi‑provedor de IA:** O MVP pode usar apenas Gemini (ou um único provedor).

---

## 6. Premissas (Assumptions)

- O salão possui acesso à internet e um smartphone/tablet/desktop.
- O dono do salão é o "operador principal" no primeiro mês.
- O WhatsApp é o canal principal de comunicação com clientes.
- O salão possui CNPJ (para emissão futura de NFS‑e, embora não seja MVP).
- O salão tem no mínimo 2 profissionais (para testar conflito de agenda).

---

## 7. Riscos do MVP e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
| :--- | :--- | :--- | :--- |
| **Usuários não entendem a UI** | Alta | Alto | Onboarding guiado com vídeos curtos (YouTube). |
| **Falha na integração WhatsApp** | Média | Alto | Mock para testes locais; provedor real com fallback para SMS (futuro). |
| **Conflito de agendamento não bloqueia** | Baixa | Muito Alto | Testes de integração com GiST (BR-APT-003) garantem a constraint. |
| **Estoque não é confiável** | Média | Médio | Movimentações auditáveis; `stock_quantity` atualizado atomicamente. |
| **Churn alto no trial** | Alta | Muito Alto | Suporte proativo (e‑mails de onboarding, dicas de uso). |
| **Custo de infraestrutura estoura** | Média | Médio | Supabase free tier (50k MAU) + Vercel Hobby (grátis) são suficientes para pilotos. |

---

## 8. Plano de Entregas (Sprints)

O MVP é entregue em **4 sprints (2 semanas cada)**:

| Sprint | Foco | Entregáveis |
| :--- | :--- | :--- |
| **Sprint 1** | Fundação | Auth + Multi‑tenancy + Profissionais + Serviços + Clientes. |
| **Sprint 2** | Agendamento | Appointment (CRUD) + Conflito (GiST) + Status flow. |
| **Sprint 3** | Estoque + Financeiro | Estoque, consumo, comissão, DRE básico. |
| **Sprint 4** | Comunicação + Validação | Outbox + WhatsApp + Lembretes + Testes E2E + Piloto. |

**Atenção:** O desenvolvimento segue TDD (`tdd.md`) e a Definição de Pronto (`definition-of-done.md`).

---

## 9. Verificação de Consistência com Outros Documentos

| Documento | Verificação | Status |
| :--- | :--- | :--- |
| `domain-model.md` | Todas as entidades do MVP estão modeladas. | ✅ Consistente |
| `business-rules.md` | BR-APT-003 (GiST), BR-FIN-001 (append‑only), BR-COM-002 (outbox) estão contemplados. | ✅ Consistente |
| `architecture.md` | A estrutura de vertical slices suporta as features. | ✅ Consistente |
| `multi-tenancy.md` | O isolamento de tenant está garantido (RLS, composite FK). | ✅ Consistente |
| `security-baseline.md` | Autenticação, autorização e LGPD estão cobertos. | ✅ Consistente |
| `business-model.md` | O MVP está no plano Essential (R$ 79–99/mês). | ✅ Consistente |
| `design-system.md` | As UI components do MVP seguem o design system (shadcn/ui). | ✅ Consistente |
| `testing-strategy.md` | Testes de conflito e isolamento são obrigatórios para o MVP. | ✅ Consistente |
| `definition-of-done.md` | Todos os critérios de pronto se aplicam ao MVP. | ✅ Consistente |
| `AGENTS.md` | Agentes devem seguir este documento para priorização. | ✅ Consistente |

---

## 10. Nota Final para Agentes

**O MVP é o único escopo que deve ser implementado agora.**

Se você, agente, identificar uma feature que não está listada aqui, **não a implemente**. Documente a sugestão em `memory/` e aguarde uma decisão humana.

Se uma feature listada aqui parecer grande demais para uma sprint, **quebre‑a em tarefas menores** (ex: "criar appointment" → "criar schema", "criar use case", "criar UI").

O sucesso do MVP é medido por **clientes usando o sistema**, não por quantidade de código escrito.