# Target Customer — StyleFlow SaaS

**Status:** APPROVED TARGET
**Version:** 1.0
**Updated:** 2026-09-02
**Scope:** MVP — Beauty / Salões e Centros Estéticos
**Authority:** Definição do cliente ideal (ICP) e personas

---

## 0. Como Agentes Devem Usar Este Documento

Este documento define o **perfil do cliente ideal (ICP)** para o StyleFlow, incluindo personas, critérios de qualificação, dores e comportamentos de compra.

É a fonte da verdade para:
- Orientar vendas e marketing (quem prospectar?).
- Priorizar funcionalidades no `mvp.md` (o que é essencial para esse ICP?).
- Validar hipóteses de negócio com clientes reais.
- Guiar o design da UI (personas têm necessidades específicas).

### Regras de Autoridade

- `target-customer.md` define **quem compra e quem usa** o StyleFlow.
- `problem.md` define **as dores que esse ICP sente**.
- `business-model.md` define **a capacidade de pagamento e o ROI esperado**.
- `mvp.md` define **o escopo mínimo para atender esse ICP**.
- `domain-model.md` define **as entidades que suportam as necessidades do ICP**.

---

## 1. ICP (Ideal Customer Profile) — Hipótese

### 1.1. Descrição Geral

**Segmento:** Salões de beleza, clínicas de estética e barbearias no Brasil.

**Tamanho:** Pequeno a médio (2 a 5 profissionais ativos).

**Faturamento Mensal:** R$ 15.000 a R$ 50.000.

**Localização:** Áreas urbanas (cidades com mais de 50 mil habitantes) — onde há densidade de clientes e concorrência.

**Perfil do Decisor:** Dona(o) do salão, gestor(a) operacional, idade entre 30 e 55 anos.

**Perfil dos Usuários Diários:**
- **Recepcionista:** agenda, check-in, atendimento ao cliente.
- **Gerente:** comissões, finanças, relatórios.
- **Profissional:** visualiza agenda, registra consumo de produtos, acessa anamnese.

### 1.2. Critérios de Qualificação (MQL)

- [ ] Possui CNPJ ativo (salão, clínica ou barbearia).
- [ ] Atende clientes com hora marcada (serviços recorrentes, não apenas "entrada").
- [ ] Possui no mínimo 2 profissionais (funcionários ou comissionados).
- [ ] Utiliza WhatsApp para se comunicar com clientes (pelo menos 50% das interações).
- [ ] Sente dor aguda com faltas, agenda manual ou falta de visibilidade financeira.
- [ ] Já tentou outro software de gestão (e fracassou) ou ainda está no papel/Excel.
- [ ] Orçamento disponível para software (mesmo que não formalizado, está disposto a pagar para resolver a dor).

---

## 2. Personas

### 2.1. Persona Primária: "Dona Verônica" (Owner / Economic Buyer)

**Nome fictício:** Verônica, 42 anos.

**Negócio:** Salão de beleza com 3 cadeiras, 4 profissionais (2 CLT, 2 comissão).

**Faturamento:** R$ 28.000/mês.

**Tecnologia atual:** Agenda no papel + WhatsApp + planilha Excel para finanças.

**Dores principais (alinhadas com `problem.md`):**
- **Lucro invisível:** Não sabe qual serviço dá mais lucro (acha que corte é lucrativo, mas não contabiliza produtos).
- **Faltas:** Perde R$ 3.000–4.000/mês com faltas de clientes.
- **Baixa fidelização:** Clientes somem e ela não tem tempo de correr atrás.
- **Desconexão:** Gasta 2h/dia controlando agenda e mensagens no WhatsApp.

**Motivação:** Quer crescer, abrir uma segunda unidade, mas sente que "opera no escuro" e não tem controle real do negócio.

**Budget para software:** R$ 150–300/mês (Plano Professional).

**Canal de comunicação preferido:** WhatsApp e indicações de outras donas de salão.

---

### 2.2. Persona Secundária: "Gerente Diego" (Multi‑unidade / Franchise)

**Nome fictício:** Diego, 35 anos.

**Negócio:** Franquia de estética com 3 unidades.

**Faturamento:** R$ 120.000/mês (consolidado).

**Tecnologia atual:** Sistema legado (antigo) + planilhas manuais.

