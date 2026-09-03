# Design System — StyleFlow SaaS

**Status:** APPROVED TARGET
**Version:** 1.0
**Updated:** 2026-09-02
**Scope:** MVP — Beauty / Salões e Centros Estéticos
**Authority:** Linguagem visual, componentes, interações e acessibilidade

---

## 0. Como Agentes Devem Usar Este Documento

Este documento define os **padrões visuais, componentes, interações e diretrizes de acessibilidade** da interface do StyleFlow.

É a fonte da verdade para a implementação da UI.

### Regras de Autoridade

- `design-system.md` define **como a interface deve se parecer e se comportar**.
- `architecture.md` define **onde os componentes são organizados** (`shared/ui/`).
- `domain-model.md` define **quais entidades são exibidas**.
- `testing-strategy.md` define **testes de acessibilidade** obrigatórios.

### Antes de implementar um componente UI

O agente DEVE:

1. Verificar se o componente já existe em `shared/ui/` (shadcn/ui ou componentes customizados).
2. Usar as cores, espaçamentos e tipografia definidos neste documento.
3. Verificar se o componente é responsivo (mobile-first).
4. Garantir que o componente seja acessível (keyboard, focus, ARIA).
5. Garantir que o texto da UI esteja em **Português‑BR** (a menos que seja um termo técnico interno).
6. Atualizar este documento se um novo componente reutilizável for criado.

---

## 1. Princípios de Design

1. **Mobile-First:** A interface deve funcionar perfeitamente em telas de 360px+ (smartphones). A experiência mobile é priorizada.
2. **Profissional e Acolhedor:** Visual limpo, moderno, com toque humano (cores quentes, arredondamentos suaves).
3. **Denso em Informação:** Gestores precisam ver muitos dados rapidamente. Use espaçamento compacto (`gap-2`, `p-3`) sem sacrificar a usabilidade.
4. **Acessível por Padrão:** WCAG 2.1 AA é o mínimo. Navegação por teclado, contraste, labels e foco visível são obrigatórios.
5. **Componentes Reutilizáveis:** Use shadcn/ui como base. Não invente novos padrões visuais sem justificativa.
6. **Modo Escuro (Dark Mode):** Suporte nativo (via `dark:` classes do Tailwind) desde o início.

---

## 2. Linguagem Visual (Visual Language)

### 2.1. Paleta de Cores (Color Palette)

| Função | Cor | Hex | Uso |
| :--- | :--- | :--- | :--- |
| **Primária (Primary)** | Rose | `#e11d48` (600) | Botões principais, links, destaques, badges de "ativo". |
| **Primária Hover** | Rose | `#be123c` (700) | Hover de botões primários. |
| **Primária Fraca** | Rose | `#fce7f3` (100) | Backgrounds sutis, seleções. |
| **Header / Navegação** | Slate | `#0f172a` (900) | Topbar, sidebar, rodapé. |
| **Fundo Principal** | Slate | `#f8fafc` (50) | Background principal (modo claro). |
| **Cards / Painéis** | White | `#ffffff` | Cards, modais, dropdowns. |
| **Bordas** | Slate | `#e2e8f0` (200) | Divisórias, inputs. |
| **Sucesso** | Emerald | `#10b981` (500) | Pagamento confirmado, agendamento concluído, ativo. |
| **Atenção / Alerta** | Amber | `#f59e0b` (500) | Estoque baixo, vencimento próximo, pendência. |
| **Erro / Crítico** | Red | `#ef4444` (500) | Falta (no-show), falha de pagamento, erro crítico. |
| **IA / Automação** | Violet | `#8b5cf6` (500) | Ações disparadas por IA, sugestões inteligentes. |
| **Texto Principal** | Slate | `#1e293b` (800) | Títulos e corpo de texto. |
| **Texto Secundário** | Slate | `#64748b` (500) | Labels, placeholders, dados menos importantes. |

**Regra:** Nunca use cores arbitrárias (ex: `bg-blue-500` para um botão). Se não estiver na paleta acima, **não use**.

### 2.2. Tipografia (Typography)

