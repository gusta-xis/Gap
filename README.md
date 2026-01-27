# 📱 GAP — Sistema de Gestão e Administração Pessoal

**Organize, acompanhe e gerencie todos os aspectos da sua vida pessoal em um único lugar.**

![Status](https://img.shields.io/badge/STATUS-PRODUÇÃO%20(v1.0.0)-brightgreen?style=for-the-badge)
![Node.js](https://img.shields.io/badge/NODE.JS-v22-green?style=for-the-badge)
![Security](https://img.shields.io/badge/SECURITY-MAXIMUM-blue?style=for-the-badge)
![RBAC](https://img.shields.io/badge/ACCESS-TIERED-orange?style=for-the-badge)
![Licença](https://img.shields.io/badge/LICENSE-MIT-lightgrey?style=for-the-badge)

---

## 🚀 Visão Geral (v1.0.0)

O **GAP** (Gestão e Administração Pessoal) atingiu sua versão estável **1.0.0**. Esta versão representa um marco de transformação do sistema para uma arquitetura de nível corporativo (*Enterprise-Grade*), com foco absoluto em **Segurança (Hardening)**, **Hierarquia de Acesso (RBAC)** e **Código Limpo**.

### 🔒 Destaques da Versão 1.0.0:
- **Hardening de Servidor:** Implementação global de `Helmet`, `CSP` rigorosa e desativação de headers de fingerprinting (`X-Powered-By`).
- **Hierarquia de 4 Níveis:** Sistema de pesos (0 a 3) garantindo que usuários só gerenciem níveis inferiores ("Regra de Ouro").
- **Credenciais Automáticas:** Geração inteligente de IDs (`GAPxxxx` para Gerentes, `GAxxxxP` para Admins).
- **Sanitização Universal:** Proteção nativa contra XSS e NoSQL Injection em todas as camadas.

---

## 🏛️ Arquitetura Modular

```
🏠 GAP (Núcleo Central & Auth)
 ├── 🛡️ Camada de Segurança (Middlewares)
 ├── 👥 Gestão de Identidade (User Core)
 │
 ├── 💰 Módulo Financeiro (Ativo)
 │    ├── Despesas Variáveis & Fixas
 │    ├── Salários & Metas
 │    └── Dashboard em Tempo Real
 │
 ├── 📅 Módulo Agenda (Roadmap)
 └── 🏥 Módulo Saúde (Roadmap)
```

---

## 🛠 Tecnologias & Segurança

### Backend
- **Node.js + Express**: Core robusto e performático.
- **MySQL 8 + Sequelize**: Integridade de dados e Prepared Statements.
- **JWT (Dual Token)**: Access Token (15m) + Refresh Token (7d).
- **Security Stack**: `helmet`, `xss`, `rate-limit`, `cors`.

### Frontend
- **HTML5 + Vanilla JS**: Leveza e performance máxima.
- **Tailwind CSS**: Design responsivo e moderno.
- **Dynamic UI**: Interfaces que se adaptam ao nível de permissão do usuário.

---

## 🔑 Níveis de Acesso (RBAC)

O sistema implementa uma hierarquia estrita baseada em pesos:

| Cargo/Role | Peso | Permissões Principais | Identificador |
| :--- | :--- | :--- | :--- |
| **Super Admin** | **3** | Acesso Total, Criar Gerentes | `GAPxxxx` |
| **Manager** | **2** | Gerir Admins e Usuários | `GAPxxxx` |
| **Admin** | **1** | Gerir Usuários Padrão | `GAxxxxP` |
| **User** | **0** | Acesso Pessoal (Financeiro) | Email |

---

## 🚀 Instalação e Deploy

Consulte o nosso **Plano de Implantação** oficial para detalhes de infraestrutura:

📄 **[Ler PLANO_DE_IMPLANTACAO.md](./PLANO_DE_IMPLANTACAO.md)**

Para rodar localmente:

1. **Clone e Instale:**
   ```bash
   git clone https://github.com/gusta-xis/gap.git
   npm install
   ```

2. **Configure o `.env`:**
   ```env
   DB_HOST=127.0.0.1
   JWT_SECRET=seu_segredo_super_seguro
   NODE_ENV=development
   ```

3. **Inicie:**
   ```bash
   npm run dev
   ```
   *As migrações de banco de dados rodarão automaticamente.*

---

## 📚 Documentação Técnica

Para uma análise detalhada da arquitetura e decisões de código, consulte o Code Review final:

📄 **[Ler docs/code-review.md](./docs/code-review.md)**

---

## 👨‍💻 Autor

Desenvolvido por **Luiz Gustavo** com foco em excelência técnica e segurança.

---

**© 2026 GAP Systems.** *Código Limpo, Dados Seguros.*
