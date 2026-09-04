# Design System - StyleFlow SaaS

**Status:** APPROVED TARGET
**Version:** 2.0
**Updated:** 2026-09-03
**Scope:** MVP - Beauty / Saloes e Centros Esteticos
**Authority:** Linguagem visual, componentes, interacoes e acessibilidade

---

## 0. Agent Constraints (Rules of Authority)

Before writing or editing any line of code, any AI Agent operating on this repository must verify the following five strict constraints:

1. **Check `shared/ui/` or `features/[feature]/presentation/components/` First**: Always reuse existing primitives before creating new component files.
2. **Strict Color Palette Enforcement**: Use ONLY the explicit Slate, Rose, and semantic tokens defined in Section 2.
3. **Language Invariant (Portugues-BR)**: All customer-facing UI must be in Portuguese do Brasil.
4. **Mandatory Accessibility (WCAG AA)**: Minimum contrast 4.5:1, focus rings, aria-labels, 44x44px touch targets.
5. **Mandatory Dark Mode Synchronization**: Every component must use Tailwind dark: variants.

---

## 1. Core Principles

### 1.1 Anti-AI-Slop Manifesto

Forbidden: No arbitrary gradients, no neon glows, no glassmorphism on static cards, no nested cards, no side-tab borders, no uncalibrated border radii (cap: rounded-2xl).

### 1.2 Z-Axis Depth Rule (Dark Mode)

| Level | Class | HEX | Usage |
| :--- | :--- | :--- | :--- |
| Z-0 Base | bg-slate-950 | #020617 | Root background |
| Z-1 Structural | bg-slate-900 | #0f172a | Header, sidebar |
| Z-2 Content | bg-slate-900 | #0f172a | Cards, tables |
| Z-3 Floating | bg-slate-800 | #1e293b | Dropdowns |
| Z-4 Modal | bg-slate-900 + border | #0f172a | Dialogs |

---

## 2. Color Palette (Absolute Tokens)

### 2.1 Neutrals (Slate)

| Token | Hex | Role |
| :--- | :--- | :--- |
| Slate 50 | #f8fafc | Light canvas |
| Slate 100 | #f1f5f9 | Dividers, dark text |
| Slate 200 | #e2e8f0 | Borders |
| Slate 300 | #cbd5e1 | Hover borders |
| Slate 400 | #94a3b8 | Placeholders |
| Slate 500 | #64748b | Secondary text |
| Slate 600 | #475569 | Inactive icons |
| Slate 700 | #334155 | Dark borders |
| Slate 800 | #1e293b | Dark cards |
| Slate 900 | #0f172a | Dark bg, light headings |
| Slate 950 | #020617 | Dark canvas |

### 2.2 Brand (Rose)

| Token | Hex | Role |
| :--- | :--- | :--- |
| Rose 50 | #fff1f2 | Active nav pill |
| Rose 100 | #ffe4e6 | Hover active |
| Rose 500 | #f43f5e | Gradient start |
| Rose 600 | #e11d48 | **Core Brand Primary** |
| Rose 700 | #be123c | Pressed state |
| Rose 950 | #4c0519 | Dark shadows |

### 2.3 Semantic Tokens

| State | Classes | Hex |
| :--- | :--- | :--- |
| Success | text-emerald-500 / bg-emerald-500/10 | #10b981 |
| Warning | text-amber-500 / bg-amber-500/10 | #f59e0b |
| Danger | text-red-500 / bg-red-500/10 | #ef4444 |
| Info | text-indigo-500 / bg-indigo-500/10 | #6366f1 |

### 2.4 Signature Gradient

```
bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-500
```
Authorized: Logo, favicon, hero icon containers ONLY.

### 2.5 CSS Custom Properties

See `app/globals.css` for complete token definitions.

---

## 3. Typography & Scale

### 3.1 Font Stack

System font stack via `font-sans`.

### 3.2 Typographic Hierarchy

