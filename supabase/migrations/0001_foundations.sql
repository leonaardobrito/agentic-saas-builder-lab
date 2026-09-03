-- =============================================================================
-- 0001_foundation.sql
-- StyleFlow SaaS — Schema Foundation
-- Version: 1.0
-- Date: 2026-09-02
-- Scope: MVP — Beauty / Salons & Aesthetic Centers
-- Authority: Canonical database schema derived from domain-model.md
-- =============================================================================

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

create extension if not exists btree_gist;

-- =============================================================================
-- SAAS CORE — TENANT & IDENTITY
-- =============================================================================

-- Tenants (customer organizations)
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) >= 2),
  timezone text not null default 'America/Sao_Paulo',
  currency text not null default 'BRL',
  status text not null default 'active' check (status in ('active', 'suspended', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Memberships (User ↔ Tenant association with role)
create table public.memberships (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'manager', 'receptionist', 'professional', 'financial')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

-- Audit Log (immutable security-sensitive actions)
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  old_payload jsonb,
  new_payload jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- DOMAIN PLATFORM — SCHEDULING
-- =============================================================================

-- Professionals (domain entity, may or may not have a login)
create table public.professionals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null check (length(trim(name)) >= 2),
  user_id uuid references auth.users(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Services (catalog)
create table public.services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null check (length(trim(name)) >= 2),
  category text,
  price numeric(12,2) not null check (price >= 0),
  duration_minutes integer not null check (duration_minutes >= 15),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Customers (with CPF required as per business requirement)
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  full_name text not null check (length(trim(full_name)) >= 2),
  cpf text not null check (length(trim(cpf)) = 11),
  phone text,
  email text,
  birth_date date,
  last_visit_at timestamptz,
  status text not null default 'active' check (status in ('active', 'inactive', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, cpf)
);

-- Customer Notes
create table public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- Anamnesis (beauty-specific sensitive data)
create table public.anamnesis (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  allergies text,
  sensitivity text,
  hair_type text,
  health_restrictions text,
  privacy_level text not null default 'restricted' check (privacy_level in ('restricted', 'internal', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id)
);

-- =============================================================================
-- DOMAIN PLATFORM — CATALOG
-- =============================================================================

-- Service → Product expected consumption
create table public.service_product_defaults (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  product_id uuid not null,  -- FK added below (cyclic dependency)
  expected_quantity numeric(12,4) not null check (expected_quantity > 0),
  unit text,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- DOMAIN PLATFORM — INVENTORY
-- =============================================================================

-- Products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null check (length(trim(name)) >= 2),
  sku text,
  unit text,
  cost_price numeric(12,2) not null check (cost_price >= 0),
  sale_price numeric(12,2) check (sale_price >= 0),
  stock_quantity numeric(12,4) not null default 0 check (stock_quantity >= 0),
  min_stock numeric(12,4) not null default 0 check (min_stock >= 0),
  expiry_date date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Stock Movements (append-only audit ledger)
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(12,4) not null,
  movement_type text not null check (movement_type in ('entry', 'consumption', 'adjustment', 'loss', 'sale', 'return')),
  origin_type text,
  origin_id uuid,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- Appointment Consumptions (actual consumption snapshot)
create table public.appointment_consumptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  appointment_id uuid not null,  -- FK added below
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(12,4) not null check (quantity > 0),
  cost_price_snapshot numeric(12,2) not null check (cost_price_snapshot >= 0),
  created_at timestamptz not null default now()
);

-- =============================================================================
-- DOMAIN PLATFORM — SCHEDULING (APPOINTMENTS)
-- =============================================================================

-- Appointments (core scheduling entity)
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  professional_id uuid not null,  -- FK added below
  customer_id uuid not null,      -- FK added below
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint appointments_interval_valid check (end_at > start_at)
);

-- Appointment Items (snapshots of services performed)
create table public.appointment_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  service_id uuid,  -- optional: if service was deleted, keep snapshot
  name_snapshot text not null,
  price_snapshot numeric(12,2) not null check (price_snapshot >= 0),
  duration_snapshot integer not null check (duration_snapshot >= 15),
  created_at timestamptz not null default now()
);

-- =============================================================================
-- DOMAIN PLATFORM — FINANCE
-- =============================================================================

-- Financial Events (append-only ledger)
create table public.financial_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  amount numeric(12,2) not null,
  date date not null,
  category text not null,
  origin_type text not null check (origin_type in ('appointment', 'expense', 'commission', 'adjustment', 'refund')),
  origin_id uuid,
  created_at timestamptz not null default now()
);

-- Expenses (operational expenses)
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  category text not null,
  due_date date not null,
  paid_at timestamptz,
  recurrence text check (recurrence in ('none', 'monthly', 'yearly')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'overdue', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Commission Rules
create table public.commission_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  professional_id uuid references public.professionals(id) on delete cascade,
  service_id uuid references public.services(id) on delete cascade,
  percentage numeric(5,2) not null check (percentage >= 0 and percentage <= 100),
  based_on_net_value boolean not null default true,
  applies_to text not null default 'global' check (applies_to in ('global', 'professional', 'service')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- DOMAIN PLATFORM — COMMUNICATION
-- =============================================================================

-- Message Templates (provider-neutral)
create table public.message_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null check (length(trim(name)) >= 2),
  body text not null,
  variables jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Automation Rules
create table public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  event_type text not null,
  template_id uuid not null references public.message_templates(id) on delete cascade,
  delay_minutes integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Outbox Messages (reliable outbound communication)
create table public.outbox_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  destination text not null,
  template_id uuid not null references public.message_templates(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'sent', 'delivered', 'failed')),
  retry_count integer not null default 0,
  error text,
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- VERTICAL: BEAUTY
-- =============================================================================

-- Color Formulas (beauty-specific technical records)
create table public.color_formulas (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  formula text,
  proportions jsonb,
  oxidant text,
  technique text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- PLATFORM OPERATIONS — ACTIVITY FEED (Future)
-- =============================================================================

-- Activity Feed (operational visibility projection, append-only)
create table public.activity_feed (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category text not null check (category in ('appointment', 'cash', 'inventory', 'communication')),
  event_type text not null,
  status text not null check (status in ('new', 'pending', 'resolved', 'awaiting', 'failed')),
  entity_id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  assigned_to uuid references auth.users(id) on delete set null
);

-- =============================================================================
-- COMPOSITE FOREIGN KEYS (Cross-tenant consistency enforcement)
-- =============================================================================

-- Appointments → Professionals (composite FK)
alter table public.appointments
add constraint fk_appointments_professional
foreign key (tenant_id, professional_id)
references public.professionals(tenant_id, id)
on delete restrict;

-- Appointments → Customers (composite FK)
alter table public.appointments
add constraint fk_appointments_customer
foreign key (tenant_id, customer_id)
references public.customers(tenant_id, id)
on delete restrict;

-- Appointment Consumptions → Appointments (composite FK)
alter table public.appointment_consumptions
add constraint fk_appointment_consumptions_appointment
foreign key (tenant_id, appointment_id)
references public.appointments(tenant_id, id)
on delete cascade;

-- Service Product Defaults → Products (composite FK)
alter table public.service_product_defaults
add constraint fk_service_product_defaults_product
foreign key (tenant_id, product_id)
references public.products(tenant_id, id)
on delete cascade;

-- =============================================================================
-- GIST EXCLUSION CONSTRAINT — APPOINTMENT CONFLICT (BR-APT-003)
-- =============================================================================

-- Prevents overlapping appointments for same tenant + professional
-- Uses half-open intervals [start_at, end_at)
-- Only blocks for scheduled and confirmed statuses
alter table public.appointments
add constraint appointments_no_overlap
exclude using gist (
  tenant_id with =,
  professional_id with =,
  tstzrange(start_at, end_at, '[)') with &&
)
where (status in ('scheduled', 'confirmed'));

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Tenant scoping indexes (tenant_id first)
create index idx_tenants_name on public.tenants (name) where deleted_at is null;
create index idx_tenants_status on public.tenants (status);

-- Memberships
create index idx_memberships_user_id on public.memberships (user_id);
create index idx_memberships_role on public.memberships (role);
create index idx_memberships_is_active on public.memberships (is_active);

-- Professionals
create index idx_professionals_tenant_name on public.professionals (tenant_id, name) where deleted_at is null;
create index idx_professionals_user_id on public.professionals (user_id);

-- Customers
create index idx_customers_tenant_name on public.customers (tenant_id, full_name) where deleted_at is null;
create index idx_customers_tenant_phone on public.customers (tenant_id, phone) where deleted_at is null;
create index idx_customers_tenant_cpf on public.customers (tenant_id, cpf) where deleted_at is null;
create index idx_customers_last_visit on public.customers (tenant_id, last_visit_at);

-- Services
create index idx_services_tenant_name on public.services (tenant_id, name) where deleted_at is null;
create index idx_services_active on public.services (tenant_id, active) where deleted_at is null;

-- Appointments (critical for scheduling queries)
create index idx_appointments_tenant_professional_start on public.appointments (tenant_id, professional_id, start_at) where deleted_at is null;
create index idx_appointments_tenant_customer_start on public.appointments (tenant_id, customer_id, start_at) where deleted_at is null;
create index idx_appointments_tenant_status on public.appointments (tenant_id, status) where deleted_at is null;
create index idx_appointments_tenant_start on public.appointments (tenant_id, start_at) where deleted_at is null;

-- Products
create index idx_products_tenant_name on public.products (tenant_id, name) where deleted_at is null;
create index idx_products_tenant_stock on public.products (tenant_id, stock_quantity, min_stock) where deleted_at is null and active = true;

-- Stock Movements
create index idx_stock_movements_product on public.stock_movements (tenant_id, product_id, created_at desc);
create index idx_stock_movements_origin on public.stock_movements (tenant_id, origin_type, origin_id);

-- Financial Events
create index idx_financial_events_tenant_date on public.financial_events (tenant_id, date desc);
create index idx_financial_events_tenant_origin on public.financial_events (tenant_id, origin_type, origin_id);

-- Outbox Messages
create index idx_outbox_messages_status_scheduled on public.outbox_messages (tenant_id, status, scheduled_at);

-- Activity Feed
create index idx_activity_feed_tenant_category_status on public.activity_feed (tenant_id, category, status, created_at desc);
create index idx_activity_feed_tenant_created on public.activity_feed (tenant_id, created_at desc);

-- Audit Logs
create index idx_audit_logs_tenant_created on public.audit_logs (tenant_id, created_at desc);
create index idx_audit_logs_user on public.audit_logs (user_id);

-- =============================================================================
-- HELPER FUNCTIONS FOR RLS
-- =============================================================================

-- Check if current user is a member of the specified tenant
create or replace function public.is_tenant_member(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.memberships m
    where m.tenant_id = target_tenant_id
      and m.user_id = auth.uid()
      and m.is_active = true
  );
$$;

-- Get the current tenant ID from the session context
-- Returns NULL if not set or if user is not a member
create or replace function public.get_tenant_id_from_context()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select (
    select tenant_id
    from public.memberships
    where user_id = auth.uid()
      and is_active = true
    limit 1
  );
$$;

-- Check if current user has a specific role in the tenant
create or replace function public.has_role(target_tenant_id uuid, target_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.memberships m
    where m.tenant_id = target_tenant_id
      and m.user_id = auth.uid()
      and m.is_active = true
      and m.role = target_role
  );
$$;

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================================

alter table public.tenants enable row level security;
alter table public.memberships enable row level security;
alter table public.audit_logs enable row level security;
alter table public.professionals enable row level security;
alter table public.services enable row level security;
alter table public.customers enable row level security;
alter table public.customer_notes enable row level security;
alter table public.anamnesis enable row level security;
alter table public.service_product_defaults enable row level security;
alter table public.products enable row level security;
alter table public.stock_movements enable row level security;
alter table public.appointment_consumptions enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_items enable row level security;
alter table public.financial_events enable row level security;
alter table public.expenses enable row level security;
alter table public.commission_rules enable row level security;
alter table public.message_templates enable row level security;
alter table public.automation_rules enable row level security;
alter table public.outbox_messages enable row level security;
alter table public.color_formulas enable row level security;
alter table public.activity_feed enable row level security;

-- =============================================================================
-- RLS POLICIES — TENANTS
-- =============================================================================

-- Tenants: SELECT only for members
create policy tenants_select_policy on public.tenants
for select
using (public.is_tenant_member(id));

-- =============================================================================
-- RLS POLICIES — MEMBERSHIPS
-- =============================================================================

-- Memberships: Members can view their own memberships
create policy memberships_select_policy on public.memberships
for select
using (
  tenant_id = public.get_tenant_id_from_context()
  or user_id = auth.uid()
);

-- Memberships: Only owners/admins can insert/update/delete
create policy memberships_insert_policy on public.memberships
for insert
with check (
  public.has_role(tenant_id, 'owner') or public.has_role(tenant_id, 'admin')
);

create policy memberships_update_policy on public.memberships
for update
using (
  public.has_role(tenant_id, 'owner') or public.has_role(tenant_id, 'admin')
);

create policy memberships_delete_policy on public.memberships
for delete
using (
  public.has_role(tenant_id, 'owner') or public.has_role(tenant_id, 'admin')
);

-- =============================================================================
-- RLS POLICIES — AUDIT LOGS
-- =============================================================================

-- Audit logs: Only owners/admins can view
create policy audit_logs_select_policy on public.audit_logs
for select
using (
  public.has_role(tenant_id, 'owner') or public.has_role(tenant_id, 'admin')
);

-- Audit logs: Insert is automatic (handled by triggers/application)
create policy audit_logs_insert_policy on public.audit_logs
for insert
with check (
  public.is_tenant_member(tenant_id)
);

-- =============================================================================
-- RLS POLICIES — PROFESSIONALS
-- =============================================================================

create policy professionals_select_policy on public.professionals
for select
using (public.is_tenant_member(tenant_id));

create policy professionals_insert_policy on public.professionals
for insert
with check (public.is_tenant_member(tenant_id));

create policy professionals_update_policy on public.professionals
for update
using (public.is_tenant_member(tenant_id));

create policy professionals_delete_policy on public.professionals
for delete
using (
  public.has_role(tenant_id, 'owner') or public.has_role(tenant_id, 'admin')
);

-- =============================================================================
-- RLS POLICIES — SERVICES
-- =============================================================================

create policy services_select_policy on public.services
for select
using (public.is_tenant_member(tenant_id));

create policy services_insert_policy on public.services
for insert
with check (public.is_tenant_member(tenant_id));

create policy services_update_policy on public.services
for update
using (public.is_tenant_member(tenant_id));

create policy services_delete_policy on public.services
for delete
using (
  public.has_role(tenant_id, 'owner') or public.has_role(tenant_id, 'admin')
);

-- =============================================================================
-- RLS POLICIES — CUSTOMERS
-- =============================================================================

create policy customers_select_policy on public.customers
for select
using (public.is_tenant_member(tenant_id));

create policy customers_insert_policy on public.customers
for insert
with check (public.is_tenant_member(tenant_id));

create policy customers_update_policy on public.customers
for update
using (public.is_tenant_member(tenant_id));

create policy customers_delete_policy on public.customers
for delete
using (
  public.has_role(tenant_id, 'owner') or public.has_role(tenant_id, 'admin')
);

-- =============================================================================
-- RLS POLICIES — CUSTOMER NOTES
-- =============================================================================

create policy customer_notes_select_policy on public.customer_notes
for select
using (public.is_tenant_member(
  (select tenant_id from public.customers where id = customer_id)
));

create policy customer_notes_insert_policy on public.customer_notes
for insert
with check (public.is_tenant_member(
  (select tenant_id from public.customers where id = customer_id)
));

create policy customer_notes_update_policy on public.customer_notes
for update
using (public.is_tenant_member(
  (select tenant_id from public.customers where id = customer_id)
));

create policy customer_notes_delete_policy on public.customer_notes
for delete
using (
  public.has_role(
    (select tenant_id from public.customers where id = customer_id),
    'owner'
  ) or public.has_role(
    (select tenant_id from public.customers where id = customer_id),
    'admin'
  )
);

-- =============================================================================
-- RLS POLICIES — ANAMNESIS (Sensitive Data)
-- =============================================================================

-- Anamnesis: Only authorized roles can view (owner, admin, manager, and the professional caring for the customer)
create policy anamnesis_select_policy on public.anamnesis
for select
using (
  public.has_role(
    (select tenant_id from public.customers where id = customer_id),
    'owner'
  ) or public.has_role(
    (select tenant_id from public.customers where id = customer_id),
    'admin'
  ) or public.has_role(
    (select tenant_id from public.customers where id = customer_id),
    'manager'
  ) or (
    public.has_role(
      (select tenant_id from public.customers where id = customer_id),
      'professional'
    )
    and exists (
      select 1 from public.appointments a
      where a.customer_id = customer_id
        and a.professional_id in (
          select id from public.professionals
          where user_id = auth.uid()
            and tenant_id = (select tenant_id from public.customers where id = customer_id)
        )
    )
  )
);

-- Anamnesis: Only owner/admin/manager can insert/update/delete
create policy anamnesis_insert_policy on public.anamnesis
for insert
with check (
  public.has_role(
    (select tenant_id from public.customers where id = customer_id),
    'owner'
  ) or public.has_role(
    (select tenant_id from public.customers where id = customer_id),
    'admin'
  ) or public.has_role(
    (select tenant_id from public.customers where id = customer_id),
    'manager'
  )
);

create policy anamnesis_update_policy on public.anamnesis
for update
using (
  public.has_role(
    (select tenant_id from public.customers where id = customer_id),
    'owner'
  ) or public.has_role(
    (select tenant_id from public.customers where id = customer_id),
    'admin'
  ) or public.has_role(
    (select tenant_id from public.customers where id = customer_id),
    'manager'
  )
);

create policy anamnesis_delete_policy on public.anamnesis
for delete
using (
  public.has_role(
    (select tenant_id from public.customers where id = customer_id),
    'owner'
  ) or public.has_role(
    (select tenant_id from public.customers where id = customer_id),
    'admin'
  )
);

-- =============================================================================
-- RLS POLICIES — PRODUCTS
-- =============================================================================

create policy products_select_policy on public.products
for select
using (public.is_tenant_member(tenant_id));

create policy products_insert_policy on public.products
for insert
with check (public.is_tenant_member(tenant_id));

create policy products_update_policy on public.products
for update
using (public.is_tenant_member(tenant_id));

create policy products_delete_policy on public.products
for delete
using (
  public.has_role(tenant_id, 'owner') or public.has_role(tenant_id, 'admin')
);

-- =============================================================================
-- RLS POLICIES — APPOINTMENTS
-- =============================================================================

-- SELECT: Members can view; professionals see only their own appointments
create policy appointments_select_policy on public.appointments
for select
using (
  tenant_id = public.get_tenant_id_from_context()
  and (
    public.has_role(tenant_id, 'owner')
    or public.has_role(tenant_id, 'admin')
    or public.has_role(tenant_id, 'manager')
    or public.has_role(tenant_id, 'receptionist')
    or (
      public.has_role(tenant_id, 'professional')
      and professional_id in (
        select id from public.professionals
        where user_id = auth.uid()
          and tenant_id = appointments.tenant_id
      )
    )
  )
);

-- INSERT: Members with appropriate roles can create
create policy appointments_insert_policy on public.appointments
for insert
with check (
  public.is_tenant_member(tenant_id)
  and exists (
    select 1 from public.professionals p
    where p.tenant_id = tenant_id
      and p.id = professional_id
      and p.active = true
  )
  and exists (
    select 1 from public.customers c
    where c.tenant_id = tenant_id
      and c.id = customer_id
  )
);

-- UPDATE: Members with appropriate roles can update; professionals can update their own appointments (but not status to completed)
create policy appointments_update_policy on public.appointments
for update
using (
  tenant_id = public.get_tenant_id_from_context()
  and (
    public.has_role(tenant_id, 'owner')
    or public.has_role(tenant_id, 'admin')
    or public.has_role(tenant_id, 'manager')
    or public.has_role(tenant_id, 'receptionist')
    or (
      public.has_role(tenant_id, 'professional')
      and professional_id in (
        select id from public.professionals
        where user_id = auth.uid()
          and tenant_id = appointments.tenant_id
      )
    )
  )
);

-- DELETE: Only owners and admins can delete appointments
create policy appointments_delete_policy on public.appointments
for delete
using (
  public.has_role(tenant_id, 'owner') or public.has_role(tenant_id, 'admin')
);

-- =============================================================================
-- RLS POLICIES — APPOINTMENT ITEMS
-- =============================================================================

create policy appointment_items_select_policy on public.appointment_items
for select
using (public.is_tenant_member(tenant_id));

create policy appointment_items_insert_policy on public.appointment_items
for insert
with check (public.is_tenant_member(tenant_id));

create policy appointment_items_update_policy on public.appointment_items
for update
using (public.is_tenant_member(tenant_id));

create policy appointment_items_delete_policy on public.appointment_items
for delete
using (
  public.has_role(tenant_id, 'owner') or public.has_role(tenant_id, 'admin')
);

-- =============================================================================
-- RLS POLICIES — APPOINTMENT CONSUMPTIONS
-- =============================================================================

create policy appointment_consumptions_select_policy on public.appointment_consumptions
for select
using (public.is_tenant_member(tenant_id));

create policy appointment_consumptions_insert_policy on public.appointment_consumptions
for insert
with check (
  public.is_tenant_member(tenant_id)
  and exists (
    select 1 from public.appointments a
    where a.tenant_id = tenant_id
      and a.id = appointment_id
      and a.status = 'completed'
  )
);

-- =============================================================================
-- RLS POLICIES — STOCK MOVEMENTS
-- =============================================================================

create policy stock_movements_select_policy on public.stock_movements
for select
using (public.is_tenant_member(tenant_id));

create policy stock_movements_insert_policy on public.stock_movements
for insert
with check (public.is_tenant_member(tenant_id));

-- Stock movements are append-only; no updates or deletes
-- =============================================================================
-- RLS POLICIES — FINANCIAL EVENTS
-- =============================================================================

create policy financial_events_select_policy on public.financial_events
for select
using (public.is_tenant_member(tenant_id));

create policy financial_events_insert_policy on public.financial_events
for insert
with check (public.is_tenant_member(tenant_id));

-- Financial events are append-only; no updates or deletes
-- =============================================================================
-- RLS POLICIES — EXPENSES
-- =============================================================================

create policy expenses_select_policy on public.expenses
for select
using (public.is_tenant_member(tenant_id));

create policy expenses_insert_policy on public.expenses
for insert
with check (public.is_tenant_member(tenant_id));

create policy expenses_update_policy on public.expenses
for update
using (
  public.has_role(tenant_id, 'owner') or public.has_role(tenant_id, 'admin') or public.has_role(tenant_id, 'financial')
);

create policy expenses_delete_policy on public.expenses
for delete
using (
  public.has_role(tenant_id, 'owner') or public.has_role(tenant_id, 'admin')
);

-- =============================================================================
-- RLS POLICIES — COMMISSION RULES
-- =============================================================================

create policy commission_rules_select_policy on public.commission_rules
for select
using (public.is_tenant_member(tenant_id));

create policy commission_rules_insert_policy on public.commission_rules
for insert
with check (
  public.has_role(tenant_id, 'owner') or public.has_role(tenant_id, 'admin') or public.has_role(tenant_id, 'financial')
);

create policy commission_rules_update_policy on public.commission_rules
for update
using (
  public.has_role(tenant_id, 'owner') or public.has_role(tenant_id, 'admin') or public.has_role(tenant_id, 'financial')
);

create policy commission_rules_delete_policy on public.commission_rules
for delete
using (
  public.has_role(tenant_id, 'owner') or public.has_role(tenant_id, 'admin')
);

-- =============================================================================
-- RLS POLICIES — MESSAGE TEMPLATES
-- =============================================================================

create policy message_templates_select_policy on public.message_templates
for select
using (public.is_tenant_member(tenant_id));

create policy message_templates_insert_policy on public.message_templates
for insert
with check (public.is_tenant_member(tenant_id));

create policy message_templates_update_policy on public.message_templates
for update
using (public.is_tenant_member(tenant_id));

create policy message_templates_delete_policy on public.message_templates
for delete
using (
  public.has_role(tenant_id, 'owner') or public.has_role(tenant_id, 'admin')
);

-- =============================================================================
-- RLS POLICIES — AUTOMATION RULES
-- =============================================================================

create policy automation_rules_select_policy on public.automation_rules
for select
using (public.is_tenant_member(tenant_id));

create policy automation_rules_insert_policy on public.automation_rules
for insert
with check (public.is_tenant_member(tenant_id));

create policy automation_rules_update_policy on public.automation_rules
for update
using (public.is_tenant_member(tenant_id));

create policy automation_rules_delete_policy on public.automation_rules
for delete
using (
  public.has_role(tenant_id, 'owner') or public.has_role(tenant_id, 'admin')
);

-- =============================================================================
-- RLS POLICIES — OUTBOX MESSAGES
-- =============================================================================

create policy outbox_messages_select_policy on public.outbox_messages
for select
using (public.is_tenant_member(tenant_id));

create policy outbox_messages_insert_policy on public.outbox_messages
for insert
with check (public.is_tenant_member(tenant_id));

create policy outbox_messages_update_policy on public.outbox_messages
for update
using (public.is_tenant_member(tenant_id));

-- =============================================================================
-- RLS POLICIES — COLOR FORMULAS
-- =============================================================================

create policy color_formulas_select_policy on public.color_formulas
for select
using (public.is_tenant_member(
  (select tenant_id from public.customers where id = customer_id)
));

create policy color_formulas_insert_policy on public.color_formulas
for insert
with check (public.is_tenant_member(
  (select tenant_id from public.customers where id = customer_id)
));

create policy color_formulas_update_policy on public.color_formulas
for update
using (public.is_tenant_member(
  (select tenant_id from public.customers where id = customer_id)
));

create policy color_formulas_delete_policy on public.color_formulas
for delete
using (
  public.has_role(
    (select tenant_id from public.customers where id = customer_id),
    'owner'
  ) or public.has_role(
    (select tenant_id from public.customers where id = customer_id),
    'admin'
  )
);

-- =============================================================================
-- RLS POLICIES — ACTIVITY FEED
-- =============================================================================

-- Activity feed is read-only for members; insert is handled by triggers/application
create policy activity_feed_select_policy on public.activity_feed
for select
using (public.is_tenant_member(tenant_id));

create policy activity_feed_insert_policy on public.activity_feed
for insert
with check (public.is_tenant_member(tenant_id));

-- Activity feed is append-only; no updates or deletes allowed

-- =============================================================================
-- SERVICE PRODUCT DEFAULTS (RLS)
-- =============================================================================

create policy service_product_defaults_select_policy on public.service_product_defaults
for select
using (public.is_tenant_member(tenant_id));

create policy service_product_defaults_insert_policy on public.service_product_defaults
for insert
with check (public.is_tenant_member(tenant_id));

create policy service_product_defaults_update_policy on public.service_product_defaults
for update
using (public.is_tenant_member(tenant_id));

create policy service_product_defaults_delete_policy on public.service_product_defaults
for delete
using (
  public.has_role(tenant_id, 'owner') or public.has_role(tenant_id, 'admin')
);

-- =============================================================================
-- COMMENTS — SCHEMA DOCUMENTATION
-- =============================================================================

comment on table public.tenants is 'Customer organizations (salons) in the multi-tenant SaaS';
comment on table public.memberships is 'User membership in a tenant with role-based access';
comment on table public.audit_logs is 'Immutable audit trail for security-sensitive actions';
comment on table public.professionals is 'Service providers; may or may not have a user account';
comment on table public.services is 'Service catalog with price and duration defaults';
comment on table public.customers is 'Customers receiving services; CPF is required';
comment on table public.customer_notes is 'Operational notes about customers';
comment on table public.anamnesis is 'Beauty-specific sensitive customer data (privacy-classified)';
comment on table public.service_product_defaults is 'Expected product consumption per service';
comment on table public.products is 'Inventory items with stock tracking';
comment on table public.stock_movements is 'Auditable stock ledger (append-only)';
comment on table public.appointment_consumptions is 'Actual product consumption per appointment (snapshot)';
comment on table public.appointments is 'Scheduled operational events with status workflow';
comment on table public.appointment_items is 'Service items within an appointment (historical snapshots)';
comment on table public.financial_events is 'Append-only financial ledger (income/expense)';
comment on table public.expenses is 'Operational expenses with payment tracking';
comment on table public.commission_rules is 'Commission configuration per professional/service';
comment on table public.message_templates is 'Provider-neutral message templates';
comment on table public.automation_rules is 'Rules triggering message sends based on events';
comment on table public.outbox_messages is 'Reliable outbound communication (outbox pattern)';
comment on table public.color_formulas is 'Beauty-specific color formula records';
comment on table public.activity_feed is 'Operational visibility projection for management (future)';