-- ════════════════════════════════════════════════════════════════════════
-- 007 · ALINHA colaboradores.email COM OS EMAILS REAIS DO AUTH
-- ════════════════════════════════════════════════════════════════════════
--
-- O seed do 006 usou emails @anomalo.com.br como placeholder. Os
-- usuários reais do Supabase Auth são esses emails pessoais. Pra que
-- o mapping auth.user → colaborador funcione, os emails precisam bater.
--
-- Idempotente: a query UPDATE só altera quando o email antigo existe.
-- Pode rodar várias vezes sem efeito colateral depois da primeira.
-- ════════════════════════════════════════════════════════════════════════

UPDATE public."colaboradores"
SET email = 'emanuelkreis6@gmail.com',
    nome  = 'Emanuel'
WHERE email = 'emanuel@anomalo.com.br';

UPDATE public."colaboradores"
SET email = 'viniciusfern16@gmail.com',
    nome  = 'Vinicius'
WHERE email = 'vinicius@anomalo.com.br';

UPDATE public."colaboradores"
SET email = 'anomalofelipe@gmail.com',
    nome  = 'Felipe'
WHERE email = 'felipe@anomalo.com.br';

UPDATE public."colaboradores"
SET email = 'cttbrunofreitas@gmail.com',
    nome  = 'Bruno'
WHERE email = 'sejaanomalo@gmail.com';

UPDATE public."colaboradores"
SET email = 'alisson.ajp17@gmail.com',
    nome  = 'Alisson'
WHERE email = 'alisson@anomalo.com.br';

-- Verificação: deve listar 5 colaboradores com os emails reais
SELECT nome, email, funcoes, is_admin FROM public."colaboradores" ORDER BY nome;
