# 📋 CODE REVIEW COMPLETO - PROJETO GAP

**Data da Análise:** 14 de Dezembro de 2025  
**Versão do Projeto:** 1.0.0  
**Auditor:** Arquiteto de Software Sênior

---

## 1. 🗺️ Visão Macro da Arquitetura

### Padrão Arquitetural
O projeto **GAP** utiliza uma **arquitetura modular em camadas** baseada no padrão **MVC (Model-View-Controller)**, com uma clara separação de responsabilidades:

- **Camada de Apresentação (View)**: Frontend com HTML/CSS/JS vanilla servidos como arquivos estáticos
- **Camada de Controle (Controller)**: Controllers que recebem requisições HTTP e delegam para services
- **Camada de Negócio (Service)**: Services que contêm a lógica de negócio
- **Camada de Dados (Model)**: Models que interagem diretamente com o banco MySQL

A arquitetura é **modular por domínio**, permitindo adicionar novos módulos (`Gap-Finance`, `Gap-Core`, `Gap-Kanban`) de forma independente.

### Comunicação Frontend-Backend

```
[Browser] → HTTP Request → [Express Server]
    ↓
[api-service.js] gerencia tokens em sessionStorage
    ↓
Authorization: Bearer <JWT>
    ↓
[authMiddleware.js] valida JWT
    ↓
[Controller] → [Service] → [Model] → [MySQL Database]
    ↓
JSON Response ← [Controller]
```

**Fluxo de Autenticação:**
1. Usuário faz login via `/api/v1/users/login`
2. Backend retorna `accessToken` (15min) + `refreshToken` (7 dias)
3. Frontend armazena em `sessionStorage`
4. Toda requisição protegida envia `Authorization: Bearer <token>`
5. Se `accessToken` expira, `api-service.js` usa `refreshToken` automaticamente

### Principais Tecnologias (package.json)

**Backend:**
- `express` 4.18.2 - Framework web
- `mysql2` 3.6.4 - Driver MySQL com prepared statements
- `bcryptjs` 2.4.3 - Hash de senhas (10 rounds)
- `jsonwebtoken` 9.0.2 - Autenticação JWT
- `helmet` 8.1.0 - Headers de segurança (CSP, XSS)
- `express-rate-limit` 8.2.1 - Proteção contra brute force
- `cors` 2.8.5 - Controle de origens permitidas
- `dotenv` 16.3.1 - Variáveis de ambiente

**Frontend:**
- Tailwind CSS 4.1.17 (com PostCSS e plugins)
- JavaScript Vanilla (sem frameworks)
- Fetch API para comunicação HTTP

---

## 2. 📂 Análise Detalhada: Pasta por Pasta, Arquivo por Arquivo

### 📁 Diretório Raiz `/`

#### 📄 `server.js`
**O que este arquivo realiza:** Ponto de entrada da aplicação. Configura o servidor Express, middlewares de segurança, rotas estáticas e API.

**Análise do Código:**
- **Validação rigorosa de variáveis de ambiente** (linhas 12-32): Verifica presença de `DB_HOST`, `DB_USER`, `DB_NAME`, `JWT_SECRET`, etc. Falha imediatamente se ausentes.
- **Helmet com CSP customizado** (linhas 39-51): Configura Content Security Policy permitindo scripts do Tailwind CDN e inline styles necessários.
- **Headers de segurança adicionais** (linhas 54-66): HSTS, XSS Protection, nosniff, frame deny, cache control agressivo.
- **CORS restritivo** (linhas 72-95): Apenas origens específicas permitidas (`localhost:3000`, `localhost:5173`). Credentials habilitado corretamente.
- **Rate limiting diferenciado** (linhas 100-120):
  - Login: 5 tentativas por 15min
  - API geral: 100 requisições por 15min
- **Limite de payload** (linha 126): 10kb para prevenir ataques de memória.
- **Roteamento limpo sem extensões .html** (linhas 159-189): URLs amigáveis (`/financeiro`, `/subsistemas`).
- **Tratamento de erros global** (linhas 207-222): Não expõe stack traces em produção.

**Pontos de Atenção:**
- ✅ **Excelente:** Validação de env vars antes de iniciar servidor
- ✅ **Segurança forte:** Headers bem configurados, CORS restritivo, rate limiting
- ⚠️ **Observação:** Cache-Control `no-store` em todos os arquivos estáticos pode impactar performance. Considere permitir cache para imagens/CSS com hash.
- ⚠️ **CORS**: `allowedOrigins` inclui `process.env.ALLOWED_ORIGINS` mas não valida formato. Pode permitir injeção se mal configurado.

---

#### 📄 `package.json`
**O que este arquivo realiza:** Manifesto do projeto com dependências e scripts de build.

**Análise:**
- Scripts bem definidos: `start`, `dev` (com nodemon), `build:css` (Tailwind)
- Dependências atualizadas (Sequelize 6.35 presente mas **não utilizado** no código)
- ⚠️ **Inconsistência:** `sequelize` está instalado mas o projeto usa `mysql2` com queries diretas

---

#### 📄 `src/api.js`
**O que este arquivo realiza:** Centralizador de rotas da API. Mapeia prefixos para módulos.

**Análise:**
```javascript
router.use('/users', userRoutes);
router.use('/salarios', salarioRoutes);
router.use('/gastos-fixos', fixoRoutes);
router.use('/gastos-variaveis', variaveisRoutes);
```
- ✅ Estrutura limpa e escalável
- ✅ Cada módulo tem suas próprias rotas
- ✅ Middleware de autenticação aplicado nas rotas individuais

---

### 📁 Diretório `/src/config`

#### 📄 `src/config/db.js`
**O que este arquivo realiza:** Gerencia conexão MySQL com reconexão automática.

