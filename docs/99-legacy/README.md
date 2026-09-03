# StyleFlow SaaS

**Plataforma operacional para negócios de serviços — primeira vertical: Beleza**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Commercial-red.svg)]()

---

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Stack Tecnológica](#stack-tecnológica)
- [Arquitetura](#arquitetura)
- [Começando (Getting Started)](#começando-getting-started)
- [Desenvolvimento](#desenvolvimento)
- [Testes](#testes)
- [Documentação](#documentação)
- [Agentes de IA](#agentes-de-ia)
- [Contribuição](#contribuição)
- [Licença](#licença)

---

## Sobre o Projeto

**StyleFlow** é uma plataforma SaaS multi‑tenant que unifica **agenda, CRM, estoque, financeiro, comunicação (WhatsApp) e inteligência artificial** em um único painel para salões de beleza, clínicas de estética e barbearias.

### Proposta de Valor

> **"Por menos de R$ 7 por dia, o salão recupera até R$ 14.000 por mês."**

StyleFlow transforma dados operacionais em **decisões financeiras e estratégicas**, aumentando o lucro, reduzindo faltas e fidelizando clientes.

### Principais Funcionalidades (MVP)

- ✅ Autenticação e multi‑tenancy (Supabase Auth + RLS)
- ✅ Agendamento com detecção de conflitos (GiST constraint)
- ✅ CRM com CPF obrigatório e anamnese
- ✅ Catálogo de serviços e profissionais
- ✅ Controle de estoque e consumo em atendimentos
- ✅ Financeiro com comissão e DRE básico
- ✅ Comunicação via WhatsApp (Outbox Pattern + Evolution API)
- ✅ Painel de Comando (Activity Feed — futuro)

---

## Stack Tecnológica

| Camada | Tecnologia |
| :--- | :--- |
| **Frontend** | Next.js (App Router) + React 19 |
| **Linguagem** | TypeScript (strict mode) |
| **Estilização** | Tailwind CSS 4 + shadcn/ui |
| **Validação** | Zod 4 |
| **Backend** | Next.js Server Actions + Route Handlers |
| **Banco de Dados** | PostgreSQL 15+ (Supabase) |
| **Autenticação** | Supabase Auth + `@supabase/ssr` |
| **Testes** | Vitest (unit/integration) + Playwright (E2E) |
| **Deploy** | Vercel |
| **AI / Agentes** | Cline (VS Code) / agy (opcional) + MCPs |

---

## Arquitetura

StyleFlow é um **monólito modular** (Modular Monolith) com organização por **Vertical Slices (Feature-Based)**.

```text
┌─────────────────────────────────────────────────────┐
│                    SAAS CORE                        │
│  Tenant • Membership • Auth • RBAC • Audit •      │
│  Billing (future)                                  │
└─────────────────────────┬───────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────┐
│                 DOMAIN PLATFORM                     │
│  Scheduling • Customer • Catalog • Inventory •     │
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
git clone git@github.com:your-org/agentic-saas-builder-lab.git
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

# AI Provider (opcional)
GEMINI_API_KEY=your-gemini-api-key
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
├── app/                    # Next.js App Router (roteamento)
├── features/               # Vertical Slices (domínio)
│   ├── appointments/       # Agendamentos
│   ├── customers/          # Clientes
│   ├── inventory/          # Estoque
│   └── ...
├── shared/                 # Código compartilhado
│   ├── ui/                 # Design System (shadcn/ui)
│   ├── lib/                # Utilitários, adaptadores
│   └── utils/              # Funções puras
├── supabase/               # Migrações e seed
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

## Agradecimentos

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Cline](https://cline.bot/)
- [Google Gemini](https://ai.google.dev/)
- [Antigravity CLI](https://antigravity.google/)

---

*Feito com ❤️ para os salões de beleza do Brasil.*