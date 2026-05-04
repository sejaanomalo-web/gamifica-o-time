# Anômalo Meta

Sistema interno de gamificação por metas da Anômalo Hub. Mobile-first PWA, Next.js 16 + Supabase + Prisma.

> Bundle de design original em `~/Library/Mobile Documents/com~apple~CloudDocs/ANÔMALO/Anômalo/SISTEMAS/ATIVOS/GAMIFICAÇÃO/index.html` (protótipo HTML/CSS/JS standalone que serviu de referência visual).

---

## Stack

- **Next.js 16** App Router · **React 19** · **TypeScript**
- **Tailwind v4** (config em `globals.css` via `@theme`)
- **shadcn/ui** primitivos
- **Supabase** (Auth + Postgres + Storage) · **Prisma 7**
- **Framer Motion** · **canvas-confetti** · **Howler.js**
- **web-push** + service worker (PWA)
- **Recharts** (admin)
- **Playwright** (e2e) · `node:test` via `tsx` (unit)

> Diferença vs `BUILD_INSTRUCTIONS.md`: o `create-next-app@latest` puxou Next 16 + Tailwind v4. As tokens do tema foram traduzidas pra `@theme` no CSS (em vez de `tailwind.config.ts`).

## Setup

### 1. Variáveis de ambiente

Copia `.env.example` pra `.env.local` e preenche.

```bash
cp .env.example .env.local
```

- `DATABASE_URL` / `DIRECT_URL`: Supabase Postgres connection strings
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`: dashboard Supabase → Settings → API
- VAPID: `npx web-push generate-vapid-keys` (copia public key pra `NEXT_PUBLIC_VAPID_PUBLIC_KEY` E `VAPID_PUBLIC_KEY`, private pra `VAPID_PRIVATE_KEY`)
- `CRON_SECRET`: qualquer string longa e aleatória; precisa estar configurada em Vercel também

### 2. Banco

```bash
npx prisma migrate dev --name init
npx prisma db seed   # cria pesos + Vinicius + Emanuel
```

### 3. Dev

```bash
npm run dev
```

### 4. Testes

```bash
npm run test:unit       # commission calc (14 cases)
npm run test:e2e        # Playwright (auth, mobile, mood anonimidade)
```

## Estrutura

```
src/
├── app/
│   ├── (app)/                    # rotas autenticadas com TopBar+SideNav+BottomNav
│   │   ├── dashboard
│   │   ├── metas/[id]
│   │   ├── ranking
│   │   ├── mural
│   │   ├── badges
│   │   ├── loja/resgates
│   │   ├── perfil/{editar,comissionamento,wrapped/[seasonId]}
│   │   ├── notificacoes
│   │   ├── configuracoes
│   │   └── mood                  # full-screen, fora do shell
│   ├── (admin)/admin/{metas,validacoes,usuarios,gamificacao,comissionamento,relatorios,mood,alertas}
│   ├── api/
│   │   ├── goals, deliveries, profile, mood
│   │   ├── push/{subscribe,send}
│   │   └── cron/{temporada,wrapped,alertas,mood,comissao}
│   ├── login, recuperar-senha
│   ├── layout.tsx, page.tsx, manifest.ts, globals.css
├── components/
│   ├── motion/                   # Reveal, CountUp, PulsingLambda, ConstellationBg
│   ├── layout/                   # BottomNav, SideNav, TopBar, PageTransition
│   ├── feature/{goal,profile,commission,wrapped,celebration}
│   ├── pwa/PushSubscribeButton
│   └── ui/                       # shadcn primitivos
├── lib/
│   ├── supabase/{client,server}
│   ├── prisma, auth, push, cron
│   ├── commission                # cálculo puro testado
│   ├── confetti, sound, xp
│   └── utils
├── generated/prisma              # Prisma 7 client output
└── middleware.ts                 # auth + rota gates