**Análise do Código:**
- Usa `mysql2` (não pool, conexão única)
- **Reconexão inteligente** (linhas 14-38): Até 5 tentativas com delay de 5s
- **Event listeners** (linhas 40-55): Detecta `PROTOCOL_CONNECTION_LOST`, `ER_CON_COUNT_ERROR`, `ECONNREFUSED`
- Exporta método `db.checkConnection()` para health checks

**Pontos de Atenção:**
- ⚠️ **Performance:** Usa conexão única, não connection pool. Para produção, recomenda-se `mysql2.createPool()`
- ✅ **Resiliência:** Reconexão automática bem implementada
- ✅ **SQL Injection:** Prepared statements usados consistentemente nos models

---

### 📁 Diretório `/src/middlewares`

#### 📄 `src/middlewares/authMiddleware.js`
**O que este arquivo realiza:** Valida JWT em rotas protegidas.

**Análise:**
- Extrai token do header `Authorization: Bearer <token>`
- Usa `jwt.verify()` com `process.env.JWT_SECRET`
- Detecta `TokenExpiredError` e retorna 401 específico
- Injeta `req.user` com payload decodificado (`id`, `email`, `type`)

**Pontos de Atenção:**
- ✅ Validação robusta de token
- ✅ Mensagens de erro apropriadas (401 para expirado, 403 para inválido)
- ⚠️ Não verifica `type: 'access'` explicitamente (deveria rejeitar refresh tokens usados como access tokens)

---

#### 📄 `src/middlewares/logger.js`
**O que este arquivo realiza:** Logger de requisições com mascaramento de dados sensíveis.

**Análise:**
- **Função `maskSensitiveData()`**: Mascara campos como `senha`, `token`, `credit_card`, etc.
- **Logs detalhados**: Timestamp, método, URL, payload mascarado, tempo de resposta
- **Método `req.passo()`**: Permite logging incremental durante processamento

**Pontos de Atenção:**
- ✅ **Segurança:** Mascaramento de dados sensíveis impede vazamento em logs
- ✅ **Observabilidade:** Logs estruturados facilitam debugging
- ⚠️ Em produção, considere usar biblioteca como Winston/Pino para persistência

---

#### 📄 `src/middlewares/errorMiddleware.js`
**O que este arquivo realiza:** Middleware global de erro.

**Análise:**
- Loga stack trace completo
- Retorna JSON com `{ sucesso: false, erro: message }`
- Status code padrão 500 se não especificado

**Pontos de Atenção:**
- ⚠️ **Inconsistência:** Retorna `{ erro }` aqui mas outros lugares retornam `{ error }` (sem acento)
- ✅ Logs detalhados para debugging

---

#### 📄 `src/utils/errorHandler.js`
**O que este arquivo realiza:** Função utilitária `sendError()` para padronizar respostas de erro.

**Análise:**
```javascript
function sendError(res, err) {
  const status = err && err.status ? err.status : 500;
  const message = err && err.message ? err.message : 'Erro interno do servidor';
  return res.status(status).json({ error: message });
}
```

**Pontos de Atenção:**
- ✅ Centraliza lógica de erro
- ⚠️ Retorna `{ error }` (sem acento), diferente do `errorMiddleware.js`

---

### 📁 Módulo `/src/Modules/Gap-Core`

#### 📄 `Gap-Core/controllers/userController.js`
**O que este arquivo realiza:** Controlador de usuários (CRUD + autenticação).

**Análise do Código:**

**Funções exportadas:**
- `login()`: Delega para `userService.login()`, retorna `accessToken` + `refreshToken` + `user`
- `refreshToken()`: Valida e renova access token usando refresh token
- `create()`: Cria usuário (com validação de middleware)
- `findAll()`, `findById()`, `update()`, `delete()`: CRUD padrão
- `forgotPassword()`: Gera token de recuperação (JWT com `type: 'reset'`, expira 1h)
- `resetPassword()`: Valida token de reset e atualiza senha

**Pontos de Atenção:**
- ✅ Uso consistente de `sendError()` para tratamento de erros
- ✅ Validação de entrada nos middlewares (não no controller)
- ⚠️ **Segurança:** `forgotPassword()` retorna o token diretamente na resposta. Em produção, deveria enviar por email.
- ❌ **IDOR Vulnerability CRÍTICA:** `findById()`, `update()`, `delete()` **NÃO** validam se o usuário pertence ao requisitante. Qualquer usuário autenticado pode acessar/modificar outros usuários.

**Exemplo de Exploit:**
```bash
# Usuário ID 5 acessa dados do usuário ID 1
curl -H "Authorization: Bearer <token_user_5>" \
     http://localhost:3000/api/v1/users/1

# Usuário ID 5 deleta usuário ID 1
curl -X DELETE \
  -H "Authorization: Bearer <token_user_5>" \
  http://localhost:3000/api/v1/users/1
```

---

#### 📄 `Gap-Core/services/userService.js`
**O que este arquivo realiza:** Lógica de negócio de usuários.

**Análise:**
- `login()`: 
  - Busca usuário por email
  - Compara senha com `bcrypt.compare()`
  - Gera 2 tokens: `accessToken` (15min) + `refreshToken` (7 dias)
  - Tokens incluem `type` field para distinguir uso
- `refreshAccessToken()`:
  - Verifica se `decoded.type === 'refresh'`
  - Gera novo `accessToken`
  - ✅ **Bom:** Valida tipo de token
- `create()`:
  - Hash de senha com `bcrypt.hash(senha, 10)` (10 rounds)
  - Suporta criação em batch (array)
- `generatePasswordResetToken()`:
  - Gera JWT com `type: 'reset'`, expira 1h
  - ⚠️ Retorna token mesmo se email não existe (blind response, bom para segurança)

**Pontos de Atenção:**
- ✅ Bcrypt com 10 rounds (adequado)
- ✅ JWT com expiração curta (15min access, 7d refresh)
- ✅ Validação de `type` nos tokens
- ⚠️ `JWT_REFRESH_SECRET` usa fallback `process.env.JWT_SECRET + '_refresh'`. Melhor definir explicitamente.

