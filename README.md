# 🌐 GAP — Sistema de Gestão e Administração Pessoal

![Status](https://img.shields.io/badge/status-produção%20v1.0.0-succes)
![Node](https://img.shields.io/badge/Node.js-22.x-green?logo=node.js)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?logo=mysql)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

<!-- ALL-CONTRIBUTORS-BADGE:START -->
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

O **GAP** é um sistema para **gestão financeira e administração de permissões**, desenvolvido com foco em segurança e escalabilidade corporativa.  
Gerencie finanças pessoais, usuários e permissões hierárquicas com robustez e simplicidade.

---

## ⭐ Contribuidores do GitHub

Agradecimentos aos desenvolvedores do projeto!

<table>
  <tbody>
    <tr>
      <!-- Luiz Gustavo -->
      <td align="center" width="20%">
        <a href="https://github.com/gusta-xis">
          <img src="https://github.com/gusta-xis.png" width="100px" alt="Luiz Gustavo"/>
          <br />
          <sub><b>Luiz Gustavo</b></sub>
        </a>
        <br />
        <a href="https://www.linkedin.com/in/devdamascena/">
          <img src="https://img.shields.io/badge/-LinkedIn-blue?style=flat-square&logo=linkedin&logoColor=white" />
        </a>
      </td>
    </tr>
  </tbody>
</table>

---

## ✨ Funcionalidades

- **Gestão Financeira**: Controle de despesas fixas, variáveis, salários e metas.
- **Hierarquia RBAC**: 4 Níveis de acesso (Super Admin, Gerente, Admin, Usuário).
- **Segurança Avançada**: 
  - Login com Access/Refresh Tokens.
  - Sanitização automática de inputs.
  - Proteção contra Brute-force e XSS.
- **Dashboard**: Visualização gráfica de metas e gastos em tempo real.
- **API REST**: Arquitetura organizada e documentada.

---

# 🛠 Tecnologias

## 🚀 Back-end
![Node.js](https://img.shields.io/badge/Node.js-22+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-4.18-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL2](https://img.shields.io/badge/MySQL2-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Sequelize](https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Helmet](https://img.shields.io/badge/Helmet-Security-blue?style=for-the-badge)

---

## 🎨 Front-end
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Fetch API](https://img.shields.io/badge/Fetch_API-000000?style=for-the-badge)

---

## �️ Banco de Dados
![Relational](https://img.shields.io/badge/Relational_Model-4D4D4D?style=for-the-badge)
![Transactions](https://img.shields.io/badge/Transactions-00A8E8?style=for-the-badge)

- Tabelas principais: **Users**, **Gastos_Variaveis**, **Gastos_Fixos**, **Metas**
- Relacionamentos robustos via Foreign Keys.
- Migrações automáticas via código (Sync Check).

---

## 🧱 Arquitetura

![MVC](https://img.shields.io/badge/MVC_Modular-6C63FF?style=for-the-badge)
![Clean Code](https://img.shields.io/badge/Clean_Code-00BFA6?style=for-the-badge)
![Service Layer](https://img.shields.io/badge/Service_Layer-FF8C42?style=for-the-badge)

### Organização
- **Controllers**: Recebem requisições e validam permissões.
- **Services**: Contêm a lógica de negócio pura.
- **Models**: Interagem com o banco de dados (DAOs).

### Fluxo de Dados

```mermaid
flowchart TD
    A[Cliente / Frontend] -->|JSON| B[Rota / Middleware]
    B -->|Validação| C[Controller]
    C -->|Regra de Negócio| D[Service]
    D -->|Query SQL| E[Model]
    E -->|Dados| F[(MySQL Database)]
```

---

## 🤝 Como contribuir

Contribuições são super bem-vindas!  

1. Faça um **fork**  
2. Crie uma branch:
    ```bash
    git checkout -b feature/minha-melhoria
    ```
3. Faça suas alterações e commit:
    ```bash
    git commit -m "feat: adicionar nova funcionalidade"
    ```
4. Envie a branch:
    ```bash 
    git push origin feature/minha-melhoria
    ```
5. Abra um Pull Request ❤️

---
