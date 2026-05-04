# SQL para aplicar no Supabase

Os arquivos aqui são pra rodar **na ordem** no SQL Editor do projeto Supabase
(Project → SQL → New query → cola → Run). Idempotentes — pode rodar de novo
sem duplicar dados.

## Ordem

1. **`000_init.sql`** — schema completo (16 tabelas + enums + índices). Gerado por `prisma migrate diff`.
2. **`001_seed.sql`** — pesos das categorias + Vinicius + Emanuel + tiers + Season ativa.
3. **`002_rls.sql`** — Row Level Security: colaborador isolado, admin liberado.

## Alternativa via CLI

Se preferir rodar local com `DATABASE_URL` configurada em `.env.local`:

```bash
# Aplica schema (cria todas as tabelas)
npx prisma db push

# Seed (Vinicius + Emanuel + pesos)
npx prisma db seed

# RLS — não tem comando do Prisma; cola no SQL Editor:
psql "$DATABASE_URL" -f prisma/migrations/sql/002_rls.sql
```

## Depois disso

1. **Authentication → Users**: cria os usuários com **mesmo email** que está em `User.email` (vinicius@anomalo.com.br, emanuel@anomalo.com.br, e o seu próprio).
2. Marca seu próprio `User.role` como `ADMIN` no SQL Editor:
   ```sql
   UPDATE public."User" SET "role" = 'ADMIN' WHERE "email" = 'seu-email@anomalo.com.br';
   ```
3. **Authentication → URL Configuration**:
   - Site URL: `https://<seu-vercel>.vercel.app`
   - Redirect URLs: `http://localhost:3000/**`, `https://<seu-vercel>.vercel.app/**`

## Nota sobre RLS e o admin de Mood

A política `mood_self_rw` **não permite admin ler** via RLS (de propósito).
A página `/admin/mood` agrega via Prisma com a SERVICE ROLE key, que bypassa
RLS. A query no servidor nunca seleciona `user` ao listar comentários — só
`weekISO + rating + comment + createdAt`. Garantia em duas camadas: regra
no banco + disciplina no código.