---

#### 📄 `Gap-Core/models/userModel.js`
**O que este arquivo realiza:** Camada de acesso a dados para usuários.

**Análise:**
- **Whitelist de campos**: `ALLOWED_CREATE_FIELDS`, `ALLOWED_UPDATE_FIELDS`
- **Função `filterAllowedFields()`**: Previne mass assignment
- `create()`:
  ```sql
  INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)
  ```
  ✅ **Prepared statement** com placeholders
- `createMany()`: Cria múltiplos usuários em batch
- `findByEmail()`: 
  ```sql
  SELECT id, nome, email, senha FROM users WHERE email = ?
  ```
  ✅ Prepared statement
- `update()`: Dinamicamente constrói query com campos filtrados

**Pontos de Atenção:**
- ✅ **SQL Injection:** Todas as queries usam prepared statements
- ✅ **Mass Assignment:** Whitelist previne ataques
- ✅ Validação de tipos (ex: `Number.isInteger(id)`)
- ⚠️ `findAll()` retorna TODOS os usuários sem paginação. Problema de performance se muitos usuários.

---

#### 📄 `Gap-Core/middlewares/userMiddleware.js`
**O que este arquivo realiza:** Validação de entrada para endpoints de usuário.

**Análise:**
- `validateUser()`:
  - **Login:** Valida email regex + senha não vazia
  - **Cadastro:** Valida nome (3-100 chars), email regex (max 255), senha (força)
- `validatePasswordStrength()`:
  - Mínimo 8 caracteres, máximo 128
  - Exige 1 maiúscula + 1 caractere especial
  - ⚠️ **Falta:** Não exige números ou minúsculas (senha "AAAAAAAA!" é válida)
- `validateResetPassword()`: Valida token + nova senha

**Pontos de Atenção:**
- ✅ Regex de email robusto
- ✅ Limite de tamanho previne DoS
- ⚠️ **Política de senha fraca:** Faltam números e minúsculas
- ⚠️ Não usa biblioteca especializada (ex: `validator.js`)

---

#### 📄 `Gap-Core/routes/userRoutes.js`
**O que este arquivo realiza:** Define rotas HTTP para usuários.

**Análise:**
```javascript
router.post('/login', userController.login);                           // Público
router.post('/', validateUser, userController.create);                 // Público (signup)
router.post('/refresh', userController.refreshToken);                  // Público
router.post('/forgot-password', userController.forgotPassword);        // Público
router.post('/reset-password', validateResetPassword, userController.resetPassword); // Público

router.get('/', authMiddleware, userController.findAll);               // Protegido
router.get('/:id', authMiddleware, userController.findById);           // Protegido
router.put('/:id', authMiddleware, validateUser, userController.update); // Protegido
router.delete('/:id', authMiddleware, userController.delete);          // Protegido
```

**Pontos de Atenção:**
- ✅ Separação clara entre rotas públicas e protegidas
- ❌ **IDOR CRÍTICO:** `GET /:id`, `PUT /:id`, `DELETE /:id` não verificam se `req.params.id === req.user.id`
  - Qualquer usuário autenticado pode acessar/modificar dados de outros usuários!

---

### 📁 Módulo `/src/Modules/Gap-Finance`

#### 📄 `Gap-Finance/controllers/salarioController.js`
**O que este arquivo realiza:** Controlador de salários.

**Análise:**
- `create()`: Injeta `user_id: req.user.id` automaticamente (✅ bom)
- `findById()`: Usa `findByIdAndUser()` para validar propriedade (✅ previne IDOR)
- `findByUserId()`: Retorna apenas salários do usuário autenticado
- `update()`, `delete()`: Usam `updateByIdAndUser()`, `deleteByIdAndUser()` (✅ seguro)

**Pontos de Atenção:**
- ✅ **IDOR prevenido:** Todas as operações validam `user_id`
- ✅ Validação de `id` numérico antes de processar
- ✅ Retorna 403 se usuário tenta acessar recurso de outro

---

#### 📄 `Gap-Finance/models/salarioModel.js`
**O que este arquivo realiza:** Model de salários.

**Análise:**
- `ALLOWED_FIELDS = ['valor', 'mes_ano', 'user_id']`
- `create()`:
  ```sql
  INSERT INTO salarios (valor, mes_ano, user_id) VALUES (?, ?, ?)
  ```
  ✅ Prepared statement
- `findByIdAndUser()`:
  ```sql
  SELECT * FROM salarios WHERE id = ? AND user_id = ?
  ```
  ✅ Valida propriedade do recurso
- `updateByIdAndUser()`:
  ```sql
  UPDATE salarios SET ... WHERE id = ? AND user_id = ?
  ```
  ✅ Seguro contra IDOR

**Pontos de Atenção:**
- ✅ **Segurança:** Todas as queries validam `user_id`
- ✅ Prepared statements em todas as queries
- ✅ Whitelist de campos

---

#### 📄 `Gap-Finance/controllers/fixoController.js`
**Análise:** Idêntico ao `salarioController.js` em estrutura. Todas as operações validam `user_id`.
- ✅ Seguro contra IDOR
- ✅ Validações consistentes

---

#### 📄 `Gap-Finance/controllers/variaveisController.js`
**Análise:** Idêntico ao `salarioController.js` em estrutura.
- ✅ Seguro contra IDOR
- ✅ Validações consistentes
- ✅ Permite `categoria_id: null`

---

#### 📄 `Gap-Finance/middlewares/validatorsMiddleware.js`
**O que este arquivo realiza:** Validadores de entrada para módulo financeiro.

**Análise:**
- `validateSalario()`: Valida `valor >= 0` + `referencia_mes` (formato AAAA-MM)
- `validateGastoFixo()`: Valida `nome`, `valor`, `categoria_id`, `dia_vencimento` (1-31)
- `validateGastoVariavel()`: 
  - Aceita `data_gasto` OU `data` (fallback)
  - Valida formato `AAAA-MM-DD` com regex
  - `valor > 0`
  - Normaliza `data` para `data_gasto`

