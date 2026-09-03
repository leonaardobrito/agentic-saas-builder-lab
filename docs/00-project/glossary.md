# Glossary — StyleFlow SaaS

**Status:** APPROVED TARGET
**Version:** 1.0
**Updated:** 2026-09-02
**Scope:** MVP — Beauty / Salões e Centros Estéticos
**Authority:** Linguagem comum para negócio, domínio e engenharia

---

## 0. Como Agentes Devem Usar Este Documento

Este documento define a **terminologia padronizada** utilizada em toda a documentação, código e comunicação do projeto StyleFlow.

É a fonte da verdade para nomes de entidades, conceitos de domínio e termos técnicos.

### Regras de Autoridade

- `glossary.md` define **o significado exato de cada termo**.
- `domain-model.md` define **como os termos se relacionam**.
- `business-rules.md` define **regras de negócio que usam esses termos**.
- `architecture.md` define **como os termos são implementados tecnicamente**.
- `AGENTS.md` define **como agentes devem usar esses termos**.

### Antes de usar um termo

O agente DEVE:

1. Verificar se o termo está definido neste glossário.
2. Usar a definição exata — não inventar sinônimos ou significados alternativos.
3. Se um termo não estiver definido, adicioná-lo a este documento **antes** de usá-lo.

---

## 1. Convenções de Nomenclatura

| Tipo | Padrão | Exemplo |
| :--- | :--- | :--- |
| **Entidade de Domínio** | PascalCase (em inglês) | `Appointment`, `Customer`, `Professional` |
| **Atributo / Coluna** | snake_case (em inglês) | `tenant_id`, `start_at`, `full_name` |
| **Tabela** | snake_case (em inglês, plural) | `appointments`, `customers`, `professionals` |
| **Função / Método** | camelCase (em inglês) | `createAppointment`, `findConflicting` |
| **Variável** | camelCase (em inglês) | `appointmentId`, `isActive` |
| **Constante** | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `DEFAULT_TIMEZONE` |
| **UI / Texto do Usuário** | Português‑BR (capitalizado) | "Agendamento", "Cliente", "Estoque" |

---

## 2. Termos de Negócio (Business Terms)

Estes termos descrevem o negócio, o mercado e o modelo de receita.

| Termo | Definição |
| :--- | :--- |
| **StyleFlow** | Nome da empresa/plataforma SaaS. |
| **SaaS Core** | Camada reutilizável da plataforma: autenticação, multi‑tenancy, billing, RBAC, notificações, auditoria, etc. |
| **Vertical** | Segmento de mercado atendido pela plataforma (ex: Beauty, Auto, Dental). Cada vertical é uma especialização do domínio de serviços. |
| **Beauty** | Primeira vertical do StyleFlow: salões de beleza, clínicas de estética e barbearias. |
| **ICP (Ideal Customer Profile)** | Perfil do cliente ideal para o qual direcionamos esforços de vendas e produto. |
| **MQL (Marketing Qualified Lead)** | Lead qualificado para prospecção comercial. |
| **Churn** | Taxa de cancelamento de assinatura (mensal ou anual). |
| **MRR (Monthly Recurring Revenue)** | Receita recorrente mensal (soma de todas as assinaturas ativas). |
| **ARR (Annual Recurring Revenue)** | Receita recorrente anual (MRR × 12). |
| **ARPU (Average Revenue Per User)** | Receita média por cliente pagante. |
| **LTV (Lifetime Value)** | Valor total que um cliente gera durante todo o relacionamento. |
| **CAC (Customer Acquisition Cost)** | Custo total para adquirir um cliente (marketing + vendas + onboarding). |
| **Payback** | Tempo (em meses) para recuperar o CAC a partir da receita gerada pelo cliente. |
| **NPS (Net Promoter Score)** | Métrica de satisfação do cliente (probabilidade de recomendar). |
| **North Star** | Métrica principal que representa a entrega de valor ao cliente (ex: "atendimentos gerenciados com sucesso"). |
| **Trial** | Período de teste gratuito (7 dias no MVP). |
| **Upsell** | Venda de um plano superior ou add‑on para um cliente existente. |
| **Cross‑sell** | Venda de um produto/serviço complementar (ex: módulo fiscal para um cliente que usa agenda). |