| Elemento | Fonte | Tamanho | Peso | Uso |
| :--- | :--- | :--- | :--- | :--- |
| **Títulos (H1)** | Plus Jakarta Sans | `text-2xl` (24px) / `text-3xl` (30px) | `font-bold` (700) | Páginas principais, cabeçalhos de seção. |
| **Subtítulos (H2)** | Plus Jakarta Sans | `text-xl` (20px) / `text-2xl` (24px) | `font-semibold` (600) | Títulos de cards, seções secundárias. |
| **Corpo (Body)** | Plus Jakarta Sans | `text-sm` (14px) / `text-base` (16px) | `font-normal` (400) | Texto corrido, parágrafos. |
| **UI / Labels** | Plus Jakarta Sans | `text-xs` (12px) / `text-sm` (14px) | `font-medium` (500) | Rótulos de campos, badges, dados de tabela. |
| **Números / Valores** | JetBrains Mono (ou monoespaçada) | `text-sm` (14px) | `font-medium` (500) | Valores monetários, métricas, IDs. |
| **Links** | Plus Jakarta Sans | `text-sm` (14px) | `font-medium` (500) | Links de navegação, ações secundárias. |

**Importante:**
- **Mobile:** Tamanhos mínimos de toque: 44x44px.
- **Hierarquia:** Use tamanhos e pesos para criar hierarquia visual, não apenas cores.

### 2.3. Espaçamento (Spacing)

Use o sistema de grid do Tailwind (baseado em múltiplos de 4px):

| Token | Valor | Uso |
| :--- | :--- | :--- |
| `p-1` / `m-1` | 4px | Margens mínimas entre ícones e texto. |
| `p-2` / `m-2` | 8px | Padding interno de badges, chips. |
| `p-3` / `m-3` | 12px | Padding de cards pequenos, itens de lista. |
| `p-4` / `m-4` | 16px | Padding de cards, containers. |
| `p-6` / `m-6` | 24px | Padding de seções, modais. |
| `gap-2` | 8px | Espaço entre elementos em grids/flex. |
| `gap-4` | 16px | Espaço entre seções, grupos de campos. |

### 2.4. Bordas e Sombras (Borders & Shadows)

| Elemento | Valor | Uso |
| :--- | :--- | :--- |
| **Border Radius (Padrão)** | `rounded-lg` (8px) | Cards, containers, inputs. |
| **Border Radius (Botões)** | `rounded-md` (6px) | Botões primários/secundários. |
| **Border Radius (Modais)** | `rounded-xl` (12px) | Modais, bottom sheets. |
| **Border Radius (Destaque)** | `rounded-full` (9999px) | Badges, avatares, chips. |
| **Shadow (Card)** | `shadow-sm` | Cards, containers leves. |
| **Shadow (Elevado)** | `shadow-md` | Dropdowns, modais, elementos flutuantes. |
| **Shadow (Ênfase)** | `shadow-lg` | Elementos que precisam de destaque (ex: alertas). |

### 2.5. Ícones (Icons)

- **Biblioteca:** Lucide React (v0.542+).
- **Tamanho:** `size-4` (16px) para ícones inline, `size-5` (20px) para ações primárias, `size-6` (24px) para navegação.
- **Cor:** Herdar a cor do texto (`currentColor`) ou usar uma cor específica da paleta (ex: `text-rose-600` para ícones de ação primária).

---

## 3. Componentes Base (shadcn/ui)

StyleFlow usa **shadcn/ui** como base para todos os componentes primitivos.

### 3.1. Componentes Obrigatórios do shadcn/ui (MVP)

| Componente | Uso |
| :--- | :--- |
| `Button` | Ações primárias, secundárias, destrutivas. |
| `Input` | Campos de formulário (texto, email, telefone). |
| `Select` | Dropdowns para seleção (ex: profissional, serviço). |
| `Calendar` | Seleção de data no agendamento. |
| `Dialog` / `Modal` | Confirmações, formulários em sobreposição. |
| `Sheet` | Painéis laterais, menus mobile. |
| `DropdownMenu` | Menus contextuais, ações em lista. |
| `Tabs` | Navegação entre seções (ex: Painel de Comando). |
| `Card` | Containers de conteúdo. |
| `Badge` | Status, tags, labels. |
| `Alert` | Mensagens de erro, sucesso, aviso. |
| `Table` | Listas de dados (clientes, agendamentos). |
| `Toast` | Notificações temporárias. |

