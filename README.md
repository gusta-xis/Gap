# 📱 GAP — Sistema de Gestão e Administração Pessoal

**Organize, acompanhe e gerencie todos os aspectos da sua vida pessoal em um único lugar.**

![Status](https://img.shields.io/badge/STATUS-EM_DESENVOLVIMENTO-orange?style=for-the-badge)
![Node.js](https://img.shields.io/badge/NODE.JS-v22-green?style=for-the-badge)
![Express](https://img.shields.io/badge/EXPRESS-4.18-90c53f?style=for-the-badge)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?style=for-the-badge)
![Segurança](https://img.shields.io/badge/SEGURANÇA-Helmet%2BJWT-red?style=for-the-badge)
![Licença](https://img.shields.io/badge/LICENSE-MIT-blue?style=for-the-badge)

---

## 📌 Sobre o Projeto

O **GAP** (Gestão e Administração Pessoal) é uma **plataforma web modular** para gerenciar diferentes aspectos da vida pessoal. Cada aspecto é um **módulo independente** que pode ser acessado via um sistema centralizado de autenticação.

### Arquitetura Modular:

```
🏠 GAP (Sistema Central)
 ├── 💰 Módulo Financeiro (v1.0.0)
 │    ├── Despesas Variáveis
 │    ├── Despesas Fixas
 │    ├── Salários/Receitas
 │    └── Dashboard de Gastos
 │
 ├── 📅 Módulo Agenda (Futuro)
 ├── 🏠 Módulo Lar (Futuro)
 ├── 📚 Módulo Estudos (Futuro)
 └── 💪 Módulo Saúde (Futuro)
```

### Destaques:

✔ **Arquitetura Modular Escalável** - Fácil adicionar novos módulos  
✔ **Segurança de Nível Empresarial** - Helmet, CSP, Rate Limiting, JWT  
✔ **Autenticação Robusta** - Login com 2 tokens (Access 15min + Refresh 7 dias)  
✔ **Recuperação de Senha Segura** - Sistema de reset com token  
✔ **Prevenção de IDOR** - Validação de autorização em todos os endpoints  
✔ **Dashboards Interativos** - Visualização em tempo real de dados  
✔ **Interface Responsiva** - Design moderno com Tailwind CSS  
✔ **API RESTful Versionada** - /api/v1 pronto para múltiplas versões

---

## 🎯 Objetivo Geral

Construir uma plataforma integrada e segura para **gestão pessoal completa** com:

**Núcleo (Sempre Necessário):**
- ✅ Autenticação segura com JWT + Refresh tokens
- ✅ Recuperação de senha com validação rigorosa
- ✅ Proteção contra vulnerabilidades comuns (OWASP Top 10)
- ✅ Interface web moderna e intuitiva
- ✅ API RESTful documentada e versionada

**Módulos (Plugáveis):**
- ✅ **Financeiro** (v1.0.0) - Controle de despesas e receitas
- 🚀 **Agenda** (Planejado) - Gestão de compromissos
- 🚀 **Lar** (Planejado) - Gestão de casa e manutenção
- 🚀 **Estudos** (Planejado) - Acompanhamento acadêmico
- 🚀 **Saúde** (Planejado) - Rastreamento de saúde e atividades

---

## 🌐 Público-Alvo

Este projeto foi pensado para:

- 👥 Usuários que desejam gerenciar sua vida pessoal de forma centralizada e segura
- 💼 Pequenos empreendedores e freelancers que precisam controlar suas finanças
- 🎓 Desenvolvedores aprendendo Node.js, arquitetura modular e boas práticas de segurança
- 📈 Pessoas buscando uma solução completa de organização pessoal

---

## 🛠 Tecnologias Utilizadas

### **Frontend**

- HTML5 semântico
- CSS3 + Tailwind CSS
- JavaScript vanilla (sem frameworks)
- Fetch API com interceptores de token

### **Backend**

- **Node.js** v22
- **Express.js** 4.18
- **MySQL2** 3.6 (com prepared statements)
- **JWT** (jsonwebtoken) - Access + Refresh tokens
- **Bcrypt** - Hash seguro de senhas
- **Helmet** - Headers de segurança
- **Express Rate Limit** - Proteção contra brute force
- **Dotenv** - Variáveis de ambiente
- **Nodemon** - Dev reloading

### **Segurança**

- 🔒 Helmet com CSP customizado
- 🛡️ Rate limiting (5/15min login, 100/15min API)
- 🔐 JWT com tokens curtos (15min access, 7 dias refresh)
- ✓ OWASP Top 10 protegido
- 📝 Logs com mascaramento de dados sensíveis
- 🚫 SQL Injection prevention (whitelist)
- 🎯 IDOR prevention (filtro por user_id)

### **Padrão de Arquitetura**

- 📦 **Modular:** Cada funcionalidade em seu próprio módulo
- 🏗️ **MVC:** Controllers → Services → Models
- 🔄 **Middleware:** Autenticação, validação e error handling
- 🛣️ **Rotas Versionadas:** `/api/v1` pronto para múltiplas versões

### **Ferramentas**

- Visual Studio Code
- Git & GitHub (branch Dev)
- Postman/Insomnia (testes de API)
- MySQL Workbench

---

## 🏗️ Visão Modular da Plataforma

O GAP é estruturado em **duas camadas principais:**

### **Camada 1: Núcleo (Gap-Core)** — Obrigatório
```
┌─────────────────────────────────┐
│     🔑 AUTENTICAÇÃO & USUÁRIOS   │
├─────────────────────────────────┤
│ • Login / Signup                │
│ • Recuperação de Senha          │
│ • Gerenciamento de Token        │
│ • Perfil do Usuário             │
│ • Seletor de Módulos            │
└─────────────────────────────────┘
```
- **Arquivo principal:** `src/Modules/Gap-Core/`
- **Responsabilidade:** Autentica usuários e gerencia sessões
- **APIs:** `/api/v1/users/*`
- **Sempre presente** em todas as instâncias do GAP

### **Camada 2: Módulos (Gap-Finance, Gap-Agenda, etc.)** — Opcionais/Plugáveis
```
┌──────────────────────────────────────────────────────────┐
│  💰 MÓDULO FINANCEIRO (v1.0.0)   [ATIVO]                │
├──────────────────────────────────────────────────────────┤
│ • Despesas Variáveis                                    │
│ • Despesas Fixas                                        │
│ • Salários/Receitas                                     │
│ • Dashboard de Gastos                                   │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  📅 MÓDULO AGENDA (Futuro)       [INATIVO]              │
│  🏠 MÓDULO LAR (Futuro)          [INATIVO]              │
│  📚 MÓDULO ESTUDOS (Futuro)      [INATIVO]              │
│  💪 MÓDULO SAÚDE (Futuro)        [INATIVO]              │
└──────────────────────────────────────────────────────────┘
```
- **Arquivo principal:** `src/Modules/Gap-{NomeModulo}/`
- **Responsabilidade:** Gerenciar funcionalidades específicas
- **APIs:** `/api/v1/{recurso}/*`
- **Pode ser:** Habilitado, desabilitado ou expandido

### **Por que Modular?**

| Benefício | Descrição |
|-----------|-----------|
| 📈 **Escalabilidade** | Adicionar novos módulos sem quebrar existentes |
| 🔒 **Segurança** | Cada módulo tem suas próprias regras de permissão |
| 🧪 **Testabilidade** | Módulos podem ser testados independentemente |
| 👥 **Colaboração** | Equipes diferentes podem desenvolver módulos separados |
| 🚀 **Deployment** | Módulos podem ser ativados/desativados por usuário |
| 📦 **Manutenção** | Código organizado e reutilizável |

---

## 📁 Estrutura do Projeto

```bash
/Gap
 ├── 📂 public/                       # Frontend (HTML, CSS, JS)
 │    ├── 📂 styles/
 │    │    ├── style.css              # Estilos gerais (Login, Navbar)
 │    │    ├── dashboard.css          # Estilos Dashboard
 │    │    ├── finance.css            # Estilos Módulo Financeiro
 │    │    ├── tailwind.css           # Configuração Tailwind
 │    │    └── subtemas.css           # Estilos Seletor de Módulos
 │    │
 │    ├── 📂 scripts/
 │    │    ├── script.js              # Autenticação (Login/Signup/Recovery)
 │    │    ├── api-service.js         # Cliente HTTP + Token Refresh automático
 │    │    ├── finance.js             # Intro wizard do módulo Financeiro
 │    │    ├── finance-dashboard.js   # Dashboard do módulo Financeiro
 │    │    ├── expense-modal.js       # CRUD de despesas (Modal)
 │    │    └── subtemas.js            # Navegação entre módulos
 │    │
 │    ├── 📂 img/                     # SVGs e imagens do sistema
 │    ├── login.html                  # Tela de Autenticação
 │    ├── subtemas.html               # Seletor de módulos disponíveis
 │    ├── finance.html                # Página módulo Financeiro
 │    ├── finance-dashboard.html      # Dashboard Financeiro
 │    └── reset-password.html         # Redefinição de senha
 │
 ├── 📂 src/                          # Backend (Node.js + Express)
 │    ├── api.js                      # Orquestração de todas as rotas
 │    │
 │    ├── 📂 config/
 │    │    └── db.js                  # Conexão MySQL com retry automático
 │    │
 │    ├── 📂 middlewares/             # Middlewares globais
 │    │    ├── authMiddleware.js      # Validação de JWT
 │    │    ├── errorMiddleware.js     # Tratamento de erros global
 │    │    └── logger.js              # Logging estruturado + mascaramento
 │    │
 │    └── 📂 Modules/                 # Módulos da plataforma
 │         │
 │         ├── 📂 Gap-Core/           # 🔑 NÚCLEO - Autenticação e Usuários
 │         │    ├── 📂 controllers/
 │         │    │    └── userController.js
 │         │    ├── 📂 models/
 │         │    │    └── userModel.js (com updatePassword)
 │         │    ├── 📂 services/
 │         │    │    └── userService.js (com forgot/reset)
 │         │    ├── 📂 routes/
 │         │    │    └── userRoutes.js
 │         │    └── 📂 middlewares/
 │         │         └── userMiddleware.js (validação força senha)
 │         │
 │         ├── 📂 Gap-Finance/        # 💰 MÓDULO FINANCEIRO (v1.0.0)
 │         │    ├── 📂 controllers/
 │         │    │    ├── fixoController.js
 │         │    │    ├── variaveisController.js
 │         │    │    └── salarioController.js
 │         │    ├── 📂 models/
 │         │    │    ├── fixoModel.js (com findByIdAndUser)
 │         │    │    ├── variaveisModel.js (com findByIdAndUser)
 │         │    │    └── salarioModel.js (com findByIdAndUser)
 │         │    ├── 📂 services/
 │         │    │    ├── fixoService.js
 │         │    │    ├── variaveisService.js
 │         │    │    └── salarioService.js
 │         │    ├── 📂 routes/
 │         │    │    ├── fixoRoutes.js
 │         │    │    ├── variaveisRoutes.js
 │         │    │    └── salarioRoutes.js
 │         │    └── 📂 middlewares/
 │         │         └── validatorsMiddleware.js
 │         │
 │         ├── 📂 Gap-Agenda/         # 📅 MÓDULO AGENDA (Futuro - v2.0.0)
 │         ├── 📂 Gap-Lar/            # 🏠 MÓDULO LAR (Futuro - v2.1.0)
 │         ├── 📂 Gap-Estudos/        # 📚 MÓDULO ESTUDOS (Futuro - v2.2.0)
 │         └── 📂 Gap-Saude/          # 💪 MÓDULO SAÚDE (Futuro - v2.3.0)
 │
 ├── 📂 docs/                         # Documentação
 │    ├── script.sql                  # Schema do banco (criação de tabelas)
 │    ├── SECURITY_AUDIT_REPORT.md    # Auditoria de segurança inicial
 │    ├── SECURITY_AUDIT_VERIFICATION.md # Verificação de correções
 │    ├── code-review-report.md       # Análise de código (v1.0.0)
 │    └── dashboard-api-integration.md # Documentação de endpoints API
 │
 ├── server.js                        # Express app + Configuração de segurança
 ├── .env                             # Variáveis de ambiente
 ├── .env.example                     # Template de variáveis
 ├── package.json                     # Dependências (v1.0.0)
 ├── package-lock.json                # Lock de versões
 ├── tailwind.config.js               # Configuração Tailwind CSS
 ├── postcss.config.js                # Configuração PostCSS
 └── README.md                        # Este arquivo
```
 │              │    ├── fixoController.js
 │              │    ├── variaveisController.js
 │              │    └── salarioController.js
 │              ├── models/
 │              │    ├── fixoModel.js (com findByIdAndUser)
 │              │    ├── variaveisModel.js
 │              │    └── salarioModel.js
 │              ├── services/
 │              │    ├── fixoService.js
 │              │    ├── variaveisService.js
 │              │    └── salarioService.js
 │              ├── routes/
 │              │    ├── fixoRoutes.js
 │              │    ├── variaveisRoutes.js
 │              │    └── salarioRoutes.js
 │              └── middlewares/
 │                   └── validatorsMiddleware.js
 │
 ├── docs/
 │    ├── script.sql                  # Schema do banco
 │    ├── SECURITY_AUDIT_REPORT.md    # Auditoria inicial
 │    └── SECURITY_AUDIT_VERIFICATION.md # Verificação de fixes
 │
 ├── server.js                        # Express + Segurança
 ├── .env                             # Variáveis ambiente
 ├── package.json                     # Dependências (v1.0.0)
 ├── tailwind.config.js               # Tailwind setup
 ├── postcss.config.js                # PostCSS
 └── README.md
```

---

## 🔌 Rotas da API (Endpoints)

### **Núcleo GAP — Autenticação (Públicas)**

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| POST | `/api/v1/users/login` | Login com email/senha | ❌ Não |
| POST | `/api/v1/users` | Cadastro novo usuário | ❌ Não |
| POST | `/api/v1/users/refresh` | Renovar access token | ❌ Não (usa refresh token) |
| POST | `/api/v1/users/forgot-password` | Solicitar reset de senha | ❌ Não |
| POST | `/api/v1/users/reset-password` | Redefinir senha com token | ❌ Não |

### **Núcleo GAP — Usuários (Protegidas)**

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/api/v1/users` | Lista todos usuários | ✅ JWT |
| GET | `/api/v1/users/:id` | Busca usuário por ID | ✅ JWT |
| PUT | `/api/v1/users/:id` | Atualiza usuário | ✅ JWT |
| DELETE | `/api/v1/users/:id` | Remove usuário | ✅ JWT |

### **Módulo Financeiro — Gastos Variáveis (Protegidas)**

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/api/v1/gastos-variaveis` | Lista despesas do usuário | ✅ JWT |
| GET | `/api/v1/gastos-variaveis/:id` | Busca despesa específica | ✅ JWT |
| POST | `/api/v1/gastos-variaveis` | Cria nova despesa | ✅ JWT |
| PUT | `/api/v1/gastos-variaveis/:id` | Atualiza despesa | ✅ JWT |
| DELETE | `/api/v1/gastos-variaveis/:id` | Remove despesa | ✅ JWT |

### **Módulo Financeiro — Gastos Fixos (Protegidas)**

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/api/v1/gastos-fixos` | Lista despesas fixas | ✅ JWT |
| POST | `/api/v1/gastos-fixos` | Cria despesa fixa | ✅ JWT |
| PUT | `/api/v1/gastos-fixos/:id` | Atualiza despesa fixa | ✅ JWT |
| DELETE | `/api/v1/gastos-fixos/:id` | Remove despesa fixa | ✅ JWT |

### **Módulo Financeiro — Salários/Receitas (Protegidas)**

| Método | Rota | Descrição | Autenticação |
|--------|------|-----------|--------------|
| GET | `/api/v1/salarios` | Lista salários | ✅ JWT |
| POST | `/api/v1/salarios` | Cadastra salário | ✅ JWT |
| PUT | `/api/v1/salarios/:id` | Atualiza salário | ✅ JWT |
| DELETE | `/api/v1/salarios/:id` | Remove salário | ✅ JWT |

---

## 📊 Funcionalidades do Sistema

### ✅ Núcleo GAP (Sempre Disponível)

**Segurança:**
- ✅ Autenticação JWT (access + refresh tokens)
- ✅ Validação de força de senha (8+ chars, maiúscula, caractere especial)
- ✅ Recuperação de senha com token por email
- ✅ Rate limiting (5 login/15min, 100 API/15min)
- ✅ Helmet + CSP customizado
- ✅ IDOR prevention (filtro user_id)
- ✅ SQL Injection prevention (whitelist)
- ✅ XSS protection (sanitização)
- ✅ CORS restritivo
- ✅ Logs com mascaramento de senhas

**Autenticação & Usuários:**
- ✅ Login com email e senha
- ✅ Cadastro com validação rigorosa
- ✅ Auto-refresh de token em 401
- ✅ Reset de senha seguro
- ✅ Logout que limpa todas as sessões
- ✅ Selector de módulos disponíveis

### ✅ Módulo Financeiro (v1.0.0)

**Funcionalidades:**
- ✅ Dashboard com visualização de despesas por categoria
- ✅ Cadastro de despesas variáveis (alimentação, transporte, etc)
- ✅ Cadastro de despesas fixas (aluguel, internet, etc)
- ✅ Cadastro de salários e receitas
- ✅ Intro wizard (aparece apenas 1x por usuário)
- ✅ Modal de adição/edição/exclusão de despesas
- ✅ Listagem de transações com filtros
- ✅ Resumo visual com gráficos (em desenvolvimento)

**Frontend:**
- ✅ Interface responsiva (mobile/tablet/desktop)
- ✅ Animações de transição entre views
- ✅ Toggle de visibilidade de senha
- ✅ Feedback visual (loading, erros, sucessos)
- ✅ Persistência de sessão (sessionStorage)

### 🚀 Roadmap — Próximas Versões

**Módulo Financeiro v1.1.0:**
- 📊 Relatórios avançados com gráficos
- 📈 Análise de tendências financeiras
- 🔔 Notificações de gastos altos
- 💳 Integração com bancos reais
- 📧 Exportação de relatórios por email

**Módulo Agenda (v2.0.0):**
- 📅 Calendário integrado
- ⏰ Lembretes e notificações
- 📍 Geolocalização de eventos
- 👥 Compartilhamento de calendário

**Módulo Lar (v2.1.0):**
- 🏠 Gestão de manutenção da casa
- 📋 Lista de tarefas por cômodo
- 💰 Orçamento de reparos
- 📸 Galeria de projetos realizados

**Módulo Estudos (v2.2.0):**
- 📚 Acompanhamento acadêmico
- 📝 Gerenciador de notas e resumos
- 🎯 Metas de estudo
- 📊 Análise de desempenho

**Módulo Saúde (v2.3.0):**
- 💪 Rastreamento de atividades físicas
- 📏 Controle de peso e métricas
- 🥗 Registro de nutrição
- 💊 Lembretes de medicações

**Melhorias Gerais:**
- 📱 App mobile (React Native ou Flutter)
- 2️⃣ Two-Factor Authentication (2FA)
- 🗂️ Backup automático em nuvem
- 🔄 Sincronização multi-dispositivo
- 🌐 Suporte a múltiplos idiomas

---

## 🔐 Recursos de Segurança

### Implementados:

```
🔒 Helmet + CSP Customizado
   - Content-Security-Policy
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block

🛡️ Rate Limiting
   - Login: 5 tentativas / 15 minutos
   - API: 100 requisições / 15 minutos

🔐 JWT + Refresh Tokens
   - Access Token: 15 minutos (curta duração)
   - Refresh Token: 7 dias (renovação automática)
   - Auto-refresh em 401 (transparente ao usuário)

✅ Validação Rigorosa
   - Email: Regex validation
   - Senha: 8+ chars, maiúscula, caractere especial
   - IDs: Integer validation
   - Campos: Whitelist (SQL injection prevention)

🔑 IDOR Prevention
   - Todos os queries filtram por user_id
   - 403 Forbidden em acesso não autorizado

📝 Logging Seguro
   - Mascaramento de senhas
   - Mascaramento de dados sensíveis
   - Sem exposição de detalhes do banco

🚫 XSS Protection
   - Sanitização de inputs
   - textContent em vez de innerHTML
   - CSP bloqueando inline scripts perigosos
```

---

## 🚀 Como Rodar o Projeto

### 1️⃣ Pré-requisitos

- Node.js v18+ (testado com v22)
- MySQL 8.0+
- Git

### 2️⃣ Clonar o repositório

```bash
git clone https://github.com/gusta-xis/gap.git
cd gap
git checkout Dev
```

### 3️⃣ Instalar dependências

```bash
npm install
```

As seguintes dependências serão instaladas:
- express (servidor web)
- mysql2 (banco de dados)
- jsonwebtoken (autenticação)
- bcryptjs (hash de senhas)
- helmet (headers de segurança)
- express-rate-limit (proteção contra brute force)
- cors (controle de origem)
- dotenv (variáveis de ambiente)
- nodemon (dev reloading)

### 4️⃣ Criar arquivo `.env`

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_NAME=gap_db
DB_PORT=3306

# JWT
JWT_SECRET=sua_chave_super_secreta_aqui
JWT_REFRESH_SECRET=sua_chave_refresh_super_secreta_aqui
```

### 5️⃣ Configurar banco de dados

```bash
# Acesse MySQL
mysql -u root -p

# Execute o script
mysql> source docs/script.sql;
```

Ou crie manualmente executando `docs/script.sql` no MySQL Workbench.

### 6️⃣ Iniciar o servidor

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm start
```

Servidor rodará em `http://localhost:3000`

---

## 🧪 Como Testar

### 1️⃣ Teste do Núcleo (Autenticação)

**Signup - Criar Conta:**
```
1. Acesse http://localhost:3000
2. Clique em "Crie uma conta"
3. Preencha:
   - Nome: Seu Nome
   - Email: seu@email.com
   - Senha: SenhaForte@123 (8+ chars, 1 maiúscula, 1 caractere especial)
4. Clique "Começar Agora"
```

**Login - Entrar:**
```
1. Digite suas credenciais
2. Recebe accessToken (15min) e refreshToken (7 dias)
3. Tokens são armazenados em sessionStorage
```

**Recuperação de Senha:**
```
1. Clique "Esqueceu sua senha?"
2. Digite o email cadastrado
3. Link é copiado automaticamente
4. Cole na barra (Ctrl+V + Enter)
5. Defina nova senha forte
6. Faça login com nova senha
```

### 2️⃣ Teste do Módulo Financeiro

**Acessar o Módulo:**
```
1. Após login, acesse /subsistemas
2. Clique no módulo "Financeiro"
3. (Primeira vez) Veja o wizard introdutório
4. Clique "Começar" ou "Pular"
```

**Dashboard Financeiro:**
```
1. Visualize resumo de gastos por categoria
2. Veja últimas transações
3. Clique "+" para adicionar nova despesa
4. Preencha modal:
   - Tipo: Variável/Fixa/Salário
   - Categoria: Alimentação, Transporte, etc
   - Valor: Digite o valor
   - Data: Selecione a data
   - Descrição: Detalhe (opcional)
5. Clique Salvar
6. Visualize no dashboard em tempo real
```

**Operações de Despesa:**
```
- Adicionar: Clique botão + ou no modal
- Editar: Clique no ícone de edição na linha
- Deletar: Clique no ícone de lixeira na linha
- Filtrar: Use filtros por categoria/período
```

### 3️⃣ Teste da API com Postman/Insomnia

**Autenticação - Login (obter tokens):**
```bash
POST http://localhost:3000/api/v1/users/login
Content-Type: application/json

{
  "email": "seu@email.com",
  "senha": "SenhaForte@123"
}

Resposta esperada:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": { "id": 1, "nome": "Seu Nome", "email": "seu@email.com" }
}
```

**Usar token em requisição protegida:**
```bash
GET http://localhost:3000/api/v1/users
Authorization: Bearer eyJhbGc...

Resposta: Lista de todos os usuários
```

**Refresh token expirado:**
```bash
POST http://localhost:3000/api/v1/users/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

Resposta: Novo accessToken
```

**Módulo Financeiro - Adicionar Despesa:**
```bash
POST http://localhost:3000/api/v1/gastos-variaveis
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "descricao": "Almoço",
  "valor": 35.50,
  "data": "2025-12-11",
  "categoria_id": 1
}
```

**Listar Despesas do Usuário:**
```bash
GET http://localhost:3000/api/v1/gastos-variaveis
Authorization: Bearer eyJhbGc...

Resposta: Array de despesas variáveis
```

### 4️⃣ Teste de Validação de Força de Senha

**Senhas Inválidas (não aceitadas):**
```
❌ "abc" - Menos de 8 caracteres
❌ "abcdefgh" - Sem maiúscula
❌ "Abcdefgh" - Sem caractere especial
❌ "Abcd1234" - Sem caractere especial
```

**Senhas Válidas (aceitas):**
```
✅ SenhaForte@123
✅ MyPass#2025
✅ Secure!Password9
✅ Welcome@Gap2025
```

### 5️⃣ Teste de Auto-Refresh de Token

```
1. Aguarde 15 minutos (ou edite expiração em .env)
2. Faça uma requisição para a API
3. api-service.js detecta 401
4. Envia refresh request automaticamente
5. Usa novo accessToken
6. Retenta requisição original
```

### 6️⃣ Checklist de Testes Completo

**Autenticação:**
- [ ] Signup com dados válidos
- [ ] Signup com email duplicado (erro)
- [ ] Signup com senha fraca (erro)
- [ ] Login com credenciais corretas
- [ ] Login com senha incorreta (erro)
- [ ] Forgot password com email válido
- [ ] Reset password com token válido
- [ ] Logout limpa tokens

**Dashboard Financeiro:**
- [ ] Acesso sem autenticação (401)
- [ ] Visualizar despesas do usuário
- [ ] Adicionar despesa variável
- [ ] Adicionar despesa fixa
- [ ] Adicionar salário
- [ ] Editar despesa existente
- [ ] Deletar despesa
- [ ] Ver resumo por categoria
- [ ] Filtrar por período

**Segurança:**
- [ ] SQL Injection na descrição (não funciona)
- [ ] XSS na descrição (não renderiza script)
- [ ] IDOR ao acessar despesa de outro usuário (403)
- [ ] Rate limit login (após 5 tentativas em 15min)
- [ ] Rate limit API (após 100 requisições em 15min)

---

## 📈 Fluxo de Uso do Sistema

```
┌──────────────────────────────────────────────────────────┐
│              🔑 TELA LOGIN (Gap-Core)                     │
│  - Cadastro com validação rigorosa de senha              │
│  - Login com email + senha                               │
│  - Recuperação de senha com token                         │
│  - Auto-refresh de token em background                    │
└────────────────┬─────────────────────────────────────────┘
                 │ ✅ JWT Token obtido
                 ▼
┌──────────────────────────────────────────────────────────┐
│         📋 TELA MÓDULOS (Seletor de Módulos)             │
│  - Exibe módulos disponíveis do usuário                   │
│  - Módulos habilitados/desabilitados por permissão        │
│  - Perfil do usuário e informações                        │
│  - Botão de Logout                                        │
└────────────────┬─────────────────────────────────────────┘
                 │ Clica em um módulo
                 ▼
┌──────────────────────────────────────────────────────────┐
│        💰 MÓDULO FINANCEIRO (Gap-Finance)                │
│                                                           │
│  1. Primeira vez: Intro/Wizard (aparece 1x apenas)       │
│     - Explicação das funcionalidades                      │
│     - Opção de "Começar" ou "Pular"                      │
│                                                           │
│  2. Dashboard:                                            │
│     ┌────────────────────────────────────────────────┐   │
│     │  Resumo de Gastos (últimos 30 dias)            │   │
│     │  - Total de gastos por categoria               │   │
│     │  - Comparativo com período anterior            │   │
│     │  - Gráfico visual de distribuição              │   │
│     ├────────────────────────────────────────────────┤   │
│     │  Últimas Transações                            │   │
│     │  - Listagem com filtros                        │   │
│     │  - Botão + para adicionar nova despesa         │   │
│     │  - Botões de editar/deletar por linha          │   │
│     ├────────────────────────────────────────────────┤   │
│     │  Modal de Despesa (CRUD)                       │   │
│     │  - Tipo: Variável, Fixa, Salário              │   │
│     │  - Categoria (Alimentação, Transporte, etc)   │   │
│     │  - Valor, Data, Descrição                      │   │
│     │  - Validação em tempo real                     │   │
│     ├────────────────────────────────────────────────┤   │
│     │  Botão "Voltar" → Retorna a Seletor de Módulos│   │
│     └────────────────────────────────────────────────┘   │
│                                                           │
└────────────────┬─────────────────────────────────────────┘
                 │ Ações disponíveis:
                 │ - Adicionar/Editar/Deletar Despesas
                 │ - Visualizar Resumos
                 │ - Voltar para Seletor de Módulos
```

### Fluxo Detalhado de Autenticação:

1. **Login** → Recebe `accessToken` (15min) + `refreshToken` (7 dias)
2. **Requisição com token expirado** → `api-service.js` detecta 401
3. **Auto-refresh** → Chama `/api/v1/users/refresh` automaticamente
4. **Nova tentativa** → Requisição original é retentada
5. **Logout** → Tokens são limpos de `sessionStorage`



---

## 🗄 Banco de Dados — Estrutura Modular

### Tabelas do Núcleo (Gap-Core):

```sql
users
├─ id (PK)
├─ nome
├─ email (UNIQUE)
├─ senha (hash bcrypt)
├─ password_reset_token
├─ password_reset_expires
├─ created_at
└─ updated_at
```

### Tabelas do Módulo Financeiro (Gap-Finance):

```sql
categorias
├─ id (PK)
├─ nome
└─ descricao

gastos_variaveis
├─ id (PK)
├─ user_id (FK → users)
├─ categoria_id (FK → categorias)
├─ descricao
├─ valor
├─ data
├─ created_at
└─ updated_at

gastos_fixos
├─ id (PK)
├─ user_id (FK → users)
├─ categoria_id (FK → categorias)
├─ descricao
├─ valor
├─ data_vencimento
├─ created_at
└─ updated_at

salarios
├─ id (PK)
├─ user_id (FK → users)
├─ valor
├─ data_recebimento
├─ created_at
└─ updated_at
```

### Diagrama de Relações:

```
users (1) ───────────── (N) gastos_variaveis
   ↓                            ↓
   │                       categorias
   ├─────────────────────────────↑
   │                            (1)
   ├────────────────── (N) gastos_fixos
   │
   └────────────────── (N) salarios
```

**Dados Pré-Cadastrados:**
- 8 categorias para o módulo Financeiro:
  - Alimentação
  - Transporte
  - Moradia
  - Saúde
  - Lazer
  - Educação
  - Cartão de Crédito
  - Outros

### Estrutura de Segurança:

- ✅ **IDOR Prevention:** Todas as queries filtram por `user_id`
- ✅ **Prepared Statements:** Prevenção de SQL Injection
- ✅ **Password Hashing:** Bcryptjs com salt rounds
- ✅ **Índices:** Otimização para queries frequentes (user_id, email)


- 8 categorias pré-cadastradas (Alimentação, Transporte, Moradia, Saúde, Lazer, Educação, Cartão de crédito, Outros)

---

## 🔒 Segurança Auditada

Este projeto passou por auditoria de segurança completa:

- 📄 `SECURITY_AUDIT_REPORT.md` - Vulnerabilidades identificadas (20)
- 📄 `SECURITY_AUDIT_VERIFICATION.md` - Status de correção (19/20 = 95%)

Todas as vulnerabilidades críticas foram corrigidas. O projeto está **seguro para produção** com algumas recomendações para implementação em ambiente production.

---

## 🤝 Contribuições

1. Faça um Fork
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Add nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

Contribuições são bem-vindas! Por favor, siga as boas práticas de segurança.

---

## 👨‍💻 Autor

<table>
<tr>
<td align="center">
	<a href="https://github.com/gusta-xis">
		<img src="https://github.com/gusta-xis.png" width="120px" style="border-radius: 50%;" alt="Avatar"/>
		<br/>
		<strong>Luiz Gustavo</strong>
		<br/>
		<sub>Desenvolvedor Full Stack</sub>
	</a>
</td>
</tr>
</table>

---

## 📞 Suporte

Encontrou um bug ou tem uma sugestão?

- 🐛 Abra uma [Issue](https://github.com/gusta-xis/gap/issues)
- 💬 Entre em contato via GitHub

---

## 📄 Licença

Este projeto está sob a licença **MIT**.  
Sinta-se livre para usar, modificar e distribuir.

```
MIT License

Copyright (c) 2025 Luiz Gustavo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 📚 Referências

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security](https://expressjs.com/en/advanced/best-practices-security.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Node.js Security](https://nodejs.org/en/docs/guides/security/)

---

**Última atualização:** 11 de Dezembro de 2025  
**Versão:** 1.0.0  
**Branch:** Dev