**Pontos de Atenção:**
- ✅ Validação de formatos de data
- ⚠️ **Regex de data fraco:** `/^\d{4}-\d{2}-\d{2}$/` aceita `9999-99-99` (não valida valores válidos)
- ⚠️ Validação de valor permite `0` para salário (`valor < 0`), mas gasto variável exige `> 0`

---

### 📁 Diretório `/public` (Frontend)

#### 📄 `public/scripts/api-service.js`
**O que este arquivo realiza:** Classe de abstração para comunicação com API.

**Análise do Código:**
- **Sanitização básica**: Remove tags HTML e caracteres de controle
- **Gerenciamento de tokens**:
  - Armazena em `sessionStorage` (✅ mais seguro que localStorage)
  - `setTokens()`, `removeTokens()`, `setAccessToken()`
- **Refresh automático**:
  - Detecta 401 e tenta renovar token
  - Se falhar, remove tokens e redireciona
- **Método `request()`**:
  - Injeta `Authorization: Bearer <token>`
  - Retry automático com novo token após refresh
  - Sanitiza resposta com `sanitizeObject()`
- **Métodos de API**: 
  - `getSalarios()`, `createSalario()`, `updateSalario()`, etc.
  - `login()`, `signup()`, `getUser()`, etc.

**Pontos de Atenção:**
- ✅ **Segurança:** Refresh automático de token
- ✅ Sanitização de entrada/saída
- ✅ Header `X-Requested-With: XMLHttpRequest` (previne CSRF)
- ⚠️ Sanitização remove tags HTML mas não protege contra XSS em outros contextos (ex: URLs)
- ⚠️ `sessionStorage` é limpo ao fechar aba (boa segurança, mas pode frustrar usuários)

---

#### 📄 `public/scripts/finance-dashboard.js`
**O que este arquivo realiza:** Lógica do dashboard financeiro (SPA).

**Análise:**
- **Função `checkAuthentication()`**: 
  - Valida presença de `accessToken` e `user` no sessionStorage
  - Redireciona para login se inválido
  - Tenta parsear JSON (previne dados corrompidos)
- **Função `loadDashboardData()`**:
  - Carrega salários, gastos fixos, gastos variáveis em paralelo
  - **Filtragem por user_id**: Valida que dados pertencem ao usuário
- **Função `calculateTotals()`**:
  - Calcula receitas (salário + entradas variáveis)
  - Calcula despesas (fixos + variáveis)
  - Filtra por mês/ano atual
- **Função `recordBelongsToUser()`**:
  - Verifica múltiplos campos possíveis: `user_id`, `userId`, `usuario_id`

**Pontos de Atenção:**
- ✅ Validação de propriedade de dados no frontend (defesa em profundidade)
- ✅ Fallback para dados vazios se API falhar
- ⚠️ **Performance:** Não usa debouncing ou throttling
- ⚠️ Filtragem por mês atual hardcoded - não permite visualizar meses passados

---

#### 📄 `public/scripts/script.js`
**O que este arquivo realiza:** Lógica da página de login/cadastro/recuperação.

**Análise:**
- **Função `clearUserSession()`**: Limpa sessionStorage e localStorage
- **Event listener `pageshow`**: Força reload se página foi restaurada do cache
- **Login form**:
  - Sanitiza email
  - Envia POST para `/api/v1/users/login`
  - Armazena `accessToken`, `refreshToken`, `user` no sessionStorage
  - Redireciona para `/subsistemas` com `window.location.replace()`
- **Signup form**:
  - Valida senha === confSenha
  - Regex de email simples
  - Reseta form após sucesso

**Pontos de Atenção:**
- ✅ Sanitização de entrada
- ✅ `window.location.replace()` previne volta ao login após autenticação
- ✅ Limpa campo de senha após login
- ⚠️ Validação de senha no frontend é fraca (`senha.length < 8` apenas)

---

#### 📄 `public/scripts/transacoes.js`
**O que este arquivo realiza:** Página de listagem/gerenciamento de transações.

**Análise:**
- **Função `normalizeTransactions()`**:
  - Unifica dados de 3 endpoints (gastos variáveis, fixos, salários)
  - Normaliza para estrutura comum: `{ id, descricao, valor, data, tipo, categoria, origem }`
  - **Validação de propriedade**: `recordBelongsToUser(gasto, userId)`
  - Define `canEdit`, `canDelete` baseado na origem
- **Carregamento paralelo**:
  ```javascript
  const [gastosVariaveis, gastosFixos, salarios] = await Promise.all([...])
  ```

**Pontos de Atenção:**
- ✅ Normalização de dados de múltiplas fontes
- ✅ Validação de propriedade
- ⚠️ Não há paginação (problema se usuário tem muitas transações)

---

#### 📄 `public/login.html`
**Análise:**
- HTML semântico com `<form>` elements
- Inputs com `required` attribute
- Toggle de visibilidade de senha
- ✅ Acessibilidade básica (labels, placeholders)
- ⚠️ Não usa autocomplete attributes (ex: `autocomplete="email"`)

---

#### 📄 `public/app.html`
**Análise:**
- SPA com Tailwind CSS via CDN
- **Preload de dados do usuário**:
  ```javascript
  window.__preloadedUserName = userName;
  window.__preloadedUserInitial = userInitial;
  ```
  Evita FOUC (Flash of Unstyled Content)
- Navegação com `data-page` attributes
- ✅ Dark mode support
- ⚠️ **Segurança:** Tailwind via CDN (CSP permite, mas não ideal para produção)

---

## 3. 🔍 Code Review Técnico (Qualidade & Segurança)

### 🛡️ Segurança

#### ✅ **Pontos Fortes:**

1. **Autenticação robusta:**
   - JWT com expiração curta (15min)
   - Refresh tokens (7 dias)
   - Bcrypt com 10 rounds
   - Tokens tipados (`type: 'access'`, `'refresh'`, `'reset'`)