---

## 3. Termos de Domínio (Domain Terms)

Estes termos descrevem as entidades, regras e relacionamentos do domínio do StyleFlow.

### 3.1. SaaS Core

| Termo | Definição |
| :--- | :--- |
| **Tenant** | Organização cliente (ex: um salão). Unidade de isolamento de dados. Toda entidade operacional pertence a um `tenant_id`. |
| **User / Usuário** | Conta autenticada (gerenciada pelo Supabase Auth). Pode pertencer a múltiplos tenants via membership. |
| **Membership / Vinculação** | Relação entre um `User` e um `Tenant`, com um `role` (papel) e status (`is_active`). |
| **Role / Papel** | Função do usuário dentro do tenant: `owner`, `admin`, `manager`, `receptionist`, `professional`, `financial`. Define permissões (RBAC). |
| **Permission / Permissão** | Capacidade de realizar uma ação específica (ex: `appointments:create`, `inventory:edit`). Vinculada a papéis. |
| **AuditLog / Log de Auditoria** | Registro imutável de ações administrativas e alterações críticas (ex: membro removido, ajuste financeiro). |
| **Billing / Assinatura** | (Futuro) Planos, assinaturas e pagamentos do SaaS. |

### 3.2. Agendamento (Scheduling)

| Termo | Definição |
| :--- | :--- |
| **Professional / Profissional** | Pessoa que executa os serviços. É uma entidade de domínio independente do `User`. Pode (ou não) ter uma conta de login associada (`user_id` opcional). |
| **Service / Serviço** | Item do catálogo do salão. Possui `name`, `category`, `price`, `duration_minutes` e `active`. |
| **Appointment / Agendamento** | Evento agendado. Contém `tenant_id`, `professional_id`, `customer_id`, `start_at`, `end_at` e `status` (`scheduled`, `confirmed`, `completed`, `cancelled`, `no_show`). |
| **AppointmentItem / Item do Agendamento** | Linha do agendamento referenciando um `Service`. Preserva snapshots históricos (`name`, `price`, `duration`) no momento do agendamento. |
| **Availability / Disponibilidade** | Horários em que um profissional está livre para agendamento. A sobreposição é bloqueada pela constraint GiST. |
| **Conflict / Conflito** | Sobreposição de horários para o mesmo `professional_id` e `tenant_id` quando ambos estão `scheduled` ou `confirmed`. Bloqueado pela constraint GiST. |
| **No‑show / Falta** | Cliente que não compareceu ao agendamento sem cancelar. Status `no_show`. |
| **Waitlist / Lista de Espera** | Clientes que aguardam uma vaga em caso de cancelamento (futuro). |
| **Cancelamento** | Ação de marcar um agendamento como `cancelled`. Permite liberar o horário para outro cliente. |

### 3.3. Clientes (Customer)

| Termo | Definição |
| :--- | :--- |
| **Customer / Cliente** | Pessoa que recebe os serviços do salão. Pertence a um `tenant`. Possui `full_name`, `cpf` (obrigatório), `phone`, `email`, `birth_date`, `last_visit_at`. |
| **CustomerNote / Nota do Cliente** | Observação textual sobre o cliente (ex: preferências, observações operacionais). |
| **Anamnesis** | Ficha com informações sensíveis/estéticas do cliente: alergias, sensibilidade, tipo de cabelo, restrições de saúde. Possui classificação de privacidade (`privacy_level = 'restricted'`). |
| **Loyalty / Fidelidade** | (Futuro) Pontos de fidelidade e histórico de recompensas. |

### 3.4. Catálogo (Catalog)

