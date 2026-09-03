# Relatório de Verificação do Domínio (Entidades e Relacionamentos)

**Status:** CONCLUÍDO  
**Data:** 2026-09-02  
**Projeto:** StyleFlow SaaS  
**Versão da Migração Analisada:** `/supabase/migrations/0001_foundations.sql` (v1.1)  
**Documentos de Referência:**
- `/docs/02-domain/domain-model.md`
- `/docs/06-data/schema.md`
- `/docs/01-product/mvp.md`
- `/docs/00-project/glossary.md`

---

## 1. Tabela de Entidades do MVP

Verificação das 22 entidades do escopo MVP em `/supabase/migrations/0001_foundations.sql`:

| Entidade | Tabela esperada | Presente no SQL? | Colunas corretas? | Status / Observações |
| :--- | :--- | :---: | :---: | :--- |
| **Tenant** | `tenants` | SIM | SIM | OK. Contém `id`, `name`, `timezone`, `currency`, `status`, `created_at`, `updated_at`, `deleted_at`. |
| **Membership** | `memberships` | SIM | SIM | OK. Chave primária composta `(tenant_id, user_id)`. Não possui coluna `id` individual (por ser tabela de ligação N:N). |
| **AuditLog** | `audit_logs` | SIM | SIM | OK. Ledger imutável com `tenant_id`, `user_id`, `action`, `old_payload`, `new_payload`, `ip_address`, `user_agent`, `created_at`. |
| **Professional** | `professionals` | SIM | SIM | OK. Contém `id`, `tenant_id`, `name`, `user_id`, `active`, `created_at`, `updated_at`, `deleted_at`. |
| **Service** | `services` | SIM | SIM | OK. Contém `id`, `tenant_id`, `name`, `category`, `price`, `duration_minutes`, `active`, `created_at`, `updated_at`, `deleted_at`. |
| **Customer** | `customers` | SIM | SIM | OK. Contém `id`, `tenant_id`, `full_name`, `cpf` (NOT NULL, check length 11), `phone`, `email`, `birth_date`, `last_visit_at`, `status`, `created_at`, `updated_at`, `deleted_at`. UNIQUE `(tenant_id, cpf)`. |
| **CustomerNote** | `customer_notes` | SIM | **NÃO** | **DISCREPÂNCIA**. Faltando a coluna `tenant_id` na tabela SQL. |
| **Anamnesis** | `anamnesis` | SIM | **NÃO** | **DISCREPÂNCIA**. Faltando a coluna `tenant_id` na tabela SQL. |
| **ServiceProductDefault** | `service_product_defaults` | SIM | SIM | OK. Contém `id`, `tenant_id`, `service_id`, `product_id`, `expected_quantity`, `unit`, `created_at`. |
| **Product** | `products` | SIM | SIM | OK. Contém `id`, `tenant_id`, `name`, `sku`, `unit`, `cost_price`, `sale_price`, `stock_quantity`, `min_stock`, `expiry_date`, `active`, `created_at`, `updated_at`, `deleted_at`. |
| **StockMovement** | `stock_movements` | SIM | SIM | OK. Contém `id`, `tenant_id`, `product_id`, `quantity`, `movement_type`, `origin_type`, `origin_id`, `created_at`, `created_by`. Ledger imutável. |
| **AppointmentConsumption** | `appointment_consumptions` | SIM | SIM | OK. Contém `id`, `tenant_id`, `appointment_id`, `product_id`, `quantity`, `cost_price_snapshot`, `created_at`. |
| **Appointment** | `appointments` | SIM | SIM | OK. Contém `id`, `tenant_id`, `professional_id`, `customer_id`, `start_at`, `end_at`, `status`, `created_at`, `updated_at`, `deleted_at`. Restrição de intervalo e GiST de não sobreposição (`appointments_no_overlap`). |
| **AppointmentItem** | `appointment_items` | SIM | PARCIAL | **DISCREPÂNCIA**. Possui `tenant_id`, mas a FK `appointment_id` é simples (`REFERENCES appointments(id)`) em vez de chave estrangeira composta `(tenant_id, appointment_id)`. |
| **FinancialEvent** | `financial_events` | SIM | SIM | OK. Contém `id`, `tenant_id`, `amount`, `event_type`, `category`, `origin_type`, `origin_id`, `date`, `description`, `created_at`, `created_by`. Ledger imutável. |
| **Expense** | `expenses` | SIM | SIM | OK. Contém `id`, `tenant_id`, `description`, `amount`, `category`, `due_date`, `paid_at`, `status`, `created_at`, `updated_at`, `deleted_at`. |
| **CommissionRule** | `commission_rules` | SIM | SIM | OK. Contém `id`, `tenant_id`, `professional_id`, `service_id`, `percentage`, `fixed_amount`, `based_on_net_value`, `applies_to`, `created_at`, `updated_at`. |
| **MessageTemplate** | `message_templates` | SIM | SIM | OK. Contém `id`, `tenant_id`, `name`, `body`, `variables`, `active`, `created_at`, `updated_at`. |
| **AutomationRule** | `automation_rules` | SIM | SIM | OK. Contém `id`, `tenant_id`, `event_type`, `template_id`, `delay_minutes`, `active`, `created_at`, `updated_at`. |
| **OutboxMessage** | `outbox_messages` | SIM | SIM | OK. Contém `id`, `tenant_id`, `destination`, `template_id`, `status`, `retry_count`, `error`, `scheduled_at`, `sent_at`, `created_at`. |
| **ColorFormula** | `color_formulas` | SIM | **NÃO** | **DISCREPÂNCIA**. Faltando a coluna `tenant_id` na tabela SQL. |
| **ActivityFeed** | `activity_feed` | SIM | SIM | OK. Contém `id`, `tenant_id`, `category`, `event_type`, `status`, `entity_id`, `payload`, `created_at`, `resolved_at`, `assigned_to`. |