2. **Prepared Statements:**
   - Todos os models financeiros usam placeholders `?`
   - **SQL Injection prevenido** nos módulos financeiros

3. **IDOR prevenido (parcialmente):**
   - Módulo Gap-Finance valida `user_id` em TODAS as operações
   - Métodos `findByIdAndUser()`, `updateByIdAndUser()`, `deleteByIdAndUser()`

4. **Headers de segurança:**
   - Helmet com CSP
   - HSTS, X-Frame-Options, X-Content-Type-Options
   - CORS restritivo

5. **Rate Limiting:**
   - Login: 5 tentativas/15min
   - API geral: 100 req/15min

6. **Sanitização:**
   - Frontend: Remove HTML tags e caracteres de controle
   - Backend: Whitelist de campos (mass assignment prevention)

#### ❌ **Vulnerabilidades Críticas:**

### 1. IDOR no módulo Gap-Core (SEVERIDADE: CRÍTICA 🔴)

**Localização:** `src/Modules/Gap-Core/routes/userRoutes.js` + `userController.js`

**Problema:** 
Qualquer usuário autenticado pode acessar, modificar ou deletar QUALQUER outro usuário.

**Rotas Afetadas:**
```javascript
router.get('/:id', authMiddleware, userController.findById);           // ❌ VULNERÁVEL
router.put('/:id', authMiddleware, validateUser, userController.update); // ❌ VULNERÁVEL
router.delete('/:id', authMiddleware, userController.delete);          // ❌ VULNERÁVEL
```

**Exploit de Exemplo:**
```bash
# Usuário ID 5 acessa dados do usuário ID 1
curl -H "Authorization: Bearer <token_user_5>" \
     http://localhost:3000/api/v1/users/1

# Usuário ID 5 modifica email do usuário ID 1
curl -X PUT \
  -H "Authorization: Bearer <token_user_5>" \
  -H "Content-Type: application/json" \
  -d '{"email": "hacker@evil.com"}' \
  http://localhost:3000/api/v1/users/1

# Usuário ID 5 deleta usuário ID 1
curl -X DELETE \
  -H "Authorization: Bearer <token_user_5>" \
  http://localhost:3000/api/v1/users/1
```

**Impacto:**
- Vazamento de dados pessoais (nome, email)
- Modificação de credenciais de outros usuários
- Exclusão de contas
- Escalação de privilégios

**Solução Recomendada:**
```javascript
// Em userController.js

findById(req, res) {
  const id = parseInt(req.params.id, 10);
  
  // ✅ Validar que usuário só pode acessar seus próprios dados
  if (id !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ 
      error: 'Acesso negado. Você só pode acessar seus próprios dados.' 
    });
  }
  
  userService.findById(id, (err, r) => {
    if (err) return sendError(res, err);
    if (!r) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    return res.json(r);
  });
},

update(req, res) {
  const id = parseInt(req.params.id, 10);
  
  // ✅ Validar propriedade
  if (id !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  userService.update(id, req.body, (err, r) => {
    if (err) return sendError(res, err);
    return res.json({ message: 'Usuário atualizado com sucesso' });
  });
},

delete(req, res) {
  const id = parseInt(req.params.id, 10);
  
  // ✅ Validar propriedade
  if (id !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  
  userService.delete(id, (err, r) => {
    if (err) return sendError(res, err);
    return res.json({ message: 'Usuário deletado com sucesso' });
  });
}
```

---

### 2. Token de Recuperação Exposto (SEVERIDADE: ALTA 🟠)

**Localização:** `src/Modules/Gap-Core/controllers/userController.js` linha 108

**Problema:** 
O token de recuperação de senha é retornado diretamente na resposta da API, ao invés de ser enviado por email.

**Código Vulnerável:**
```javascript
forgotPassword(req, res) {
  const { email } = req.body;

  userService.generatePasswordResetToken(email, (err, result) => {
    if (err) return sendError(res, err);

    return res.json({
      message: 'Se o email existir, um link de recuperação será enviado.',
      token: result.token  // ❌ EXPÕE TOKEN NO JSON
    });
  });
}
```

**Impacto:**
- Qualquer pessoa pode solicitar reset de senha e receber o token
- Permite ataques de força bruta para descobrir emails válidos
- Token pode ser interceptado se conexão não for HTTPS