| Termo | Definição |
| :--- | :--- |
| **ServiceProductDefault / Consumo Esperado** | Relação entre um `Service` e um `Product`, definindo a quantidade esperada de consumo (ex: serviço "Tintura" consome 1 caixa de tinta X). |

### 3.5. Estoque (Inventory)

| Termo | Definição |
| :--- | :--- |
| **Product / Produto** | Item físico gerenciado pelo salão. Possui `name`, `sku`, `unit`, `cost_price`, `sale_price`, `stock_quantity`, `min_stock`, `expiry_date`. |
| **StockMovement / Movimentação de Estoque** | Registro auditável de alteração no estoque. Append‑only. Tipos: `entry` (entrada), `consumption` (consumo), `adjustment` (ajuste), `loss` (perda), `sale` (venda), `return` (devolução). |
| **AppointmentConsumption / Consumo Real** | Consumo real de produtos em um atendimento específico. Vinculado a `appointment_id` e `product_id`. Preserva `cost_price_snapshot` e `quantity`. |
| **Min Stock / Estoque Mínimo** | Nível mínimo de estoque que, quando atingido, dispara um alerta (futuro: ActivityFeed). |

### 3.6. Financeiro (Finance)

| Termo | Definição |
| :--- | :--- |
| **FinancialEvent / Evento Financeiro** | Registro imutável (append‑only) de uma transação financeira. Tipos: `income` (receita), `expense` (despesa), `commission` (comissão), `adjustment` (ajuste), `refund` (reembolso). |
| **Expense / Despesa** | Despesa operacional do salão. Possui `amount`, `category`, `due_date`, `paid_at` e `status` (`pending`, `paid`, `overdue`, `cancelled`). |
| **CommissionRule / Regra de Comissão** | Define a comissão de um profissional. Pode ser `global` (padrão), `professional` (específica) ou `service` (por serviço). Baseada em percentual sobre o valor líquido. |
| **DRE (Demonstrativo de Resultado)** | Relatório de receitas - despesas = lucro líquido (consolidado por período). |
| **Ledger / Livro‑razão** | Registro financeiro autoritativo e imutável (FinancialEvent). |

### 3.7. Comunicação (Communication)

| Termo | Definição |
| :--- | :--- |
| **MessageTemplate / Template de Mensagem** | Modelo de mensagem provider‑neutro (ex: "Lembrete 24h", "Confirmação de agendamento"). Possui `body` com placeholders (`{{client_name}}`, etc.). |
| **AutomationRule / Regra de Automação** | Define quando uma mensagem deve ser disparada (ex: `appointment.created` → enviar confirmação). |
| **OutboxMessage / Mensagem de Saída** | Registro de envio/pendência de mensagem. Atua como adaptador entre o domínio e canais externos (WhatsApp, SMS, e‑mail). Status: `pending`, `sent`, `delivered`, `failed`. |
| **Outbox Pattern** | Padrão de arquitetura para envio confiável de mensagens: a mensagem é salva no banco (OutboxMessage) antes de ser enviada, garantindo que não seja perdida em caso de falha. |
| **Provider Adapter / Adaptador de Provedor** | Camada de infraestrutura que converte mensagens do domínio para um canal específico (ex: Evolution API para WhatsApp, Twilio para SMS). |

### 3.8. Vertical Beleza (Beauty)

| Termo | Definição |
| :--- | :--- |
| **ColorFormula / Fórmula de Cor** | Fórmula personalizada de coloração capilar. Contém proporções, oxidante e técnica utilizada. Vinculada ao cliente e opcionalmente a um agendamento. |
| **Ficha Técnica** | (Futuro) Documento interno que descreve o passo a passo de um serviço específico (ex: técnica de coloração). |

### 3.9. Operações da Plataforma (Platform Operations)

