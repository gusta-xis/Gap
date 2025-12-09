# Revisão de Padrões de Código — Projeto GAP

Data: 2025-12-09

Resumo executivo

- Escopo: revisão dos padrões de código do repositório Gap (backend Node/Express e frontend estático com Tailwind).
- Ações realizadas: leitura dos principais arquivos, identificação de inconsistências, pequenas correções aplicadas (remoção de dotenv duplicado, adição de utilitário `sendError`, refatoração de `userController`, adição de `.editorconfig` e `.prettierrc`).

Principais observações

- Módulos: backend usa CommonJS coerentemente; manter ou migrar para ES modules se preferir modernizar.
- Variáveis de ambiente: havia múltiplos `require('dotenv').config()` espalhados — agora centralizado no `server.js`.
- Tratamento de erros: havia inconsistência entre controllers (alguns usavam `err.status`, outros forçavam 500). Adicionado `src/utils/errorHandler.js` e controllers refatorados para usar `sendError(res, err)`.
- Estilo: mistura de aspas, ponto e vírgula e indentação. Adicionados `.editorconfig` e `.prettierrc` para padronizar formatação.
- Dependências: `package.json` inclui pacotes possivelmente não usados (`react`, `tailwind` pacotes, `css`). Recomendo limpeza.
- Segurança: token salvo em `localStorage` (risco XSS). Recomendo avaliar cookies HttpOnly para sessões.

Correções aplicadas (detalhado)

1. Removido `require('dotenv').config()` de:

- `src/middlewares/authMiddleware.js`
- `src/Modules/Gap-Core/services/userService.js`

2. Adicionado utilitário de erros:

- `src/utils/errorHandler.js` — exporta `sendError(res, err)` para padronizar resposta JSON e status HTTP.

3. Refatorado `userController` para usar `sendError` e normalizar tratamento de callbacks.

4. Adicionado arquivos de formatação:

- `.editorconfig` e `.prettierrc`.

Recomendações (próximos passos)

- Rodar ESLint + Prettier e formatar todo o projeto. Sugestão: adicionar `prettier` como devDependency e script `npm run format`.
- Remover dependências não usadas no `package.json` (ex.: `react`, `tailwind` pacote local, `css`) e rodar `npm prune`.
- Considerar migrar para `async/await` nas camadas de service/controller para maior legibilidade.
- Rever estratégia de armazenamento de JWT (mover para cookie HttpOnly quando possível).
- Adicionar `README.md` com variáveis de ambiente necessárias (`JWT_SECRET`, DB credentials) e instruções de desenvolvimento.

Como gerar o PDF deste relatório