| Role | Classes | Size | Weight |
| :--- | :--- | :--- | :--- |
| Display H1 | text-3xl tracking-tight font-black | 30px | 900 |
| Page Title H2 | text-2xl tracking-tight font-bold | 24px | 700 |
| Section H3 | text-xl tracking-tight font-bold | 20px | 700 |
| Card Header H4 | text-base font-semibold | 16px | 600 |
| Body Primary | text-sm leading-relaxed | 14px | 400 |
| Body Secondary | text-xs leading-normal | 12px | 400 |
| Micro-Label | text-[10px] font-bold tracking-wider uppercase | 10px | 700 |

### 3.3 No-Wrap Rule

All buttons, pills, chips, badges: `whitespace-nowrap select-none`

---

## 4. Spacing & Layout

### 4.1 Button Proportion (2:1)

| Variant | Padding | Classes | Height |
| :--- | :--- | :--- | :--- |
| Compact | 6px/12px | px-3 py-1.5 text-xs | ~32px |
| Standard | 10px/20px | px-5 py-2.5 text-sm | ~42px |
| Large | 12px/24px | px-6 py-3 text-base | ~48px |

### 4.2 Container

`<main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">`

---

## 5. Borders, Corners & Shadows

### 5.1 Nested Corner Formula

R_inner = R_outer - P_padding

### 5.2 Radius Matrix

| Element | Class |
| :--- | :--- |
| Modal / Login Card | rounded-3xl (24px) |
| Standard Card | rounded-2xl (16px) |
| Inputs / Buttons | rounded-xl (12px) |
| Avatars, Tags, Toggles | rounded-full |

### 5.3 Shadow Tokens

Light: shadow-md shadow-slate-200/50 (card)
Dark: shadow-xl shadow-slate-950/50 (card), shadow-2xl shadow-rose-950/20 (hero)
Modal: shadow-2xl shadow-black/80

---

## 6. Icons

Source: `lucide-react` exclusively. Default stroke width. Color inherits from parent via `text-current`.

---

## 7. Animations (motion/react)

See `shared/lib/animations.ts` for:
- pageTransitionVariants
- staggerContainerVariants / staggerItemVariants
- buttonWhileHover / buttonWhileTap

---

## 8. Component Primitives

All implementations in `shared/ui/`:

| Component | File |
| :--- | :--- |
| Button | shared/ui/button.tsx |
| Card | shared/ui/card.tsx |
| Input | shared/ui/input.tsx |
| Label | shared/ui/label.tsx |
| Alert | shared/ui/alert.tsx |
| EmptyState | shared/ui/empty-state.tsx |
| CardSkeleton | shared/ui/card-skeleton.tsx |
| SwitchToggle | shared/ui/switch-toggle.tsx |
| ToastNotification | shared/ui/toast-notification.tsx |

---

## 9. Layout Architecture

### 9.1 Navigation

- Header: h-16, backdrop-blur-md, z-30
- Bottom Bar: h-16, fixed, backdrop-blur-md, md:hidden
- Nav items with icons (lucide-react, w-5 h-5)

### 9.2 Navigation States

- Active: font-bold text-rose-600 bg-rose-50 rounded-xl
- Inactive: font-medium text-slate-600 hover:bg-slate-50 rounded-xl

---

## 10. Verification Checklist

- Colors from authorized tokens
- Dark mode Z-axis respected
- Button padding 2:1
- whitespace-nowrap on badges/buttons
- Nested radii calculated
- Icons from lucide-react
- Strings in Portugues-BR
- Animations use motion/react
- Mobile-first responsive
- Accessible (tab, focus, aria)

---

## 11. Traceability

| Doc | Relation |
| :--- | :--- |
| architecture.md | Component location |
| testing-strategy.md | Accessibility tests |
| definition-of-done.md | Done criteria |
| domain-model.md | Displayed entities |

---

## 12. Notas Finais

- Consistencia e mais importante que criatividade.
- Nunca use cores fora da paleta.
- Portugues-BR: Toda a interface e para usuarios brasileiros.