### 3.2. Customização (Temas)

**Nunca** modifique diretamente os componentes do shadcn/ui no `components/ui/`. Em vez disso, use:

1. **Classes Tailwind:** Adicione classes `className` para estender (ex: `className="bg-rose-600 text-white"`).
2. **Variantes:** Use `cva` (class-variance-authority) para criar variantes reutilizáveis no `shared/ui/`.

**Exemplo (Botão Primário Customizado):**

```tsx
// shared/ui/button-primary.tsx
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const ButtonPrimary = ({ className, ...props }: React.ComponentProps<typeof Button>) => (
  <Button
    className={cn(
      'bg-rose-600 text-white hover:bg-rose-700 focus:ring-2 focus:ring-rose-500 focus:ring-offset-2',
      className
    )}
    {...props}
  />
);
```

---

## 4. Layout e Navegação (Layout & Navigation)

### 4.1. Estrutura Geral (Dashboard)


### 4.2. Navegação Responsiva

| Breakpoint | Largura | Navegação |
| :--- | :--- | :--- |
| **Mobile** | < 768px | Bottom Nav (ícones + labels curtos) + Topbar (condensada). |
| **Desktop** | ≥ 768px | Sidebar fixa (240px) + Topbar completa (com título da página). |

**Regras:**
- Bottom Nav: Apenas os 4 itens principais (Dashboard, Agenda, Clientes, Mais).
- Topbar: Sempre visível, com o nome do tenant selecionado.

---

## 5. Painel de Comando (Activity Feed / Feed de Atividades)

Este é um módulo futuro, mas suas diretrizes visuais já devem ser definidas.

### 5.1. Layout do Feed