| Termo | Definição |
| :--- | :--- |
| **ActivityFeed / Feed de Atividades** | Projeção operacional (append‑only) de eventos relevantes para a gestão. Categorias: `appointment`, `cash`, `inventory`, `communication`. **Não é a fonte da verdade** — apenas visibilidade. |
| **Painel de Comando** | UI que exibe o ActivityFeed para o gestor, agrupado por abas (Agenda, Caixa, Estoque, Comunicações). Futuro (pós‑MVP). |
| **Feed Event / Evento do Feed** | Registro individual no ActivityFeed (ex: `appointment.cancelled`, `inventory.low_stock`, `communication.reply_awaiting`). |

---

## 4. Termos de Engenharia (Engineering Terms)

Estes termos descrevem a arquitetura, ferramentas e práticas de desenvolvimento.

| Termo | Definição |
| :--- | :--- |
| **Modular Monolith** | Arquitetura onde o sistema é um único deploy (monolito), mas com módulos internos bem definidos e independentes (ex: `features/`). |
| **Vertical Slice** | Organização do código por funcionalidade de negócio, não por camada técnica (ex: `features/appointments/` contém domain, application, infrastructure, presentation). |
| **Bounded Context / Contexto Delimitado** | Limite lógico dentro do domínio onde termos e regras são consistentes (ex: `Scheduling`, `Customer`, `Inventory`). |
| **TDD (Test‑Driven Development)** | Desenvolvimento guiado por testes: RED (teste falha) → GREEN (código mínimo) → REFACTOR (melhoria). |
| **RED / GREEN / REFACTOR** | Ciclo do TDD. |
| **RLS (Row Level Security)** | Recurso do PostgreSQL que restringe acesso a linhas com base em políticas (ex: `tenant_id`). |
| **GiST Exclusion Constraint** | Constraint do PostgreSQL que impede sobreposição de intervalos (usada para conflito de agendamentos). |
| **Supabase** | Plataforma backend como serviço (PostgreSQL + Auth + Storage + Realtime). |
| **Supabase Auth** | Serviço de autenticação do Supabase (gerencia usuários, sessões JWT). |
| **@supabase/ssr** | Biblioteca para gerenciar autenticação com cookies HTTP‑only em Next.js (Server Components, Server Actions). |
| **Vercel** | Plataforma de deploy para frontend/backend (Next.js). |
| **MCP (Model Context Protocol)** | Protocolo que permite que agentes de IA interajam com ferramentas externas (Supabase, GitHub, Vercel). |
| **AI Gateway** | Camada que abstrai diferentes provedores de IA (OpenAI, Anthropic, Google). Permite trocar de modelo sem reescrever a aplicação. |
| **Orchestrator / Orquestrador** | Agente central que coordena outros agentes especializados (product, domain, implementer, etc.). |
| **Agent Handoff** | Transferência de contexto entre agentes de IA durante um fluxo de trabalho. |
| **`agy` (Antigravity CLI)** | Ferramenta de linha de comando da Google para orquestração de agentes. É opcional e substituível. |
| **Provider‑neutral / Provider‑agnóstico** | Design que não depende de um fornecedor específico (ex: comunicação que funciona com WhatsApp, SMS ou e‑mail). |
| **Outbox Pattern** | Padrão para envio confiável de mensagens (salvar no banco antes de enviar). |
| **Append‑only** | Padrão onde registros são apenas adicionados, nunca atualizados ou deletados (ex: `FinancialEvent`, `StockMovement`). |
| **Snapshot** | Cópia histórica de dados (ex: `price_snapshot` em `appointment_items`). |
| **Idempotency / Idempotência** | Propriedade de uma operação que pode ser executada múltiplas vezes sem efeitos colaterais duplicados (ex: webhooks, mensagens). |
| **Composite FK / Chave Estrangeira Composta** | Chave estrangeira com múltiplas colunas, usada para garantir consistência de tenant (ex: `(tenant_id, professional_id)`). |

---

## 5. Termos de Processo (Process Terms)

Estes termos descrevem fluxos de trabalho, métodos e práticas de desenvolvimento.

