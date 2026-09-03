# Memory — Vitest webidl Error Fix (Node 24 CI)

**Data:** 2026-09-03
**Autor:** StyleFlow Team
**Contexto:** GitHub Actions CI failure — `TypeError: webidl.util.markAsUncloneable is not a function`

## Problema
O CI do GitHub Actions falhava em `npm run test:ci` com:
```
TypeError: webidl.util.markAsUncloneable is not a function
  at new CacheStorage node_modules/undici/lib/web/cache/cachestorage.js:20:17
  at Object.<anonymous> node_modules/jsdom/lib/api.js:12:33
```

## Causa Raiz
GitHub Actions **descontinuou Node.js 20** (deprecation announced 2025-09-19).
Mesmo com `node-version: 20` no workflow, o runner usa **Node 24 por padrão**.

Em Node 24, o módulo built-in `webidl` não expõe `util.markAsUncloneable`,
que o `undici` (importado pelo `jsdom`) tenta chamar no construtor de
`CacheStorage`. Isso causa o crash ao carregar o ambiente `jsdom`.

O segredo foi que **dois arquivos de configuração do Vitest existiam**:
- `vitest.config.mjs` → `environment: 'node'` (correto, ESM, sem warning)
- `vitest.config.ts` → `environment: 'jsdom'` (causava o erro)

O Vitest carrega `.ts` em preferência a `.mjs`, então o arquivo jsdom
**sempre vinha com prioridade**, ignorando a configuração `node` do `.mjs`.

## Solução Aplicada
1. **Removido `vitest.config.ts`** — eliminou a configuração jsdom que
   era carregada com prioridade, fazendo o Vitest usar
   `vitest.config.mjs` (environment: 'node').
2. **Atualizado `node-version` no CI** de `20` (descontinuado) para `22`
   (LTS atual).
3. As dependências já estavam nas versões compatíveis:
   `jsdom ^30.0.1`, `undici ^8.10.1`, `vitest ^4.1.11`.

## Resultado
- `npm install` → 0 vulnerabilidades, 500 packages.
- `npx vitest run --coverage` → **8 passed, 12 skipped, exit code 0**.
- Nenhum erro `webidl` — o ambiente `node` não importa `jsdom`/`undici`.

## Aprendizado
- O `environment: 'node'` **previne** o crash de `webidl` porque não
  carrega `jsdom` (e consequentemente não importa `undici`).
- Atualizar dependências **sozinho** não resolve o problema se o vitest
  continua carregando a configuração jsdom.
- Ter dois arquivos de config (`vitest.config.ts` + `.mjs`) é uma armadilha:
  o Vitest escolhe um e o outro vira um "ghost config".
- Quando componentes React que exigem DOM forem testados, usar
  `@vitest-environment jsdom` por arquivo — não globalmente.