---

## 2. Relacionamentos e Chaves Estrangeiras

Verificação dos relacionamentos especificados entre as entidades:

- [x] **`appointments` → `professionals` (FK composta `(tenant_id, professional_id)`)**: **OK**
  - Implementado via `constraint fk_appointments_professional foreign key (tenant_id, professional_id) references public.professionals(tenant_id, id) on delete restrict`.
- [x] **`appointments` → `customers` (FK composta `(tenant_id, customer_id)`)**: **OK**
  - Implementado via `constraint fk_appointments_customer foreign key (tenant_id, customer_id) references public.customers(tenant_id, id) on delete restrict`.
- [x] **`appointment_consumptions` → `appointments` (FK composta `(tenant_id, appointment_id)`)**: **OK**
  - Implementado via `constraint fk_appointment_consumptions_appointment foreign key (tenant_id, appointment_id) references public.appointments(tenant_id, id) on delete cascade`.
- [x] **`service_product_defaults` → `products` (FK composta `(tenant_id, product_id)`)**: **OK**
  - Implementado via `constraint fk_service_product_defaults_product foreign key (tenant_id, product_id) references public.products(tenant_id, id) on delete cascade`.
- [x] **`customer_notes` → `customers` (FK simples)**: **OK**
  - Implementado via `customer_id uuid not null references public.customers(id) on delete cascade`.
- [x] **`anamnesis` → `customers` (FK simples, UNIQUE)**: **OK**
  - Implementado via `customer_id uuid not null references public.customers(id) on delete cascade` e `unique (customer_id)`.
- [ ] **`appointment_items` → `appointments` (FK simples com `tenant_id` para isolamento)**: **INCORRETO / DISCREPÂNCIA**
  - No SQL atual, a FK é simples (`appointment_id uuid not null references public.appointments(id) on delete cascade`). O `schema.md` recomenda FK composta `(tenant_id, appointment_id)` para reforçar a consistência do isolamento.