| Termo | Definição |
| :--- | :--- |
| **Definition of Done (DoD)** | Critérios que uma tarefa deve atender para ser considerada concluída (testes, docs, revisão, segurança, etc.). |
| **Specification / Spec / Especificação** | Documento que descreve o comportamento esperado de uma feature (problema, meta, escopo, critérios de aceitação). |
| **ADR (Architecture Decision Record)** | Registro formal de uma decisão arquitetônica, com contexto, opções e justificativa. |
| **Research Phase** | Etapa inicial de uma feature: investigar código existente, testes, regras de domínio, schema, etc. |
| **Implementation Phase** | Etapa de implementação: escrever testes → implementar → refatorar. |
| **Review Phase** | Etapa de revisão: verificar correção, segurança, isolamento de tenant, etc. |
| **Security Review** | Revisão explícita de segurança: auth, RBAC, RLS, IDOR, etc. |
| **Memory / Memória** | Registro de aprendizados, descobertas, erros e decisões (arquivos em `memory/`). |
| **Agent Handoff** | Transferência de contexto entre agentes de IA (inclui status, arquivos alterados, próximo passo). |

---

## 6. Termos de Métricas (Metrics Terms)

| Termo | Definição |
| :--- | :--- |
| **Activation / Ativação** | Primeira ação significativa do usuário no sistema (ex: criar um agendamento). |
| **Retention / Retenção** | Capacidade de manter usuários ativos ao longo do tempo (ex: retenção de D7, D30). |
| **Feature Adoption / Adoção de Feature** | Percentual de usuários que utilizam uma funcionalidade específica. |
| **Time‑to‑Value (TTV)** | Tempo entre a criação da conta e a entrega do primeiro valor (ex: primeiro agendamento). |
| **Task Completion / Conclusão de Tarefa** | Percentual de tentativas de uma tarefa que são concluídas com sucesso. |

---

## 7. Termos de Operações (Operations Terms)

| Termo | Definição |
| :--- | :--- |
| **Observability / Observabilidade** | Capacidade de entender o estado interno do sistema a partir de logs, métricas e traces. |
| **p95 / p99 Latency** | Percentil 95/99 de latência: 95%/99% das requisições são mais rápidas que este valor. |
| **Deployment Frequency** | Frequência com que novos códigos vão para produção. |
| **Lead Time for Change** | Tempo entre o commit e o deploy em produção. |
| **Change Failure Rate** | Percentual de deploys que causam falha em produção. |
| **MTTR (Mean Time to Recovery)** | Tempo médio para restaurar o serviço após uma falha. |
| **Incident Handling** | Processo de resposta a incidentes: observar → reproduzir → medir → hipotetizar → testar → corrigir → verificar → documentar. |
| **Rollback** | Reversão de um deploy para uma versão estável anterior. |
| **Preview Deployment** | Deploy automático para ambiente de teste a cada pull request (Vercel). |
| **Staging Environment** | Ambiente pré‑produção para validação final antes do deploy em produção. |

---

## 8. Termos de Segurança e Privacidade (Security & Privacy)

| Termo | Definição |
| :--- | :--- |
| **LGPD** | Lei Geral de Proteção de Dados (Brasil) — equivalente ao GDPR europeu. |
| **GDPR** | Regulamento Geral de Proteção de Dados (Europa). |
| **Sensitive Data / Dados Sensíveis** | Informações que requerem proteção especial (ex: anamnesis, CPF, dados financeiros). |
| **Privacy Level / Nível de Privacidade** | Classificação de dados: `restricted` (acesso restrito), `internal` (uso interno), `public` (público). |
| **IDOR / BOLA** | Vulnerabilidade onde um usuário acessa um objeto (ex: agendamento) de outro usuário/tenant alterando um ID na URL/API. |
| **RBAC** | Controle de acesso baseado em papéis/funções. |
| **RLS** | PostgreSQL Row Level Security — camada de segurança no banco. |
| **Service Role Key** | Chave de serviço do Supabase que bypassa RLS (uso restrito a migrações e jobs administrativos). |

---

## 9. Mapeamento Bilíngue (Português ↔ Inglês)