**Dores principais:**
- **Visibilidade consolidada:** Não tem visão integrada das unidades (cada uma opera separadamente).
- **Comissão manual:** Cálculo de comissão é manual e gera conflitos com profissionais.
- **Marketing ineficaz:** Marketing é centralizado, mas não personalizado por unidade.

**Motivação:** Quer profissionalizar a operação, ter indicadores de performance confiáveis e reduzir conflitos internos.

**Budget para software:** R$ 600–1.200/mês (Plano Business + add‑ons).

**Canal de comunicação:** LinkedIn, eventos do setor, parcerias com franquias.

---

### 2.3. Persona Terciária: "Recepcionista Carla" (Daily User)

**Nome fictício:** Carla, 28 anos.

**Negócio:** Salão médio (5 profissionais).

**Necessidades:**
- Interface rápida e mobile‑first (ela atende clientes na recepção, em pé).
- Visualização de agenda clara (cores para status, filtros por profissional).
- Check‑in de clientes com poucos cliques.
- Comunicação com clientes via WhatsApp integrada (não precisa copiar/colar números).

**Motivação:** Menos retrabalho e ligações, mais tempo para atendimento e menos erros de agenda.

**Canal de comunicação:** Não é decisora de compra, mas influencia a recomendação (se ama o sistema, indica para a dona).

---

## 3. Papéis de Compra (Buying Roles)

| Papel | Quem é | Influência na Decisão |
| :--- | :--- | :--- |
| **Economic Buyer** | Dona(o) do salão (Verônica). | **Decisão final.** Avalia ROI, custo e benefício. |
| **Decision Maker** | Dona(o) ou gerente (Diego). | Valida se o sistema resolve os problemas operacionais. |
| **Daily User** | Recepcionista, profissional (Carla). | Influencia a decisão pela usabilidade (se for difícil, rejeita). |
| **Influencer** | Contador, consultor de negócios. | Pode recomendar ou desaconselhar com base em integração fiscal/contábil. |

---

## 4. Jobs to be Done (JTBD)

O cliente não está comprando "módulos" — está **contratando** o StyleFlow para:

| Job to be Done | Como o StyleFlow ajuda |
| :--- | :--- |
| **Coordenar a agenda e reduzir faltas** | Lembretes automáticos (WhatsApp), confirmação de presença, lista de espera. |
| **Entender a rentabilidade real de cada serviço** | Controle de consumo de produtos, comissão e DRE por serviço. |
| **Manter histórico dos clientes e fidelizar** | Anamnese, notas, histórico de atendimentos e fórmulas de cor. |
| **Economizar tempo administrativo** | Tudo em um só lugar (agenda, clientes, estoque, financeiro, comunicação). |
| **Evitar erros de conciliação financeira** | Movimentações financeiras imutáveis e integração com o caixa. |
| **Crescer o negócio de forma sustentável** | Métricas de performance, ticket médio, retenção de clientes. |

---

## 5. Sinais de Forte Fit vs. Fraco Fit

### ✅ Forte Fit (Forte Adequação)
- O negócio tem **mais de um profissional** ou fluxo de trabalho recorrente.
- **Volume significativo de agendamentos** (pelo menos 10 por dia).
- O consumo de produtos **afeta o custo do serviço** (ex: salão de coloração).
- O histórico do cliente **influencia a qualidade do serviço** (ex: anamnese capilar).
- O dono quer **maior visibilidade sobre receita, margem, retenção ou utilização**.
- Ferramentas atuais são **fragmentadas** (papel + WhatsApp + Excel).
- O negócio está **disposto a mudar o workflow** para ganhar valor operacional.

### ❌ Fraco Fit (Fraca Adequação)
- **Operador solo** com necessidades extremamente simples de agenda (apenas 1 profissional).
- O negócio busca **apenas uma página de agendamento público**.
- O cliente **não controla a decisão de compra** (ex: funcionário sem autonomia).
- Não há **fluxo de trabalho recorrente** para gerenciar.
- A exigência principal é um **processo regulatório altamente especializado** (ex: clínica médica com prontuário eletrônico) antes de provar valor core.

---

## 6. Segmentação a Ser Testada (Discovery)