```text
┌─────────────────────────────────────────────────────────────┐
│  Painel de Comando                         [Filtrar] [Data]│
│  ┌─────┬─────┬─────┬──────┬─────────────────────────────┐│
│  │ 📅  │ 💰  │ 📦  │ 💬   │  (Tabs com contagem)       ││
│  │Agenda│Caixa│Estoq│ Com. │                             ││
│  └─────┴─────┴─────┴──────┴─────────────────────────────┘│
│                                                           │
│  ┌──────────────────────────────────────────────────────┐│
│  │ 🔴  │ Cliente Maria faltou (No-show)   │ 10:30   ││
│  │     │ Agenda - 12/09/2026              │ [Ação]   ││
│  └──────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────┐│
│  │ 🟡  │ Estoque de Tinta X abaixo do mínimo │ 09:15   ││
│  │     │ Estoque - 5 unidades               │ [Ação]   ││
│  └──────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────┐│
│  │ 🟣  │ João respondeu: "Posso 15h?"      │ 08:45   ││
│  │     │ Comunicação - WhatsApp             │ [Ação]   ││
│  └──────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 5.2. Categorias e Cores (Tabs)

| Categoria | Ícone | Cor (Tab) | Cor (Badge de contagem) |
| :--- | :--- | :--- | :--- |
| **Agenda** | `📅` (Calendar) | `text-rose-600` | `bg-rose-100 text-rose-700` |
| **Caixa** | `💰` (Coins) | `text-emerald-600` | `bg-emerald-100 text-emerald-700` |
| **Estoque** | `📦` (Package) | `text-amber-600` | `bg-amber-100 text-amber-700` |
| **Comunicações** | `💬` (MessageCircle) | `text-violet-600` | `bg-violet-100 text-violet-700` |

### 5.3. Cards de Evento (Item do Feed)

Cada evento é um **card horizontal** com:

- **Borda lateral (border-l-4):** Cor correspondente à categoria (ex: `border-rose-500`).
- **Status (Badge):** `new` (azul), `pending` (amarelo), `resolved` (verde), `awaiting` (violeta), `failed` (vermelho).
- **Payload:** Título (ex: "Cliente Maria faltou"), descrição (ex: "Agendamento 10:00 - 11:00"), horário.
- **Ação:** Botão primário secundário (ex: "Remarcar", "Enviar mensagem", "Baixar estoque").

### 5.4. Tipografia do Feed

| Elemento | Classe | Exemplo |
| :--- | :--- | :--- |
| Título do Evento | `text-sm font-medium text-slate-800` | "Cliente Maria faltou" |
| Descrição | `text-xs text-slate-500` | "Agendamento 10:00 - 11:00" |
| Horário | `text-xs text-slate-400` | "10:30" |
| Badge de Status | `text-xs font-medium` | "Pendente" |

---

## 6. Acessibilidade (Accessibility)

A acessibilidade é **obrigatória** e faz parte da Definição de Pronto.

### 6.1. Requisitos Mínimos (WCAG 2.1 AA)

| Critério | Implementação |
| :--- | :--- |
| **Contraste** | Razão de contraste ≥ 4.5:1 para texto normal; ≥ 3:1 para texto grande. Use `text-slate-800` sobre fundo branco, nunca `text-slate-400`. |
| **Navegação por Teclado** | Todos os elementos interativos (botões, inputs, links) devem ser acessíveis via `Tab`. |
| **Foco Visível** | Use `focus:ring-2 focus:ring-rose-500 focus:ring-offset-2` em todos os elementos interativos. |
| **ARIA Labels** | Botões de ícone devem ter `aria-label` descritivo. |
| **Semântica HTML** | Use `<button>` para ações, `<a>` para links, `<h1>`...`<h6>` para títulos. Evite `<div onClick>`. |
| **Reduced Motion** | Respeite `prefers-reduced-motion` (use `motion-safe:` nas animações). |

### 6.2. Testes de Acessibilidade

- Use **axe-core** integrado ao Playwright para testes automáticos.
- Teste manualmente com leitores de tela (NVDA, VoiceOver) para fluxos críticos.

---

## 7. Modo Escuro (Dark Mode)

- Use a estratégia `dark:` do Tailwind.
- **Fundo:** `dark:bg-slate-950` (quase preto).
- **Cards:** `dark:bg-slate-900`.
- **Texto:** `dark:text-slate-100` (primário) e `dark:text-slate-400` (secundário).
- **Bordas:** `dark:border-slate-800`.
- **Cores primárias:** Mantêm-se as mesmas (Rose, Emerald, Amber, Violet) com ajuste de contraste.

---

## 8. Design System Checklist para Agentes

Antes de finalizar qualquer componente UI, verifique:

```text
[ ] O componente existe no shadcn/ui? Se sim, use-o.
[ ] As cores estão na paleta definida? (Rose/Slate/Emerald/Amber/Violet)
[ ] O espaçamento segue o sistema (múltiplos de 4px)?
[ ] O texto está em Português‑BR?
[ ] É responsivo (mobile-first)?
[ ] É acessível (tab, focus, aria-label)?
[ ] Suporta modo escuro (dark:)?
[ ] Foi testado em mobile (360px+) e desktop?
[ ] A documentação foi atualizada se um novo componente reutilizável foi criado?
```

---

## 9. Rastreabilidade (Traceability)

| Documento | Relação |
| :--- | :--- |
| `architecture.md` | Define onde os componentes vivem (`shared/ui/`). |
| `testing-strategy.md` | Define testes de acessibilidade (axe-core). |
| `definition-of-done.md` | Acessibilidade é critério de "pronto". |
| `domain-model.md` | Entidades que são exibidas nos cards do feed. |

---

## 10. Notas Finais (Para Agentes e Designers)

- **Consistência é mais importante que criatividade.** Se você não tem certeza, olhe para um componente existente e copie o padrão.
- **Nunca use cores fora da paleta.** Se precisar de uma cor nova, adicione-a ao documento primeiro.
- **O Painel de Comando (Activity Feed) é o futuro.** As diretrizes visuais definidas aqui devem ser seguidas quando o módulo for implementado.
- **Português‑BR:** Toda a interface é para usuários brasileiros. Use "Agendamento", "Cliente", "Estoque", etc. Termos técnicos em inglês (`tenant`, `appointment`) são para código, não para UI.