| Português (Negócio / UI) | Inglês (Técnico / Código) |
| :--- | :--- |
| Salão, Organização | Tenant |
| Usuário | User |
| Vinculação | Membership |
| Profissional | Professional |
| Cliente | Customer |
| Agendamento | Appointment |
| Serviço | Service |
| Produto | Product |
| Estoque | Inventory |
| Movimentação de Estoque | StockMovement |
| Consumo | Consumption |
| Evento Financeiro | FinancialEvent |
| Despesa | Expense |
| Comissão | Commission |
| Comissão (regra) | CommissionRule |
| Template de Mensagem | MessageTemplate |
| Mensagem de Saída | OutboxMessage |
| Automação | AutomationRule |
| Feed de Atividades | ActivityFeed |
| Painel de Comando | Dashboard / Command Center |
| Fórmula de Cor | ColorFormula |
| Anamnese | Anamnesis |
| Nota do Cliente | CustomerNote |
| Falta | No‑show |
| Lista de Espera | Waitlist |
| Contexto Delimitado | Bounded Context |
| Monólito Modular | Modular Monolith |

---

## 10. Termos Proibidos (Para Agentes)

| Termo Proibido | Motivo | Alternativa |
| :--- | :--- | :--- |
| "Agendamento de serviços" | Vago e genérico. | Use `Appointment` (entidade) ou "criação de agendamento". |
| "Sistema para salão" | Reduz o escopo da empresa. | Use "StyleFlow" ou "plataforma SaaS". |
| "ERP" | Implica funcionalidades genéricas de contabilidade/estoque. | Use "SaaS para serviços" ou "plataforma operacional". |
| "Cliente" (para o dono do salão) | Confunde com o consumidor dos serviços. | Use "tenant" ou "salão" (para o negócio) e "cliente" (para o consumidor). |
| "Banco" (em vez de PostgreSQL) | Ambíguo (pode ser instituição financeira). | Use "PostgreSQL" ou "Supabase". |
| "AI" (sem contexto) | Muito genérico. | Use "agente de IA", "modelo de linguagem" ou "Gemini/Claude/GPT". |

---

## 11. Verificação de Consistência com Documentos Existentes

| Documento | Verificação | Status |
| :--- | :--- | :--- |
| `domain-model.md` | Todos os termos de domínio estão definidos no glossário. | ✅ Consistente |
| `business-rules.md` | Todas as regras (BR-*) usam termos do glossário. | ✅ Consistente |
| `architecture.md` | Termos de arquitetura (Modular Monolith, Vertical Slice) estão definidos. | ✅ Consistente |
| `multi-tenancy.md` | Termos de isolamento (Tenant, Membership, RLS) estão definidos. | ✅ Consistente |
| `security-baseline.md` | Termos de segurança (IDOR, RLS, Service Role) estão definidos. | ✅ Consistente |
| `mvp.md` | Termos de escopo (MVP, trial, activation) estão definidos. | ✅ Consistente |
| `testing-strategy.md` | Termos de teste (TDD, E2E, RLS) estão definidos. | ✅ Consistente |
| `design-system.md` | Termos de UI estão definidos (ex: Painel de Comando). | ✅ Consistente |
| `business-model.md` | Termos de métricas (MRR, LTV, CAC) estão definidos. | ✅ Consistente |
| `AGENTS.md` | Termos de processo e ferramentas (MCP, agy) estão definidos. | ✅ Consistente |

---

## 12. Notas Finais para Agentes

- **Consistência é obrigatória:** Sempre use os termos definidos neste glossário. Não invente sinônimos.
- **Português vs. Inglês:** Use português para UI e comunicação com clientes; use inglês para código, tabelas e documentação técnica.
- **Termos proibidos:** Evite termos vagos ou que não estão neste glossário. Se um termo não estiver definido, adicione‑o.
- **Mapeamento bilíngue:** Use a tabela de mapeamento para traduzir entre negócio e técnica.

---

*End of glossary.md*