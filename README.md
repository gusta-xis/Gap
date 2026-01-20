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
✔ **UX Aprimorada** - Feedback visual não-intrusivo (Toasts) e validação em tempo real  
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
- 📝 Logs com mascaramento de dados sensíveis
- 🚫 SQL Injection prevention (whitelist)
- 🎯 IDOR prevention (filtro por user_id)
- ✨ Sanitização Híbrida (Módulo `xss` + Fallback Regex)

---

## 🏗️ Visão Modular da Plataforma

O GAP é estruturado em **duas camadas principais:**

### **Camada 1: Núcleo (Gap-Core)**
- **Responsabilidade:** Autentica usuários, gerencia sessões e perfil.
- **APIs:** `/api/v1/users/*`

### **Camada 2: Módulos (Gap-Finance, Gap-Agenda, etc.)**
- **Responsabilidade:** Gerenciar funcionalidades específicas.
- **APIs:** `/api/v1/{recurso}/*`
  
---

## 📂 Estrutura do Projeto

```bash
/Gap
 ├── 📂 public/                       # Frontend (HTML, CSS, JS)
 │    ├── 📂 styles/                  # Estilos (Tailwind + Custom)
 │    ├── 📂 scripts/                 # Lógica JS (DOM, API Calls)
 │    └── *.html                      # Views
 │
 ├── 📂 src/                          # Backend (Node.js + Express)
 │    ├── api.js                      # Orquestração de rotas
 │    ├── 📂 config/                  # DB e Variáveis
 │    ├── 📂 middlewares/             # Security, Auth, Logging
 │    └── 📂 Modules/                 # Lógica de Negócio
 │         │
 │         ├── 📂 Gap-Core/           # 🔑 Autenticação e Usuários
 │         ├── 📂 Gap-Finance/        # 💰 Módulo Financeiro
 │         └── ... (Outros Módulos)
 │
 ├── 📂 docs/                         # Documentação Técnica
 ├── server.js                        # Entrypoint
 └── README.md                        # Documentação Geral
```

---

## 🚀 Como Rodar o Projeto

### 1️⃣ Pré-requisitos
- Node.js v18+
- MySQL 8.0+

### 2️⃣ Instalação
```bash
# Clone o repositório
git clone https://github.com/gusta-xis/gap.git
cd gap

# Instale dependências
npm install

# Configure o .env (use o .env.example como base)
cp .env.example .env

# Configure o Banco de Dados
mysql -u root -p < docs/script.sql

# Inicie o servidor
npm run dev
```

---

## 🔒 Status de Segurança

Este projeto segue rigorosos padrões de segurança:
- **XSS:** Inputs sanitizados automaticamente. Mensagens de erro seguras.
- **Auth:** Senhas nunca salvas em texto plano (Bcrypt). Sessões gerenciadas via JWT.
- **Monitoramento:** Logs de acesso mascarados (sem expor senhas).

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

## 📄 Licença

Este projeto está sob a licença **MIT**.

---

**Última atualização:** 20 de Janeiro de 2026  
**Versão:** 1.0.0  
**Branch:** Dev