**Solução Recomendada:**
```javascript
// 1. Instalar Nodemailer
// npm install nodemailer

// 2. Configurar em userController.js
const nodemailer = require('nodemailer');

// Configurar transporter (usar variáveis de ambiente)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

forgotPassword(req, res) {
  const { email } = req.body;

  userService.generatePasswordResetToken(email, async (err, result) => {
    if (err) return sendError(res, err);

    // ✅ Enviar token por email, não retornar na API
    if (result.token) {
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${result.token}`;
      
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: email,
          subject: 'Recuperação de Senha - GAP',
          html: `
            <p>Você solicitou a recuperação de senha.</p>
            <p>Clique no link abaixo para redefinir sua senha:</p>
            <a href="${resetLink}">${resetLink}</a>
            <p>Este link expira em 1 hora.</p>
          `
        });
      } catch (emailErr) {
        console.error('Erro ao enviar email:', emailErr);
      }
    }

    // ❌ NÃO RETORNAR: token: result.token
    return res.json({
      message: 'Se o email existir, um link de recuperação foi enviado.'
    });
  });
}
```

---

### 3. Política de Senha Fraca (SEVERIDADE: MÉDIA 🟡)

**Localização:** `src/Modules/Gap-Core/middlewares/userMiddleware.js`

**Problema:**
A validação de senha não exige números nem letras minúsculas.

**Código Atual:**
```javascript
function validatePasswordStrength(senha) {
  const errors = [];

  if (senha.length < 8) {
    errors.push('Senha deve ter no mínimo 8 caracteres.');
  }

  if (senha.length > 128) {
    errors.push('Senha muito longa.');
  }

  if (!/[A-Z]/.test(senha)) {
    errors.push('Senha deve conter pelo menos uma letra MAIÚSCULA.');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
    errors.push('Senha deve conter pelo menos um caractere especial (!@#$%^&*...).');
  }

  // ❌ FALTAM: números e minúsculas
  
  return errors;
}
```

**Senhas Fracas Aceitas:**
- `"AAAAAAAA!"` (apenas maiúsculas e especial)
- `"SENHA123!"` (sem minúsculas)
- `"Password!"` (sem números)

**Solução:**
```javascript
function validatePasswordStrength(senha) {
  const errors = [];

  if (senha.length < 8) {
    errors.push('Senha deve ter no mínimo 8 caracteres.');
  }

  if (senha.length > 128) {
    errors.push('Senha muito longa.');
  }

  if (!/[A-Z]/.test(senha)) {
    errors.push('Senha deve conter pelo menos uma letra MAIÚSCULA.');
  }

  // ✅ ADICIONAR validação de minúsculas
  if (!/[a-z]/.test(senha)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula.');
  }

  // ✅ ADICIONAR validação de números
  if (!/[0-9]/.test(senha)) {
    errors.push('Senha deve conter pelo menos um número.');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
    errors.push('Senha deve conter pelo menos um caractere especial (!@#$%^&*...).');
  }

  return errors;
}
```

---

### 4. Validação de Data Fraca (SEVERIDADE: BAIXA 🟢)

**Localização:** `src/Modules/Gap-Finance/middlewares/validatorsMiddleware.js`

**Problema:**
Regex aceita datas inválidas como `9999-99-99`, `2025-13-40`, etc.

**Código Atual:**
```javascript
const regexData = /^\d{4}-\d{2}-\d{2}$/;
if (!regexData.test(dataFinal)) {
  return res.status(400).json({
    error: 'Data inválida. Use o formato AAAA-MM-DD (ex: 2025-12-31).',
  });
}
```

**Solução:**
```javascript
// ✅ Validar formato E valores
const regexData = /^\d{4}-\d{2}-\d{2}$/;
if (!regexData.test(dataFinal)) {
  return res.status(400).json({
    error: 'Data inválida. Use o formato AAAA-MM-DD (ex: 2025-12-31).',
  });
}

// ✅ Validar que a data é válida
const date = new Date(dataFinal);
if (isNaN(date.getTime())) {
  return res.status(400).json({
    error: 'Data inválida. Verifique dia, mês e ano.',
  });
}

// ✅ Validar que não é data futura (opcional)
if (date > new Date()) {
  return res.status(400).json({
    error: 'Data não pode ser futura.',
  });
}
```

---

#### ⚠️ **Riscos Médios:**

### 5. Sequelize Instalado mas Não Usado

**Localização:** `package.json`

**Problema:**
- Dependência `sequelize` 6.35.0 instalada mas nunca utilizada
- Código usa `mysql2` com queries SQL diretas
- Confusão de código e vulnerabilidade potencial

**Impacto:**
- Bundle maior (Sequelize + suas dependências)
- Confusão para desenvolvedores
- Manutenção mais difícil

**Solução:**
```bash
npm uninstall sequelize
```

---

### 6. Conexão MySQL Única (Não Pool)

**Localização:** `src/config/db.js`

**Problema:**
- Usa `mysql.createConnection()` (conexão única)
- Não escala para múltiplos usuários simultâneos
- Bottleneck de performance

**Código Atual:**
```javascript
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});
```

**Solução:**
```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,        // ✅ Permite 10 conexões simultâneas
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// ✅ Usar async/await nos models
module.exports = pool;
```

**Migração necessária em todos os models:**
```javascript
// ANTES (callback)
db.query('SELECT * FROM users', (err, rows) => {
  if (err) return callback(err);
  return callback(null, rows);
});

// DEPOIS (async/await)
try {
  const [rows] = await pool.query('SELECT * FROM users');
  return rows;
} catch (err) {
  throw err;
}
```

---

### 7. CORS com Fallback Perigoso

**Localização:** `server.js` linha 79

**Problema:**
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  process.env.ALLOWED_ORIGINS || ''  // ❌ String vazia se não definido
].filter(Boolean);
```

Se `ALLOWED_ORIGINS` não estiver definido, array inclui string vazia, que pode bypassar CORS em certos navegadores.

**Solução:**
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

// ✅ Adicionar origens do ambiente apenas se definidas e validadas
if (process.env.ALLOWED_ORIGINS) {
  const envOrigins = process.env.ALLOWED_ORIGINS.split(',')
    .map(o => o.trim())
    .filter(o => o.startsWith('http://') || o.startsWith('https://'));
  
  allowedOrigins.push(...envOrigins);
}
```

---

### 8. Tailwind via CDN em Produção

**Localização:** `public/app.html` linha 8

**Problema:**
```html
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
```

**Riscos:**
- Supply chain attack (CDN comprometido)
- Performance (download de runtime)
- CSP permite `https://cdn.tailwindcss.com` (risco)

**Solução:**
```bash
# 1. Build estático do Tailwind
npm run build:css

# 2. Remover CDN do HTML
# 3. Importar CSS compilado
<link rel="stylesheet" href="/styles/output.css">

# 4. Remover CDN do CSP (server.js)
scriptSrc: ["'self'", "'unsafe-inline'"], // Remover cdn.tailwindcss.com
```

---

### 9. Logs em Produção

**Localização:** Múltiplos arquivos

**Problema:**
- `console.log()` em produção expõe estrutura interna
- Logs não são persistidos
- Difícil debugging em produção

**Solução:**
```bash
npm install winston
```