- [x] **`commission_rules` → `professionals` e `services` (FKs simples com `tenant_id`)**: **OK**
  - Implementado via `professional_id uuid references public.professionals(id) on delete cascade` e `service_id uuid references public.services(id) on delete cascade` com `tenant_id` na tabela.
- [x] **`outbox_messages` → `message_templates` (FK)**: **OK**
  - Implementado via `template_id uuid not null references public.message_templates(id) on delete cascade`.
- [x] **`color_formulas` → `customers` e `appointments` (FKs)**: **OK**
  - Implementado via `customer_id uuid not null references public.customers(id) on delete cascade` e `appointment_id uuid references public.appointments(id) on delete set null`.
- [x] **`activity_feed` → `tenants` (FK, com `tenant_id`)**: **OK**
  - Implementado via `tenant_id uuid not null references public.tenants(id) on delete cascade`.

---

## 3. Análise de Colunas e Convenções

### 3.1. Conformidade com Regras Gerais

1. **Presença de `tenant_id` (UUID, NOT NULL) — exceto `tenants`**:
   - **FALHAS ENCONTRADAS:**
     - `customer_notes`: Faltando `tenant_id`. Viola a regra D-001 (*Tenant Isolation*).
     - `anamnesis`: Faltando `tenant_id`. Viola a regra D-001. Dados sensíveis dependem de subqueries lentas na política de RLS.
     - `color_formulas`: Faltando `tenant_id`. Viola a regra D-001.
   - **DEMAIS TABELAS:** Todas as outras 18 tabelas possuem `tenant_id uuid not null references public.tenants(id) on delete cascade`.

2. **Presença de `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())**:
   - **Exceção válida:** `memberships` utiliza chave primária composta `PRIMARY KEY (tenant_id, user_id)`.
   - **Demais 21 tabelas:** Todas possuem `id uuid primary key default gen_random_uuid()`.

3. **Timestamps `created_at` e `updated_at` em tabelas mutáveis**:
   - Mutáveis com ambos os timestamps: `tenants`, `memberships`, `professionals`, `services`, `customers`, `anamnesis`, `products`, `appointments`, `expenses`, `commission_rules`, `message_templates`, `automation_rules`, `color_formulas`.
   - Tabelas imutáveis/append-only (apenas `created_at` necessário): `audit_logs`, `stock_movements`, `appointment_consumptions`, `appointment_items`, `financial_events`, `outbox_messages`, `activity_feed`.
   - **Observação:** `customer_notes` e `service_product_defaults` só possuem `created_at`. Caso haja edição de notas ou regras de consumo, `updated_at` deve ser adicionado.

4. **Soft Delete (`deleted_at`)**:
   - Presente em todas as 7 entidades elegíveis conforme o `schema.md`: `tenants`, `professionals`, `services`, `customers`, `products`, `appointments`, `expenses`.

5. **Campos Obrigatórios Específicos**:
   - `customers.cpf`: `NOT NULL` e `UNIQUE (tenant_id, cpf)` presente.

---

## 4. Recomendações de Correção para o Schema SQL

> **Atenção:** As alterações abaixo são recomendações documentadas e **não** foram aplicadas ao arquivo SQL nesta etapa.

### 4.1. Adição de `tenant_id` às Tabelas Faltantes

As tabelas `customer_notes`, `anamnesis` e `color_formulas` precisam receber a coluna `tenant_id` para respeitar o isolamento de tenant em nível de banco de dados (D-001) e otimizar as políticas RLS.

```sql
-- 1. customer_notes
ALTER TABLE public.customer_notes
  ADD COLUMN tenant_id uuid;

-- Populando tenant_id a partir do cliente
UPDATE public.customer_notes cn
  SET tenant_id = c.tenant_id
  FROM public.customers c
  WHERE cn.customer_id = c.id;