| Segmento | Descrição | Necessidade Principal |
| :--- | :--- | :--- |
| **Solo / Small** | 1–2 profissionais, dono opera tudo. | Agenda simples, lembretes básicos. |
| **Small Team** | 3–5 profissionais, dono + recepcionista. | Agenda, CRM básico, estoque, comissão. |
| **Medium Team** | 6–10 profissionais, gerente dedicado. | Financeiro completo, comissão, estoque, automação. |
| **Premium / Especializado** | Serviços de alto valor (ex: coloração avançada). | Anamnese detalhada, fórmulas personalizadas. |
| **Multi‑unidade** | Franquias, grupos com 2+ unidades. | Visão consolidada, permissões avançadas. |

**Nota:** O MVP foca em **Small Team** e **Medium Team**, mas a segmentação exata será validada com clientes reais.

---

## 7. Perguntas de Descoberta (Para Entrevistas com Clientes)

Use estas perguntas para validar o ICP e as hipóteses de `problem.md` e `business-model.md`:

1. **Qual é o problema operacional mais caro (em dinheiro ou tempo) que você enfrenta hoje?**
2. **O que você faz atualmente para gerenciar agenda, clientes, estoque e financeiro? (Quais ferramentas?)**
3. **Onde os erros acontecem? (ex: agendamento duplicado, estoque incorreto, cliente perdido)?**
4. **Como você calcula o lucro de um serviço específico? (ex: corte de cabelo)?**
5. **O que faria você trocar de software (ou sair do papel/Excel)?**
6. **Quanto você já gasta (ou está disposto a gastar) para resolver esse problema?**
7. **Que resultado faria você pagar R$ 199/mês com satisfação?**

---

## 8. Exclusões Explícitas (Não é Alvo Agora)

- **Monoprofissionais** (1 profissional) — baixa complexidade, baixo LTV (mas podem ser atendidos pelo plano Essential no futuro).
- **Grandes redes** (>10 unidades) — exigem vendas consultivas e customização (não escalável no MVP).
- **Salões rurais** ou com baixa densidade digital — CAC alto e dificuldade de onboarding.
- **Outros segmentos** (oficinas, clínicas, dentistas) — apenas após validação em Beauty.

---

## 9. Verificação de Consistência com Documentos Existentes

| Documento | Verificação | Status |
| :--- | :--- | :--- |
| `vision.md` | O ICP está alinhado com a visão de "sistema operacional para serviços". | ✅ Consistente |
| `problem.md` | O ICP sente as quatro dores descritas (lucro invisível, faltas, baixa fidelização, desconexão). | ✅ Consistente |
| `business-model.md` | O ICP tem capacidade de pagar os planos (R$ 79–499/mês). O ROI estimado (70x) justifica o preço. | ✅ Consistente |
| `mvp.md` | O MVP cobre as necessidades do ICP (agenda, clientes, estoque básico, financeiro básico, WhatsApp). | ✅ Consistente |
| `domain-model.md` | CPF obrigatório (BR-CUS-001) atende à exigência legal brasileira. | ✅ Consistente |
| `architecture.md` | A estrutura de vertical slices suporta as funcionalidades para o ICP. | ✅ Consistente |
| `multi-tenancy.md` | O isolamento de tenant garante que cada salão veja apenas seus dados. | ✅ Consistente |
| `security-baseline.md` | Anamnesis com `privacy_level = 'restricted'` protege dados sensíveis do ICP. | ✅ Consistente |
| `design-system.md` | A UI mobile‑first atende ao perfil de uso diário (recepcionista em pé). | ✅ Consistente |
| `testing-strategy.md` | Testes de isolamento e conflito garantem a confiabilidade esperada pelo ICP. | ✅ Consistente |

---

## 10. Notas Finais para Agentes

- **O ICP é uma hipótese a ser validada.** Os valores e perfis descritos aqui devem ser testados com clientes reais durante a fase de Discovery (M1/M2).
- **CPF é obrigatório para o cliente.** Isso é uma exigência legal (LGPD e emissão fiscal futura) — o sistema deve ter `cpf` como campo obrigatório no cadastro de clientes.
- **As personas são guias para design e vendas.** Use Verônica, Diego e Carla para tomar decisões de UI/UX e priorização.
- **Segmentação é dinâmica.** À medida que validarmos com clientes, podemos ajustar o ICP e as personas.
- **O dono do salão é o "cliente", mas o usuário diário é a "recepcionista/profissional".** Ambos precisam ser atendidos — a dona compra, a recepcionista usa todos os dias.

---

*End of target-customer.md*