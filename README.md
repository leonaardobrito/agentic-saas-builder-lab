# StyleFlow SaaS — Agentic SaaS Builder Lab

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8.svg)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-4.1-6e9f18.svg)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-1.62-2b4d7a.svg)](https://playwright.dev/)
[![License](https://img.shields.io/badge/License-Commercial-red.svg)]()

**Plataforma SaaS multi‑tenant para negócios de serviços — primeira vertical: Beleza**

---

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Stack Tecnológica](#stack-tecnológica)
- [Arquitetura](#arquitetura)
- [Roadmap](#roadmap)
- [Começando (Getting Started)](#começando-getting-started)
- [Desenvolvimento](#desenvolvimento)
- [Testes](#testes)
- [Documentação](#documentação)
- [Agentes de IA](#agentes-de-ia)
- [CI/CD](#cicd)
- [Contribuição](#contribuição)
- [Licença](#licença)

---

## Sobre o Projeto

**StyleFlow** é uma plataforma SaaS que unifica **agenda, CRM, estoque, financeiro, comunicação (WhatsApp) e inteligência artificial** em um único painel para salões de beleza, clínicas de estética e barbearias.

### Proposta de Valor

> **"Por menos de R$ 7 por dia, o salão recupera até R$ 14.000 por mês."**

StyleFlow transforma dados operacionais em **decisões financeiras e estratégicas**, aumentando o lucro, reduzindo faltas e fidelizando clientes.

### Principais Funcionalidades (MVP)

| Módulo | Status |
| :--- | :---: |
| Auth & Multi‑tenancy | ⏳ Em desenvolvimento |
| Agenda & Agendamentos | ⏳ Planejado |
| Clientes (CRM) | ⏳ Planejado |
| Profissionais | ⏳ Planejado |
| Serviços | ⏳ Planejado |
| Estoque & Consumo | ⏳ Planejado |
| Financeiro & Comissão | ⏳ Planejado |
| WhatsApp & IA | ⏳ Planejado |
| Painel de Comando | 🔮 Futuro |
| Fiscal (NFS‑e) | 🔮 Futuro |

---

## Stack Tecnológica

| Camada | Tecnologia | Versão |
| :--- | :--- | :--- |
| **Frontend** | Next.js (App Router) + React | 16.x / 19.x |
| **Linguagem** | TypeScript | Strict Mode |
| **Estilização** | Tailwind CSS + shadcn/ui | 4.x |
| **Validação** | Zod | 4.x |
| **Backend** | Next.js Server Actions + Route Handlers | — |
| **Banco de Dados** | PostgreSQL (Supabase) | 15+ |
| **Autenticação** | Supabase Auth + `@supabase/ssr` | — |
| **Testes** | Vitest (unit/integration) + Playwright (E2E) | 4.x / 1.x |
| **Deploy** | Vercel | — |
| **AI / Agentes** | Cline (VS Code) / agy (opcional) + MCPs | — |

---

## Arquitetura

StyleFlow é um **monólito modular** com organização por **Vertical Slices (Feature-Based)**.

```text
┌─────────────────────────────────────────────────────┐
│                    SAAS CORE                        │
│  Tenant • Membership • Auth • RBAC • Audit        │
└─────────────────────────┬───────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────┐
│                 DOMAIN PLATFORM                     │
│  Scheduling • Customer • Catalog • Inventory       │
│  Finance • Communication • Platform Operations     │
└─────────────────────────┬───────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────┐
│              VERTICAL: BEAUTY                       │
│  Anamnesis • Color Formula • Beauty workflows      │
└─────────────────────────────────────────────────────┘
```

**Princípios-chave:**
- Multi‑tenancy por design (`tenant_id` em toda tabela)
- RLS e composite FKs para isolamento de dados
- Append‑only para eventos financeiros e de estoque
- Snapshots históricos para serviços/produtos
- Database‑enforced invariants (GiST para conflitos)

---

## Roadmap

### 🏗️ Milestone 1: Fundação Técnica (Sprint 1)
- [ ] Middleware de autenticação
- [ ] Login/Registro/Logout com Supabase Auth
- [ ] Criação de Tenant no onboarding
- [ ] RBAC (papéis: owner, admin, manager, receptionist, professional, financial)
- [ ] CRUD de Profissionais, Serviços e Clientes
- [ ] Testes de integração para RLS

### 📅 Milestone 2: Núcleo do Agendamento (Sprint 2)
- [ ] Entidade Appointment e AppointmentItem
- [ ] Criação de agendamento com conflitos (GiST)
- [ ] Fluxo de status (scheduled → confirmed → completed)
- [ ] Visualização de agenda
- [ ] Testes de concorrência

### 📦 Milestone 3: Operações Financeiras e Estoque (Sprint 3)
- [ ] CRUD de Produtos
- [ ] Consumo esperado e real
- [ ] Cálculo de comissão
- [ ] Outbox Pattern para lembretes WhatsApp
- [ ] DRE básico

### 🚀 Milestone 4: Validação com Pilotos (Sprint 4)
- [ ] Deploy na Vercel
- [ ] Onboarding guiado
- [ ] Coleta de métricas
- [ ] Ajustes com base no feedback

### 📊 Milestone 5: Pós‑MVP (v1.1)
- [ ] Painel de Comando (Activity Feed)
- [ ] Portal do Cliente
- [ ] Relatórios avançados

---

## Começando (Getting Started)

### Pré‑requisitos

- Node.js 20.x ou 22.x LTS
- npm 10+
- Git
- Docker (para Supabase local)
- Supabase CLI

### Instalação

```bash
# 1. Clone o repositório
git clone git@github.com:seu-usuario/agentic-saas-builder-lab.git
cd agentic-saas-builder-lab

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais (veja abaixo)

# 4. Inicie o Supabase local
supabase start
supabase db reset

# 5. Execute a aplicação
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

### Variáveis de Ambiente

Crie um arquivo `.env.local` com:

```env
# Supabase (obrigatório)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Para produção, use credenciais do Supabase dashboard.
# Para desenvolvimento local, as chaves são geradas pelo `supabase start`.
```

⚠️ **Nunca commite `.env.local`.**

---

## Desenvolvimento

### Comandos Úteis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor de desenvolvimento (hot-reload). |
| `npm run build` | Gera o build de produção. |
| `npm start` | Executa o build de produção. |
| `npm run typecheck` | Verifica tipos TypeScript. |
| `npm run lint` | Executa ESLint. |
| `npm test` | Executa os testes unitários (Vitest). |
| `npm run test:integration` | Executa testes de integração (Supabase local). |
| `npm run test:e2e` | Executa testes E2E (Playwright). |
| `npm run test:ci` | Executa todos os testes (unit + integration). |

### Estrutura de Pastas

```text
agentic-saas-builder-lab/
├── app/                    # Next.js App Router
├── features/               # Vertical Slices (a ser criado)
├── shared/                 # Código compartilhado
│   ├── ui/                 # shadcn/ui components
│   ├── lib/                # Utilitários
│   └── types/
├── supabase/               # Migrações SQL
│   └── migrations/
├── docs/                   # Documentação completa
├── specs/                  # Especificações ativas
├── memory/                 # Registros de aprendizado
├── AGENTS.md               # Contrato para agentes de IA
└── package.json
```

---

## Testes

StyleFlow segue **TDD (Test-Driven Development)** como método padrão.

### Pirâmide de Testes

```text
        /\
       / E2E \          ← Playwright (fluxos críticos)
      /--------\
     / Integr. \        ← Vitest + Supabase local (repositórios, RLS)
    /----------\
   /  Unitária  \      ← Vitest (entidades, regras de negócio)
  /--------------\
```

### Executando Testes

```bash
# Unitários
npm test

# Integração (requer Supabase local)
npm run test:integration

# E2E (requer dev server rodando)
npm run test:e2e

# Cobertura
npm run test:coverage
```

**Meta de cobertura:** 80% para domínio/aplicação.

---

## Documentação

Toda a documentação está organizada na pasta `docs/`:

| Pasta | Conteúdo |
| :--- | :--- |
| `docs/00-project/` | Visão, problema, ICP, modelo de negócio, glossário |
| `docs/01-product/` | Visão geral do produto, MVP, roadmap |
| `docs/02-domain/` | Modelo de domínio, regras de negócio |
| `docs/03-architecture/` | Arquitetura, multi‑tenancy, ADRs |
| `docs/04-design/` | Design system |
| `docs/05-api/` | Diretrizes de API |
| `docs/06-data/` | Schema do banco |
| `docs/08-security/` | Baseline de segurança |
| `docs/09-quality/` | TDD, estratégia de testes, Definition of Done |
| `docs/10-operations/` | Local development, deploy, observability |
| `docs/99-legacy/` | Conhecimento do legado (para referência) |

### Documentos-Chave para Começar

1. **[AGENTS.md](AGENTS.md)** — Contrato para agentes de IA (leitura obrigatória)
2. **[docs/00-project/vision.md](docs/00-project/vision.md)** — Visão do produto
3. **[docs/02-domain/domain-model.md](docs/02-domain/domain-model.md)** — Modelo de domínio
4. **[docs/03-architecture/architecture.md](docs/03-architecture/architecture.md)** — Arquitetura
5. **[docs/01-product/mvp.md](docs/01-product/mvp.md)** — Escopo do MVP

---

## Agentes de IA

StyleFlow é projetado para ser **AI‑orchestrated**. Agentes de IA (Cline, Claude, Gemini, etc.) podem atuar em papéis especializados:

- **Research** — investigar código/documentação
- **Product** — definir requisitos
- **Domain** — refinar modelo de domínio
- **Architecture** — decisões arquiteturais
- **Frontend / Backend / QA / Security / DevOps / Reviewer**

### Contrato para Agentes

O arquivo **[AGENTS.md](AGENTS.md)** define:

- Hierarquia de autoridade (decisões humanas > documentação > código)
- TDD como método padrão
- Segurança e isolamento de tenant
- Limites de atuação (ações autônomas vs. aprovação humana)
- Formato de handoff entre agentes

### MCPs (Model Context Protocol)

Agentes podem usar MCPs para interagir com serviços:

- **Supabase MCP** — Consultas/migrações (dev/staging)
- **GitHub MCP** — Branches, commits, PRs
- **Vercel MCP** — Deploy, logs, configuração

⚠️ **Least privilege:** Prefira acesso read‑only. Produção requer aprovação humana.

---

## CI/CD

### GitHub Actions

O projeto utiliza **GitHub Actions** para CI, executando automaticamente em cada Pull Request e push para `main`:

| Etapa | Comando |
| :--- | :--- |
| Setup Node | `actions/setup-node@v4` |
| Install deps | `npm ci` |
| Setup Supabase | `supabase/setup-cli@v1` |
| Start Supabase Local | `supabase start` |
| Apply Migrations | `supabase migration up` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Tests | `npm run test:ci` |
| Build | `npm run build` |

### Vercel (CD)

- **Preview Deployments:** A cada PR, a Vercel cria um ambiente de preview.
- **Production Deploy:** Ao merge em `main`, a Vercel faz deploy automático.

---

## Contribuição

### Para Humanos

1. Leia o **[AGENTS.md](AGENTS.md)** e a documentação.
2. Crie uma branch para sua feature: `feature/nome-da-feature`.
3. Siga TDD (escreva testes primeiro).
4. Execute os checks: `npm run typecheck && npm run lint && npm run test:ci`.
5. Abra um Pull Request com descrição clara.

### Para Agentes de IA

1. Leia o **[AGENTS.md](AGENTS.md)** antes de agir.
2. Respeite a hierarquia de autoridade.
3. Use TDD e mantenha o escopo.
4. Handoff com o formato definido em `AGENTS.md`.

---

## Licença

Este projeto é de **uso comercial exclusivo**. Todos os direitos reservados.

---

## Contato

- **Equipe StyleFlow:** [styleflow@example.com](mailto:styleflow@example.com)
- **Repositório:** [https://github.com/your-org/agentic-saas-builder-lab](https://github.com/your-org/agentic-saas-builder-lab)

---

*Feito com ❤️ para os salões de beleza do Brasil.*