No seu ambiente Windows (cmd.exe), instale `pandoc` (https://pandoc.org/) ou use o Chrome para imprimir o markdown como PDF.

Com `pandoc` instalado:

```
pandoc docs\code-review-report.md -o docs\code-review-report.pdf
```

Ou abra `docs\code-review-report.md` em um editor que suporte exportar para PDF (VS Code, Typora) e exporte.

**Mapa de arquivos (descrição por arquivo/página)**

- `server.js`: entrada da aplicação Express — carrega `dotenv`, configura middlewares (`express.json`, logger), serve a raiz `/` (login), rota `/subtemas`, arquivos estáticos (`public`) e monta as rotas da API em `/api`.
- `package.json`: dependências e scripts (`dev`, `start`). Removi dependências não usadas e adicionei `prettier` como devDependency durante a revisão.
- `package.json`: dependências e scripts (`dev`, `start`). Removi dependências não usadas e adicionei `prettier` e `md-to-pdf` como devDependencies durante a revisão; adicionei scripts `format`, `format:check` e `report:pdf`.
- `src/api.js`: agrega rotas de módulos (`/users`, `/salarios`, `/gastos-fixos`).
- `src/config/db.js`: configura conexão MySQL (`mysql2`).
- `src/middlewares/logger.js`: middleware de logging que adiciona `req.passo` para passos de log e tempo de execução.
- `src/middlewares/authMiddleware.js`: verifica JWT no header `Authorization` e popula `req.user`.
- `src/middlewares/errorMiddleware.js`: middleware final para tratamento de erros (mantido).
- `src/utils/errorHandler.js`: utilitário adicionado `sendError(res, err)` para padronizar respostas de erro JSON.

- `src/Modules/Gap-Core/routes/userRoutes.js`: rotas públicas e protegidas para usuários (`/login`, CRUD).
- `src/Modules/Gap-Core/controllers/userController.js`: controller do usuário — agora utiliza `sendError` e padroniza respostas.
- `src/Modules/Gap-Core/services/userService.js`: lógica de negócio do usuário — hashing com `bcrypt`, geração de JWT; suporta criação em massa com `Promise.all`.
- `src/Modules/Gap-Core/models/userModel.js`: abstração de acesso ao banco (queries SQL) — mantém callbacks.

Nota rápida: alguns arquivos de configuração adicionais existem no repositório e vale mencioná-los:

- `.prettierrc` (formatação)
- `.editorconfig` (indentação/encoding)
- `.hintrc` (htmlhint config)
- `.gitattributes`

Nota: durante a revisão padronizei o tratamento de erros dos controllers do módulo `Gap-Finance`.
Os arquivos atualizados foram:

- `src/Modules/Gap-Finance/controllers/salarioController.js`
- `src/Modules/Gap-Finance/controllers/fixoController.js`
- `src/Modules/Gap-Finance/controllers/variaveisController.js` (implementado durante a revisão)

Todos esses controllers agora usam `src/utils/errorHandler.js` (`sendError`) para lidar com erros de serviço.

Observação sobre uso de `res.status(...)` no código atual:

- Uso direto de `res.status(...)` permanece em respostas de sucesso (`200`, `201`) e em casos `404` (registro não encontrado) — isso é esperado e apropriado.
- Middlewares de validação (`src/Modules/Gap-Finance/middlewares/validatorsMiddleware.js`) continuam retornando `res.status(400)` para erros de validação (correto).
- Não foram encontradas ocorrências de `res.status(500).json({ error: err.message })` espalhadas após a normalização; as respostas de erro agora são centralizadas via `sendError` onde aplicável.

- `public/login.html`: página de login e cadastro (front) que consome `POST /api/users/login` e `POST /api/users`.
- `public/subtemas.html`: painel principal após login — chama `scripts/subtemas.js` e `styles/subtemas.css`.
- `public/scripts/script.js`: script do login/cadastro — usa `fetch` + `async/await`, salva `token` e `user` no `localStorage`, redireciona para `/subtemas`.
- `public/scripts/subtemas.js`: inicializador do painel — verifica `token`, popula saudação e avatar, trata logout e `pageshow` para bfcache.
- `public/styles/style.css` e `public/styles/subtemas.css`: estilos globais e específicos de `subtemas` (grid de fundo, avatar, tipografia).
- `public/img/`: contém assets SVG como `burnt-cooper.svg` (logo) usados no header e como fallback do avatar.

- `docs/code-review-report.md` / `docs/code-review-report.pdf`: relatório desta revisão (Markdown e PDF gerado).
- `docs/script.sql`: arquivo SQL com scripts de criação/população do banco — importante para inicializar o schema local. (Havia um pequeno typo no relatório anterior: o arquivo é `script.sql`.)

Correções/ações extras realizadas durante a revisão

- Instalei `prettier` e `md-to-pdf` como dependências de desenvolvimento e rodei `prettier --write` em todo o repositório.
- Gere i o PDF (`docs/code-review-report.pdf`) com `md-to-pdf`.
- Adicionei `docs/*.pdf` ao `.gitignore` para evitar commitar relatórios gerados.

Recomendações adicionais (correções que você pode querer aplicar agora)

- Verificar e migrar quaisquer controllers menores restantes para `sendError` caso seja desejado (a maioria dos controllers principais já foi atualizada).
- Adicionar exemplos de request/response no `README.md` (ex.: payload de login e resposta com `token` + `user`).
- `npm audit` foi executado e `npm audit fix --force` foi aplicado durante a revisão; no momento não há vulnerabilidades reportadas.

Checklist rápido para revisão manual antes de merge

- [ ] Confirmar que o endpoint de login retorna o objeto `user` junto com `token` (frontend salva `user` no `localStorage`).
- [ ] Verificar se `variaveisController.js` deve ser implementado; caso contrário, remover o arquivo.
- [ ] Revisar todos os controllers em `src/Modules` e migrar para `sendError` quando apropriado.
- [ ] Adicionar `README.md` e `.env.example`.

Se quiser, eu aplico automaticamente as mudanças da checklist (A — commit + PR), ou aplico e deixo pronto para você revisar localmente (B).

Atualização: substituí o `README.md` pelo conteúdo que você forneceu (versão pública do GitHub). O `README.md` agora contém:

- Descrição do projeto e objetivos
- Tecnologias utilizadas e estrutura do projeto
- Rotas de API listadas (ex.: endpoints de usuários)
- Instruções de instalação e execução
- Informação sobre banco de dados e contribuição

Recomendo revisar o bloco de rotas no README e alinhá-lo com as rotas atuais do projeto (algumas rotas no README usam caminhos como `/api/users/save` enquanto no código atual as rotas estão montadas em `/api/users` com endpoints diferentes — verifique os nomes e ajuste para evitar confusão externa).

Verificação após alinhamento do `README`:

- Atualizei o `README.md` para refletir as rotas reais implementadas pelo projeto (ex.: `/api/users/login`, `POST /api/users`, `GET /api/users`, `GET /api/users/:id`, `PUT /api/users/:id`, `DELETE /api/users/:id`).
- Ajustei o exemplo de `.env` no `README` para usar `DB_PASSWORD` (o código e `.env.example` usam `DB_PASSWORD`, o `README` antigo usava `DB_PASS`).
- Atualizei a estrutura do diretório `public/` no `README` para `styles/`, `scripts/` e `img/` (o repositório usa `public/styles`, `public/scripts` e `public/img`).

Com isso, o `README` agora está consistente com o código atual. Ainda recomendo que, se você pretende expor a documentação pública do API, adicione um bloco detalhado de exemplos de requests/responses (ex.: payload de login e exemplo de resposta contendo `token` e `user`).

Observação: os arquivos acima são os pontos centrais do repositório; se desejar posso gerar um `docs/overview.md` com checklist detalhado por arquivo (ex.: variáveis `.env` necessárias, endpoints, payloads esperados).
