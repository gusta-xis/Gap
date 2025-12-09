# GAP — Gestão e Administração Pessoal

Pequeno projeto Node.js + Express que implementa um painel de finanças pessoais.

Estrutura principal
- `server.js` — entrada do servidor Express
- `public/` — arquivos estáticos (frontend): HTML, CSS, JS e imagens
- `src/` — código do servidor: `api`, `middlewares`, `Modules` (core, finance)
- `docs/` — documentação e scripts (ex.: `script.sql`, relatório de revisão)

Variáveis de ambiente
Crie um arquivo `.env` na raiz com as seguintes variáveis mínimas (exemplo em `.env.example`):

- `PORT` — porta do servidor (ex.: 3000)
- `JWT_SECRET` — segredo para assinar tokens JWT
- `DB_HOST` — host MySQL
- `DB_USER` — usuário MySQL
- `DB_PASSWORD` — senha MySQL
- `DB_NAME` — nome do banco

Scripts úteis
- `npm run dev` — inicia com `nodemon`
- `npm start` — inicia com `node server.js`
- `npm run format` — formata o código com Prettier
- `npm run format:check` — checa formatação
- `npm run report:pdf` — gera o PDF do relatório (requer `md-to-pdf`)

Boas práticas e recomendações
- Não armazene JWT em `localStorage` em produção (risco XSS). Considere cookies HttpOnly.
- Mantenha `JWT_SECRET` fora do controle de versão.
- Use `npm audit fix` regularmente para corrigir vulnerabilidades.

Como contribuir
1. Crie um branch a partir de `Dev`.
2. Faça alterações e rode `npm run format`.
3. Abra um PR descrevendo as mudanças.