prisma/{schema.prisma, seed.ts}
public/sw.js                      # service worker (push + click-through)
tests/{unit, e2e}
vercel.json                       # 5 cron schedules
```

## Regras duras (não quebrar)

1. **Cantos vivos sempre.** `tailwind.config` zera todo radius. Override de qualquer `rounded-*` precisa de justificativa explícita.
2. **Sem em-dash em copy.** Buscar e remover antes do deploy.
3. **Mood é anônimo.** `MoodEntry.userId` existe SÓ pra dedupe semanal e disparar `LOW_MOOD` alert. A view `/admin/mood` agrupa por `weekISO + rating` e nunca seleciona `user`. Test em `tests/e2e/mood-anonymity.spec.ts`.
4. **XP e pontos de comissão são a MESMA UNIDADE.** Cada `Delivery` cria 1 `XpEvent` (alimenta ranking) e soma pra fechamento mensal de comissão. Loja saca de saldo separado (`XP_disponível = sum(XpEvent) − sum(Redeem != REJEITADO)`).
5. **Comissão em CENTS.** `bonusValue: Int` em centavos. Conversão pra display só via `formatCents()`.
6. **Snapshots congelam meses fechados.** `CommissionMonth.tierSnapshot` + `weightsSnapshot` (JSON) preservam a regra do mês. Edit de tier/weights NÃO recalcula passado.
7. **Wrapped congela snapshot no fim da temporada.** `WrappedSnapshot` é gerado pelo cron `/api/cron/wrapped` e NÃO recalcula em runtime.
8. **Cantos vivos no card · borda dourada fina · gloss zero · gradiente zero.** Exceções autorizadas: confete e level-up overlay (efeitos funcionais, não decorativos).

## Vercel cron

Configurado em `vercel.json`:

| path                 | schedule        | objetivo |
|----------------------|-----------------|----------|
| `/api/cron/temporada`| `0 0 * * *`     | rotação de temporada + premiação top-3 |
| `/api/cron/wrapped`  | `0 1 * * *`     | snapshot Wrapped + push pros colaboradores |
| `/api/cron/alertas`  | `0 6 * * *`     | NO_LOGIN / NO_GOAL / LOW_MOOD |
| `/api/cron/mood`     | `0 19 * * 5`    | sexta 16h BRT — push pros que não responderam |
| `/api/cron/comissao` | `0 3 1 * *`     | dia 1 do mês — fecha mês anterior |

Todas validam `Authorization: Bearer ${CRON_SECRET}`.

## Decisões registradas (lê antes de editar)

- **Auth:** Supabase Auth + email/senha. Sem MFA. RLS no banco precisa ser configurado no painel.
- **Tailwind v4 syntax:** tokens em `@theme` no `globals.css`, não em `tailwind.config.ts`.
- **`CommissionTier.notes` é livre.** Use pra documentar o porquê do plano de cada colaborador.
- **`prisma/seed.ts`** cria Vinicius (cap M2 240, excelência 260+, fixo R$ 200, R$ 50/10pts) e Emanuel (cap M2 119, excelência 120+, fixo R$ 100, R$ 20/10pts) — emails e salário base são placeholders, confirmar com Bruno.

## Placeholders pendentes (substituir antes do go-live)

- `public/sounds/levelup.mp3` — toque ~600ms estilo "ding" suave
- `public/icons/icon-192.png`, `icon-512.png`, `maskable-512.png` — ícones PWA
- Identidade visual em `identidade/DESIGN.md` — cópia bloqueada pelo sandbox; subir manualmente
- Avatares dos colaboradores (fallback de iniciais funciona)
- Lista inicial de badges (criar via `/admin/gamificacao` quando UI estiver pronta)
- Catálogo da loja (idem)
- Email institucional correto de Vinicius e Emanuel — placeholder `@anomalo.com.br`
- Salário base no `CommissionTier` — placeholder 0
- Frase do Alisson pro slide de encerramento do Wrapped — placeholder "Construção. Constância."

## Faltas conhecidas (build incremental)

Existem como rota mas precisam de iteração antes de produção:

- `/admin/metas` — falta dialog de criar/editar
- `/admin/validacoes` — falta preview de evidência + ação aprovar/rejeitar funcional
- `/admin/usuarios` — falta convite + edit
- `/admin/gamificacao` — só shell de tabs, sem forms ainda
- `/admin/comissionamento` — preview e histórico OK; falta editor de tier/pesos e form de entrega/ajuste
- `/admin/relatorios` — sem gráficos Recharts ainda
- `WrappedShareCard` — botão só mostra alerta; falta integração `html-to-image` + Web Share
- `AvatarUpload` em `/perfil/editar` — só placeholder

Tudo o mais é funcional condicionado a (1) DB migrado e (2) variáveis de ambiente configuradas.
