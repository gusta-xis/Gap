````markdown
# 📊 GAP — Sistema de Gestão Financeira

![Status](https://img.shields.io/badge/STATUS-EM_DESENVOLVIMENTO-orange?style=for-the-badge)
![License](https://img.shields.io/github/license/gusta-xis/gap?style=for-the-badge&color=blue)

> 🚧 **Projeto em Desenvolvimento (Work In Progress)**
>
> Este sistema está atualmente em fase ativa de construção. Estruturas de banco de dados, API e interfaces estão sujeitas a alterações constantes.

O **GAP** é um sistema web de gestão financeira projetado para ajudar usuários a organizar gastos, visualizar relatórios e acompanhar a saúde financeira de forma simples e intuitiva.

---

## 📸 Screenshots
*(Em breve: Adicione aqui GIFs ou imagens do sistema funcionando)*

---

## 🛠️ Tecnologias Utilizadas

### Front-end
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

### Back-end
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MySQL](https://img.shields.io/badge/MySQL-005C84?style=for-the-badge&logo=mysql&logoColor=white)

### Ferramentas
![VS Code](https://img.shields.io/badge/VS_Code-0078D4?style=for-the-badge&logo=visual%20studio%20code&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)

---

## ✨ Funcionalidades Planejadas

- [ ] 📥 Cadastro de transações (Entrada/Saída)
- [ ] 📊 Dashboard financeiro com gráficos
- [ ] 🗂️ Classificação por categorias
- [ ] 🔍 Filtro e busca de movimentações
- [ ] 👤 Autenticação de usuário
- [ ] 💾 Persistência de dados (MySQL)

---

## 📁 Estrutura do Projeto

```bash
/Gap
 ├── docs/                # Documentação e scripts SQL
 ├── public/              # Arquivos estáticos (CSS, JS, Imagens)
 ├── src/                 # Lógica da aplicação (Controllers, Models)
 ├── server.js            # Ponto de entrada do servidor
 ├── .env                 # Variáveis de ambiente (Configuração do Banco)
 └── package.json         # Dependências do projeto
````

-----

## 🚀 Como Rodar o Projeto Localmente

Siga os passos abaixo para configurar o ambiente de desenvolvimento:

### 1️⃣ Pré-requisitos

  * **Node.js** instalado na máquina.
  * **MySQL** instalado e rodando.
  * **Git** instalado.

### 2️⃣ Clonar e Instalar

```bash
# Clone este repositório
git clone [https://github.com/gusta-xis/gap.git](https://github.com/gusta-xis/gap.git)

# Acesse a pasta do projeto
cd gap

# Instale as dependências
npm install
```

### 3️⃣ Configurar Variáveis de Ambiente (.env)

Por segurança, o arquivo de configuração não é enviado para o GitHub.
Crie um arquivo chamado `.env` na raiz do projeto e configure suas credenciais:

```env
PORT=3000
DB_HOST=localhost
DB_USER=seu_usuario_mysql
DB_PASS=sua_senha_mysql
DB_NAME=gap_financeiro
```

### 4️⃣ Banco de Dados

Crie um banco de dados no MySQL com o nome definido no `.env` (ex: `gap_financeiro`) e execute o script SQL disponível na pasta `/docs` (se houver) para criar as tabelas.

### 5️⃣ Executar o Servidor

```bash
# Para rodar em modo de desenvolvimento (com nodemon)
npm run dev

# Para rodar em produção
npm start
```

O servidor iniciará em: `http://localhost:3000`

-----

## 👨‍💻 Autor

\<table\>
\<tr\>
\<td align="center"\>
\<a href="https://github.com/gusta-xis"\>
\<img src="https://www.google.com/search?q=https://github.com/gusta-xis.png" width="100px;" alt="Foto de Luiz Gustavo"/\><br>
\<sub\>
\<b\>Luiz Gustavo\</b\>
\</sub\>
\</a\>
\</td\>
\</tr\>
\</table\>

-----

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](https://www.google.com/search?q=LICENSE) para mais detalhes.

```
```
