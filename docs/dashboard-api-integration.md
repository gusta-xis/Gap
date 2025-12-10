# Dashboard Financeiro - Documentação da Integração Frontend/Backend

## 📋 Resumo

O dashboard financeiro foi conectado ao backend e agora exibe dados reais do usuário.

## 🔌 APIs Disponíveis

### Base URL
```
http://localhost:3000/api
```

### Autenticação
Todas as rotas (exceto login/registro) requerem token JWT no header:
```
Authorization: Bearer <token>
```

---

## 📊 Endpoints Financeiros

### 1. **Salários**

#### GET `/api/salarios/search?user_id={id}`
Busca o salário de um usuário específico
- **Auth**: Required
- **Response**: 
```json
{
  "id": 1,
  "user_id": 1,
  "valor": 7500.00,
  "data": "2024-01-01"
}
```

#### POST `/api/salarios`
Cria um novo registro de salário
- **Auth**: Required
- **Body**:
```json
{
  "user_id": 1,
  "valor": 7500.00,
  "data": "2024-01-01"
}
```

---

### 2. **Gastos Fixos**

#### GET `/api/gastos-fixos`
Lista todos os gastos fixos do usuário logado
- **Auth**: Required
- **Response**: 
```json
[
  {
    "id": 1,
    "user_id": 1,
    "descricao": "Aluguel",
    "valor": 1500.00,
    "categoria": "Moradia",
    "data": "2024-01-01"
  }
]
```

#### POST `/api/gastos-fixos`
Cria um novo gasto fixo
- **Auth**: Required
- **Body**:
```json
{
  "descricao": "Aluguel",
  "valor": 1500.00,
  "categoria": "Moradia"
}
```

#### PUT `/api/gastos-fixos/:id`
Atualiza um gasto fixo
- **Auth**: Required

#### DELETE `/api/gastos-fixos/:id`
Deleta um gasto fixo
- **Auth**: Required

---

### 3. **Gastos Variáveis**

#### GET `/api/gastos-variaveis`
Lista todos os gastos variáveis do usuário logado
- **Auth**: Required
- **Response**: 
```json
[
  {
    "id": 1,
    "user_id": 1,
    "descricao": "Supermercado",
    "valor": 345.80,
    "categoria": "Alimentação",
    "data": "2024-06-25"
  }
]
```

#### POST `/api/gastos-variaveis`
Cria um novo gasto variável
- **Auth**: Required
- **Body**:
```json
{
  "descricao": "Supermercado",
  "valor": 345.80,
  "categoria": "Alimentação",
  "data": "2024-06-25"
}
```

#### PUT `/api/gastos-variaveis/:id`
Atualiza um gasto variável
- **Auth**: Required

#### DELETE `/api/gastos-variaveis/:id`
Deleta um gasto variável
- **Auth**: Required

---

## 🎨 Frontend - Arquivos Criados/Modificados

### 1. **api-service.js**
Serviço centralizado para comunicação com o backend
- Gerenciamento de token JWT
- Métodos para todas as APIs (salários, gastos fixos, gastos variáveis)
- Tratamento de erros

### 2. **finance-dashboard.js**
Lógica do dashboard atualizada
- Carrega dados reais do backend
- Calcula totais de receitas e despesas
- Atualiza interface dinamicamente
- Mostra atividades recentes baseadas em dados reais

### 3. **finance-dashboard.html**
HTML atualizado com:
- Importação do api-service.js
- Data attributes para facilitar atualização via JS

---

## 🔄 Fluxo de Dados

1. **Carregamento da Página**
   - Verifica autenticação (token no localStorage)
   - Busca dados do usuário

2. **Busca de Dados**
   - Salário do usuário
   - Gastos fixos
   - Gastos variáveis do mês atual

3. **Cálculos**
   - Total de receitas = Salário
   - Total de despesas = Gastos fixos + Gastos variáveis (mês atual)
   - Saldo = Receitas - Despesas

4. **Atualização da UI**
   - Valores principais (saldo, receitas, despesas)
   - Nome do usuário
   - Atividades recentes (últimas 4 transações)

---

## 🚀 Como Usar

### 1. Iniciar o servidor
```bash
node server.js
```

### 2. Acessar o dashboard
```
http://localhost:3000/financeiro/dashboard
```

### 3. Dados de Teste
Para testar com dados reais, você precisa:
- Estar autenticado (ter token no localStorage)
- Ter dados de salário, gastos fixos e variáveis no banco

---

## 📝 Notas Importantes

- O dashboard busca dados do **mês atual** automaticamente
- As atividades recentes mostram as **4 transações mais recentes**
- Se não houver salário cadastrado, será exibido R$ 0,00
- O sistema detecta automaticamente o usuário logado via token JWT

---

## 🔐 Autenticação

O sistema usa localStorage para armazenar:
```javascript
localStorage.setItem('token', 'seu-token-jwt');
localStorage.setItem('user', JSON.stringify({
  id: 1,
  nome: 'Nome do Usuário',
  email: 'email@example.com'
}));
```

---

## 🎯 Próximos Passos

- [ ] Implementar gráfico com dados reais dos últimos meses
- [ ] Adicionar filtros por período
- [ ] Implementar modal para adicionar despesas diretamente do dashboard
- [ ] Adicionar notificações em tempo real
- [ ] Implementar dark mode toggle