ALTER TABLE public.customer_notes
  ALTER COLUMN tenant_id SET NOT NULL,
  ADD CONSTRAINT fk_customer_notes_tenant
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 2. anamnesis
ALTER TABLE public.anamnesis
  ADD COLUMN tenant_id uuid;

UPDATE public.anamnesis a
  SET tenant_id = c.tenant_id
  FROM public.customers c
  WHERE a.customer_id = c.id;

ALTER TABLE public.anamnesis
  ALTER COLUMN tenant_id SET NOT NULL,
  ADD CONSTRAINT fk_anamnesis_tenant
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 3. color_formulas
ALTER TABLE public.color_formulas
  ADD COLUMN tenant_id uuid;

UPDATE public.color_formulas cf
  SET tenant_id = c.tenant_id
  FROM public.customers c
  WHERE cf.customer_id = c.id;

ALTER TABLE public.color_formulas
  ALTER COLUMN tenant_id SET NOT NULL,
  ADD CONSTRAINT fk_color_formulas_tenant
    FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
```

### 4.2. Ajuste na Chave Estrangeira de `appointment_items`

Para garantir que um item de agendamento pertencente ao tenant A nunca possa referenciar um agendamento do tenant B:

```sql
ALTER TABLE public.appointment_items
  DROP CONSTRAINT IF EXISTS appointment_items_appointment_id_fkey,
  ADD CONSTRAINT fk_appointment_items_appointment
    FOREIGN KEY (tenant_id, appointment_id)
    REFERENCES public.appointments(tenant_id, id)
    ON DELETE CASCADE;
```

### 4.3. Simplificação e Performance de Políticas RLS

Substituir subqueries RLS indiretas por verificações diretas de `tenant_id` em `customer_notes`, `anamnesis` e `color_formulas`:

```sql
-- Exemplo para customer_notes
DROP POLICY IF EXISTS customer_notes_select_policy ON public.customer_notes;
CREATE POLICY customer_notes_select_policy ON public.customer_notes
  FOR SELECT USING (public.is_tenant_member(tenant_id));

-- Exemplo para color_formulas
DROP POLICY IF EXISTS color_formulas_select_policy ON public.color_formulas;
CREATE POLICY color_formulas_select_policy ON public.color_formulas
  FOR SELECT USING (public.is_tenant_member(tenant_id));
```

### 4.4. Criação de Índices Faltantes de Acordo com `schema.md`

Adicionar índices compostos com `tenant_id` como coluna principal para suporte às buscas mais frequentes:

```sql
CREATE INDEX idx_customer_notes_tenant_customer ON public.customer_notes (tenant_id, customer_id);
CREATE INDEX idx_anamnesis_tenant_customer ON public.anamnesis (tenant_id, customer_id);
CREATE INDEX idx_color_formulas_tenant_customer ON public.color_formulas (tenant_id, customer_id);
CREATE INDEX idx_commission_rules_tenant_professional ON public.commission_rules (tenant_id, professional_id);
CREATE INDEX idx_commission_rules_tenant_service ON public.commission_rules (tenant_id, service_id);
```

---

## 5. Resumo Executivo

1. **Entidades Presentes:** 22/22 (100%). Todas as tabelas do MVP foram criadas no SQL.
2. **Conformidade Geral de Colunas:** 19/22 tabelas possuem alinhamento completo com o modelo de domínio.
3. **Discrepâncias Críticas Encontradas:**
   - 3 tabelas (`customer_notes`, `anamnesis`, `color_formulas`) não possuem a coluna `tenant_id`, violando o princípio de isolamento D-001.
   - 1 chave estrangeira (`appointment_items` → `appointments`) deve ser convertida para FK composta `(tenant_id, appointment_id)`.
   - Índices secundários compostos para `customer_notes`, `anamnesis`, `color_formulas` e `commission_rules` precisam ser adicionados na próxima migração/revisão.

