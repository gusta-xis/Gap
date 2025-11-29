# 📊 GAP — Sistema de Gestão Financeira  
**Gerencie, acompanhe e entenda sua vida financeira de forma simples e eficiente.**

![Status](https://img.shields.io/badge/STATUS-EM_DESENVOLVIMENTO-orange?style=for-the-badge)
![Tecnologia](https://img.shields.io/badge/NODE.JS-Backend-green?style=for-the-badge)
![Banco](https://img.shields.io/badge/MySQL-Database-blue?style=for-the-badge)
![Licença](https://img.shields.io/badge/LICENSE-MIT-blue?style=for-the-badge)

---

## 📌 Sobre o Projeto

O **GAP** (Gestão de Acompanhamento Pessoal) é um sistema web criado para auxiliar usuários no **controle financeiro**, permitindo registrar transações, visualizar relatórios, acompanhar gastos por categoria e obter insights sobre sua saúde financeira.

O projeto está sendo desenvolvido com o objetivo de:

✔ Melhorar o controle financeiro diário  
✔ Facilitar a visualização de gastos  
✔ Automatizar cálculos e análises  
✔ Criar um painel intuitivo e funcional  

---

## 🎯 Objetivo Geral

Construir um sistema completo de controle financeiro, com:

- Dashboard interativo  
- Cadastro de receitas e despesas  
- Sistema de categorias  
- Histórico e relatórios  
- API organizada em MVC  
- Persistência em banco MySQL  
- Interface web responsiva  

---

## 🌐 Público-Alvo

Este projeto foi pensado para:

- Usuários que desejam organizar suas finanças  
- Pequenos empreendedores  
- Estudantes que querem aprender Node.js na prática  
- Pessoas buscando controle e clareza financeira  

---

## 🛠 Tecnologias Utilizadas

### **Frontend**
- HTML5  
- CSS3  
- JavaScript  

### **Backend**
- Node.js  
- Express.js  
- MySQL / MySQL2  
- Dotenv  
- Nodemon  

### **Ferramentas**
- Visual Studio Code  
- Git & GitHub  
- Insomnia / Postman  
- MySQL Workbench  

---

## 📁 Estrutura do Projeto

```bash
/Gap
 ├── public/               
 │    ├── css/
 │    ├── js/
 │    └── assets/
 │
 ├── src/
 │    ├── controllers/     # Regras de negócio
 │    ├── routes/          # Rotas da API
 │    ├── services/        # Funções de acesso ao banco
 │    ├── database/        # Conexão MySQL
 │    ├── middlewares/     # Validações e erros
 │    └── api.js           # Agrupamento das rotas
 │
 ├── docs/                 # Scripts SQL e documentação extra
 │
 ├── server.js             # Inicialização do servidor
 ├── .env                  # Variáveis de ambiente
 ├── package.json          # Dependências
 └── README.md             
```

---

## 🔌 Rotas da API (Endpoints)

### **Usuários**
| Método | Rota                 | Descrição |
|-------|----------------------|-----------|
| POST  | `/api/users/save`    | Salva novo usuário |
| GET   | `/api/users/findAll` | Lista todos os usuários |
| GET   | `/api/users/findById/:id` | Busca usuário pelo ID |
| DELETE | `/api/users/deleteById/:id` | Remove um usuário |
| PUT   | `/api/users/updateById/:id` | Atualização completa |
| PATCH | `/api/users/updatePartial/:id` | Atualização parcial |
| GET | `/api/users/findByEmail?email=` | Busca por email |

---

## 📊 Funcionalidades do Sistema

### ✔ Implementadas
- API modular em MVC  
- CRUD completo de usuários  
- Conexão confiável com MySQL  
- Rotas bem estruturadas  

### 🚀 Em Desenvolvimento
- Cadastro de transações financeiras  
- Dashboard com gráficos  
- Relatórios financeiros  
- Login e autenticação JWT  
- Telas completas do frontend  

---

## 🚀 Como Rodar o Projeto

### 1️⃣ Clonar o repositório
```bash
git clone https://github.com/gusta-xis/gap.git
cd gap
```

### 2️⃣ Instalar dependências
```bash
npm install
```

### 3️⃣ Criar o arquivo `.env`
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=sua_senha
DB_NAME=gap_financeiro
```

### 4️⃣ Iniciar o servidor
```bash
npm run dev
```

---

## 🗄 Banco de Dados

Crie o banco:

```sql
CREATE DATABASE gap_financeiro;
```

As tabelas serão adicionadas conforme o avanço do projeto.

---

## 🤝 Contribuições

1. Fork  
2. Crie uma branch  
3. Commit  
4. Pull request  

Contribuições são bem-vindas!  

---

## 👨‍💻 Autor

<table>
<tr>
<td align="center">
  <a href="https://github.com/gusta-xis">
    <img src="https://github.com/gusta-xis.png" width="120px" style="border-radius: 50%;" alt="Avatar"/><br>
    <sub><b>Luiz Gustavo</b></sub>
  </a>
</td>
</tr>
</table>

---

## 📄 Licença

Este projeto está sob a licença **MIT**.  
Sinta-se livre para usar e modificar.