```javascript
// src/config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

---

### 🏗️ Organização & Clean Code

#### ✅ **Boas Práticas:**

1. **Arquitetura em camadas:**
   - Controller → Service → Model
   - Separação clara de responsabilidades

2. **Modularização por domínio:**
   - `Gap-Core` (autenticação, usuários)
   - `Gap-Finance` (financeiro)
   - Fácil adicionar novos módulos

3. **Validação centralizada:**
   - Middlewares de validação reutilizáveis
   - `validateUser()`, `validateSalario()`, etc.

4. **Tratamento de erros padronizado:**
   - `sendError()` centraliza lógica
   - Callbacks com `(err, result)` (padrão Node.js)

5. **Whitelist de campos:**
   - Previne mass assignment
   - `ALLOWED_CREATE_FIELDS`, `ALLOWED_UPDATE_FIELDS`

#### ⚠️ **Pontos de Melhoria:**

### 10. Callbacks (Callback Hell)

**Problema:**
- Todo código usa callbacks aninhados
- Dificulta leitura e manutenção
- Error handling complexo

**Exemplo Atual:**
```javascript
userService.login(email, senha, (err, result) => {
  if (err) return sendError(res, err);
  
  userModel.findById(result.id, (err2, user) => {
    if (err2) return sendError(res, err2);
    
    // ... mais aninhamento
  });
});
```

**Solução:**
```javascript
// 1. Migrar models para async/await
async login(req, res) {
  try {
    const result = await userService.login(email, senha);
    return res.json(result);
  } catch (err) {
    return sendError(res, err);
  }
}
```

---

### 11. Código Duplicado

**Problema:**
- `salarioController.js`, `fixoController.js`, `variaveisController.js` são quase idênticos
- Violação do princípio DRY (Don't Repeat Yourself)

**Solução:**
```javascript
// src/utils/genericController.js
class GenericController {
  constructor(service, resourceName) {
    this.service = service;
    this.resourceName = resourceName;
  }

  create(req, res) {
    const dados = { ...req.body, user_id: req.user.id };

    this.service.create(dados, (err, result) => {
      if (err) return sendError(res, err);
      return res.status(201).json({
        message: `${this.resourceName} criado com sucesso`,
        id: result.insertId
      });
    });
  }

  // ... outros métodos genéricos
}

// Em salarioController.js
const GenericController = require('../../../utils/genericController');
const salarioService = require('../services/salarioService');

const controller = new GenericController(salarioService, 'Salário');

module.exports = {
  create: controller.create.bind(controller),
  // ...
};
```

---

### 12. Falta de Testes

**Problema:**
- Nenhum arquivo de teste encontrado
- Impossível garantir que mudanças não quebram funcionalidade
- Difícil refatoração

**Solução:**
```bash
npm install --save-dev jest supertest
```

```javascript
// tests/user.test.js
const request = require('supertest');
const app = require('../server');

