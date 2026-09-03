# Vision — StyleFlow SaaS

**Status:** APPROVED TARGET
**Version:** 1.0
**Updated:** 2026-09-02
**Scope:** MVP — Beauty / Salões e Centros Estéticos
**Authority:** Direção estratégica e propósito da empresa

---

## 0. Como Agentes Devem Usar Este Documento

Este documento define a **visão de longo prazo, o propósito e os princípios estratégicos** do StyleFlow.

É a fonte da verdade para:
- Alinhar decisões de produto com a direção da empresa.
- Justificar escolhas arquiteturais e de escopo.
- Comunicar a missão para investidores, clientes e time.
- Orientar a evolução do produto além do MVP.

### Regras de Autoridade

- `vision.md` define **para onde a empresa está indo**.
- `problem.md` define **o problema que resolvemos agora**.
- `mvp.md` define **o primeiro passo nessa direção**.
- `business-model.md` define **como a visão se sustenta financeiramente**.
- `domain-model.md` define **as entidades que suportam a visão**.
- `architecture.md` define **como a visão é tecnicamente construída**.
- `AGENTS.md` define **como agentes de IA contribuem para a visão**.

---

## 1. O que Somos

StyleFlow é o **sistema operacional (OS) para negócios de serviços presenciais** — uma plataforma SaaS multi‑tenant que unifica agenda, CRM, financeiro, estoque, comunicação, inteligência artificial e emissão fiscal em um único painel.

Começamos com **salões de beleza, clínicas de estética e barbearias** (a vertical Beauty), mas nossa arquitetura modular foi desenhada para expandir para outros segmentos de serviços (oficinas mecânicas, clínicas odontológicas, centros de estética avançada, etc.) quando o modelo estiver validado.

**Não somos** uma agenda eletrônica. **Não somos** um ERP genérico. Somos uma **plataforma orientada a dados e agentes** que transforma operações diárias em decisões financeiras e estratégicas, com visibilidade unificada através do **Painel de Comando (Activity Feed)**.

---

## 2. Propósito

> **Capacitar pequenos e médios prestadores de serviço a operarem com a mesma eficiência, visibilidade financeira e retenção de clientes de uma grande rede, sem precisar de equipe de TI, planilhas complexas ou múltiplas ferramentas desconectadas.**

StyleFlow existe para **devolver o tempo do gestor** — tempo que hoje é perdido apagando incêndios, reconciliando dados e ligando para clientes — e transformá‑lo em **tempo de crescimento, estratégia e atendimento ao cliente**.

---

## 3. Visão de Longo Prazo

Ser a **camada operacional (plataforma) que conecta**:

- **O negócio** (agenda, finanças, estoque, caixa)
- **Os profissionais** (comissão, performance, agenda)
- **Os clientes** (portal, histórico, fidelização, avaliações, anamnese)
- **A comunicação** (WhatsApp, automação, campanhas, lembretes)
- **O fiscal** (emissão de notas, conformidade tributária)
- **O gestor** (Painel de Comando com visibilidade unificada de todos os eventos operacionais)

Tudo isso com:

- **Segurança por padrão** (LGPD, isolamento de dados via RLS)
- **Inteligência aplicada** (IA para sugestões, análise de padrões, automação de marketing)
- **Modularidade real** — o SaaS Core é reutilizável para futuras verticais, evitando reescritas.
- **CPF como identidade única** — obrigatório para clientes, garantindo rastreabilidade fiscal e legal.

No longo prazo, queremos que o StyleFlow seja o **"sistema nervoso"** do negócio de serviços: onde todos os dados operacionais fluem, são analisados e acionam ações automáticas ou recomendações inteligentes, e o gestor tem uma visão de 360° do seu negócio em um único painel.

---

## 4. Posicionamento Estratégico

| | Tradicional (Papel/Excel) | StyleFlow |
| :--- | :--- | :--- |
| **Foco** | Controle de agenda | Rentabilidade por serviço e retenção de cliente |
| **Dados** | Isolados (papel, WhatsApp, Excel) | Unificados (cliente → serviço → produto → lucro) |
| **IA** | Nenhuma | Agentes para reagendamento, marketing, análise |
| **Comunicação** | Manual (ligação/WhatsApp) | Automatizada (lembretes, campanhas, confirmação) |
| **Fiscal** | Terceirizado | Integrado (NFS‑e, Reforma Tributária no futuro) |
| **Modelo** | Sistema vertical | Plataforma + verticais (Beauty → Auto → Saúde) |
| **Visibilidade Operacional** | Fragmentada (vários sistemas) | Unificada (Painel de Comando / Activity Feed) |
| **Tomada de Decisão** | Intuição | Dados + IA |

---

## 5. Princípios da Empresa

1. **O cliente (salão) é o centro** — cada funcionalidade aumenta o lucro ou reduz a dor do negócio.
2. **Multi‑tenancy por design** — isolamento total entre clientes, com RLS e verificações em camadas.
3. **IA como parceira** — agentes aumentam a capacidade humana, não a substituem. A IA nunca toma decisões críticas sem supervisão humana.
4. **Modularidade real** — o SaaS Core (auth, billing, RBAC) é reutilizável; as verticais são especializadas.
5. **Dados como ativo** — cada interação gera aprendizado para o negócio e para a plataforma.
6. **Segurança e LGPD** — não negociáveis; dados sensíveis (anamnese, CPF, etc.) são tratados com rigor.
7. **Observabilidade desde o início** — métricas de negócio, produto e engenharia são prioridade.
8. **Evolução por evidência** — arquitetura e funcionalidades evoluem a partir de dados reais de uso, não de suposições.
9. **Documentação como parte da engenharia** — todo conhecimento relevante está documentado para agentes e humanos (`docs/`, `specs/`, `memory/`).
10. **CPF como identidade obrigatória** — para clientes, garantindo rastreabilidade e conformidade com a legislação brasileira.

