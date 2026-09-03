# Memory — Setup Inicial

**Data:** 2026-09-03  
**Autor:** StyleFlow Team  
**Contexto:** Configuração do ambiente de desenvolvimento e CI.

## Descobertas
- O Supabase local expõe PostgreSQL na porta `54322` e a API em `54321`.
- A anon key padrão do Supabase local é: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`.

## Aprendizados
- O erro `webidl.util.markAsUncloneable` no CI foi resolvido usando `environment: 'node'` no Vitest.
- `supabase db reset` não existe na CLI atual; use `supabase migration up`.

## Decisões
- Usar `environment: 'node'` para testes até que precisemos testar componentes React que exijam DOM.
- Manter o esquema de migrações como `0001_foundations.sql` (v1.2) e criar novas migrações para alterações futuras.

## Próximos Passos
- Iniciar implementação da autenticação (Sprint 1).