describe('User Authentication', () => {
  test('POST /api/v1/users/login - success', async () => {
    const res = await request(app)
      .post('/api/v1/users/login')
      .send({
        email: 'test@example.com',
        senha: 'ValidPass123!'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  test('POST /api/v1/users/login - invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/users/login')
      .send({
        email: 'test@example.com',
        senha: 'wrongpassword'
      });
    
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});
```

---

### 13. Falta de Validação de Schema

**Problema:**
- Validação manual com if/else
- Código repetitivo
- Difícil manutenção

**Solução:**
```bash
npm install joi
```

```javascript
// src/validators/userSchema.js
const Joi = require('joi');

const userSchema = Joi.object({
  nome: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().max(255).required(),
  senha: Joi.string()
    .min(8)
    .max(128)
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[a-z]/, 'lowercase')
    .pattern(/[0-9]/, 'number')
    .pattern(/[!@#$%^&*]/, 'special')
    .required()
    .messages({
      'string.pattern.name': 'Senha deve conter pelo menos um caractere {#name}'
    })
});

// Em userMiddleware.js
const { userSchema } = require('../../validators/userSchema');

validateUser: (req, res, next) => {
  const { error } = userSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({ 
      error: error.details[0].message 
    });
  }
  
  next();
}
```

---

### 14. Inconsistência de Nomenclatura

**Problema:**
- `{ error }` vs `{ erro }` (com/sem acento)
- `data_gasto` vs `dataGasto` (snake_case vs camelCase)
- Confusão de padrões

**Padronização Recomendada:**
```javascript
// ✅ Backend: snake_case para campos do banco
// ✅ Frontend: camelCase para JavaScript
// ✅ Respostas de erro: SEMPRE usar "error" (sem acento)

// Exemplo:
// Banco de dados: user_id, data_gasto, categoria_id
// JavaScript: userId, dataGasto, categoriaId
// Erros: { error: "mensagem" }
```

---

### 🎨 Frontend

#### ✅ **Pontos Fortes:**

1. **Vanilla JS (sem frameworks):**
   - Bundle pequeno
   - Performance excelente

2. **Separação de concerns:**
   - `api-service.js` gerencia API
   - `finance-dashboard.js` gerencia lógica de negócio
   - `script.js` gerencia autenticação

3. **Sanitização de entrada:**
   - Remove HTML tags
   - Previne XSS básico

4. **Gestão de tokens segura:**
   - `sessionStorage` (não `localStorage`)
   - Refresh automático

#### ⚠️ **Pontos de Melhoria:**

### 15. Código Duplicado no Frontend

**Problema:**
- `updateUserName()` repetido em múltiplos arquivos
- Lógica de autenticação duplicada

**Solução:**
```javascript
// public/scripts/shared/auth.js
export function checkAuthentication() {
  const token = sessionStorage.getItem('accessToken');
  const user = sessionStorage.getItem('user');
  
  if (!token || !user) {
    redirectToLogin();
    return false;
  }
  
  try {
    JSON.parse(user);
    return true;
  } catch (e) {
    redirectToLogin();
    return false;
  }
}

export function redirectToLogin() {
  sessionStorage.clear();
  localStorage.clear();
  window.location.replace('/');
}

// Usar em outros arquivos
import { checkAuthentication } from './shared/auth.js';
```

---

### 16. Falta de Paginação

**Problema:**
- `findAll()` retorna TODOS os registros
- Problema de performance com muitos dados
- Experiência ruim do usuário

**Solução:**
```javascript
// Backend: salarioModel.js
findByUserId(userId, options = {}, callback) {
  const limit = options.limit || 10;
  const offset = options.offset || 0;
  
  db.query(
    'SELECT * FROM salarios WHERE user_id = ? LIMIT ? OFFSET ?',
    [userId, limit, offset],
    callback
  );
}

// Frontend: api-service.js
async getSalarios(page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  return await this.request(`/salarios?limit=${limit}&offset=${offset}`);
}
```

---

### 17. Falta de Acessibilidade

**Problema:**
- Sem `aria-labels`
- Sem tratamento de navegação por teclado
- Sem suporte a leitores de tela

**Solução:**
```html
<!-- Exemplo: login.html -->
<button 
  type="button" 
  class="toggle-password"
  data-target="login-senha"
  aria-label="Mostrar/ocultar senha"
  aria-pressed="false"
>
  <svg viewBox="0 0 24 24" class="eye-icon" aria-hidden="true">
    <!-- ... -->
  </svg>
</button>

<!-- Adicionar foco visível -->
<style>
  button:focus-visible,
  input:focus-visible {
    outline: 2px solid #A0430A;
    outline-offset: 2px;
  }
</style>
```

---

## 4. 🚀 Conclusão e Recomendações

### 🌟 **Pontos Fortes do Projeto:**

1. ✅ **Arquitetura sólida e escalável:** Modularização por domínio facilita manutenção
2. ✅ **Segurança bem implementada (parcialmente):** JWT, bcrypt, rate limiting, CORS, Helmet
3. ✅ **Prevenção de IDOR no módulo financeiro:** Validação rigorosa de `user_id`
4. ✅ **Prepared statements:** SQL Injection prevenido nos models
5. ✅ **Separação de responsabilidades:** Controller → Service → Model
6. ✅ **Frontend leve e performático:** Vanilla JS sem frameworks pesados
7. ✅ **Documentação clara:** README.md bem estruturado

---

### 🔴 **Melhorias Imediatas Necessárias (Críticas):**

#### Prioridade 1: Corrigir IDOR no módulo Gap-Core
- **Tempo estimado:** 2-4 horas
- **Arquivos afetados:** `userController.js`
- **Risco se não corrigido:** Vazamento de dados, modificação/exclusão de contas

#### Prioridade 2: Não expor token de recuperação
- **Tempo estimado:** 4-8 horas (incluindo setup de email)
- **Arquivos afetados:** `userController.js`, `.env`
- **Risco se não corrigido:** Comprometimento de contas

#### Prioridade 3: Melhorar política de senha
- **Tempo estimado:** 1 hora
- **Arquivos afetados:** `userMiddleware.js`
- **Risco se não corrigido:** Contas com senhas fracas

#### Prioridade 4: Migrar para MySQL Pool
- **Tempo estimado:** 8-16 horas (incluindo refatoração de models)
- **Arquivos afetados:** `db.js`, todos os models
- **Risco se não corrigido:** Bottleneck de performance

---

### 🟡 **Melhorias Recomendadas (Médio Prazo):**

1. **Migrar de Callbacks para Async/Await** (1-2 semanas)
2. **Adicionar testes (Jest + Supertest)** (1-2 semanas)
3. **Usar biblioteca de validação (Joi)** (3-5 dias)
4. **Implementar paginação** (2-3 dias)
5. **Adicionar logging profissional (Winston)** (1-2 dias)
6. **Build estático do Tailwind** (1 dia)
7. **Implementar envio de email (Nodemailer)** (2-3 dias)
8. **Adicionar rate limiting por usuário** (1-2 dias)
9. **Implementar auditoria de ações** (3-5 dias)
10. **Adicionar healthcheck endpoint** (1 dia)

---

### 🟢 **Melhorias Futuras (Boas Práticas):**

1. Implementar RBAC (Role-Based Access Control)
2. Adicionar webhooks para notificações
3. Implementar GraphQL como alternativa ao REST
4. Adicionar documentação Swagger/OpenAPI
5. Implementar CI/CD (GitHub Actions)
6. Adicionar métricas e monitoring (Prometheus/Grafana)
7. Implementar cache (Redis)
8. Adicionar feature flags (LaunchDarkly)
9. Implementar backup automático do banco
10. Adicionar suporte a multi-tenancy

---

## 📊 Resumo Executivo

### Classificação Geral: **B+ (Bom, com ressalvas críticas)**

**Segurança:** 6/10 (vulnerabilidades críticas no módulo de usuários)  
**Qualidade de Código:** 7/10 (boa arquitetura, mas precisa refatoração)  
**Performance:** 6/10 (conexão única MySQL é limitante)  
**Manutenibilidade:** 7/10 (bem organizado, mas callbacks dificultam)  
**Escalabilidade:** 6/10 (arquitetura modular boa, mas infra limitada)

### Recomendação Final

**Este projeto demonstra uma base sólida com boas práticas de segurança e arquitetura, mas requer correções críticas no módulo de usuários antes de ir para produção.**

A estrutura modular permite evolução gradual e adição de novos módulos conforme planejado. Com as correções de segurança implementadas e as melhorias de performance aplicadas, o projeto estará pronto para produção.

---

**Próximos Passos Sugeridos:**

1. ✅ Corrigir IDOR em userController (URGENTE)
2. ✅ Implementar envio de email para reset de senha
3. ✅ Melhorar política de senhas
4. ✅ Migrar para MySQL Pool
5. ✅ Adicionar testes unitários e de integração
6. ✅ Migrar para async/await
7. ✅ Implementar logging profissional
8. ✅ Build estático do Tailwind CSS

---

**Auditor:** Arquiteto de Software Sênior  
**Data:** 14 de Dezembro de 2025  
**Versão do Review:** 1.0