---

## 6. Arquitetura de Produto (Conceitual)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         SAAS CORE                                      │
│  • Tenant & Membership • Identity (Auth) • RBAC • Audit • Billing    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      DOMAIN PLATFORM                                   │
│  • Scheduling • Customer (CRM) • Catalog • Inventory                  │
│  • Finance • Communication • Platform Operations (Activity Feed)     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      VERTICAL: BEAUTY (primeira)                       │
│  • Anamnesis • Color Formula • Beauty‑specific workflows              │
│  • Product Consumption • Commission Rules • WhatsApp Workflows        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      VERTICAL: AUTO / DENTAL / ... (futuro)          │
│  • Reutiliza o SaaS Core e parte do Domain Platform                  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Nota:** O **Platform Operations (Activity Feed)** é um pilar fundamental da visão — o Painel de Comando que unifica eventos de agenda, caixa, estoque e comunicações em um único local, proporcionando visibilidade operacional completa para o gestor.

---

## 7. North Star (Métrica Principal — Hipótese)

> **"Valor financeiro gerenciado com sucesso por mês"**

Tradução: quanto dinheiro o salão consegue rastrear, otimizar e aumentar usando a plataforma.

Isso será medido por:

- **Atendimentos realizados e faturados via sistema.**
- **Produtos consumidos registrados** (controle de custo).
- **Comissões calculadas automaticamente** (transparência para profissionais).
- **Receitas e despesas consolidadas (DRE)** (lucro líquido mensal).
- **Redução de faltas** (via lembretes automatizados).
- **Retenção de clientes** (via CRM e histórico).

No futuro, a North Star pode evoluir para "lucro líquido por atendimento" ou "retenção de clientes (NPS)".

---

## 8. Próximos Passos (M1/M2 do Roadmap)

- **Validar hipóteses:** Problema, ICP, disposição a pagar com 5 a 10 salões reais.
- **Definir o MVP:** Com base nas dores mais agudas identificadas (ver `mvp.md`).
- **Reconstruir o domínio:** Extrair entidades e regras do sistema legado (já feito no `domain-model.md`).
- **Implementar o MVP:** Seguindo TDD, vertical slices e os contratos de agente (`AGENTS.md`).
- **Lançar com pilotos:** Coletar feedback, iterar e ajustar a precificação.
- **Planejar o Painel de Comando:** Para a versão v1.1 (pós‑MVP), implementar o `Activity Feed` como próximo grande diferencial.

---

## 9. Verificação de Consistência com Documentos Existentes

| Documento | Verificação | Status |
| :--- | :--- | :--- |
| `problem.md` | A visão está alinhada com as dores que resolvemos (lucro invisível, faltas, baixa fidelização, desconexão). | ✅ Consistente |
| `target-customer.md` | O ICP (salões pequenos/médios com CPF obrigatório) é o foco da visão. | ✅ Consistente |
| `business-model.md` | A visão de plataforma modular justifica o modelo de receita (planos + add‑ons). | ✅ Consistente |
| `mvp.md` | O MVP é o primeiro passo validado para alcançar a visão. | ✅ Consistente |
| `domain-model.md` | A arquitetura de domínio reflete a visão de SaaS Core + Domain Platform + Verticais + Activity Feed. | ✅ Consistente |
| `architecture.md` | A arquitetura de monólito modular suporta a evolução para verticais e o Activity Feed. | ✅ Consistente |
| `multi-tenancy.md` | O isolamento de tenant é fundamental para a visão de SaaS multi‑tenant. | ✅ Consistente |
| `security-baseline.md` | A visão inclui segurança e privacidade como princípios, com CPF como dado obrigatório. | ✅ Consistente |
| `AGENTS.md` | A visão de AI‑orchestrated company está refletida no contrato de agentes. | ✅ Consistente |
| `api-guidelines.md` | A visão de APIs seguras e bem documentadas suporta a plataforma. | ✅ Consistente |

---

## 10. Notas Finais para Agentes

- **A visão é o "norte" do projeto.** Todas as decisões devem ser avaliadas à luz desta visão.
- **O MVP não é a visão completa.** Ele é o primeiro passo validado. Não implemente features que não estejam no `mvp.md` apenas porque fazem sentido na visão de longo prazo.
- **O Painel de Comando (Activity Feed) é um diferencial estratégico.** Ele será implementado após o MVP (v1.1), mas a arquitetura deve estar preparada para ele desde o início (tabela `activity_feed` já criada no schema).
- **A IA é um meio, não um fim.** Use IA para amplificar a capacidade humana, não para substituí‑la. Decisões críticas (financeiras, de segurança, de isolamento de dados) sempre exigem supervisão humana.
- **A documentação é viva.** Este documento deve ser atualizado à medida que a visão evolui com base no aprendizado do mercado.

---

*End of vision.md*